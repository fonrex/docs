---
id: "python-jupyter"
title: "Utiliser Fonrex depuis Python et Jupyter"
sidebar_label: "Python & Jupyter"
description: "Charger les prix de votre instance Fonrex dans pandas, et remplacer les appels de prix OpenBB dans un notebook"
---

# Utiliser Fonrex depuis Python et Jupyter

Fonrex est une API HTTP : il n'existe pas de paquet Python `fonrex` à importer, et Fonrex n'est pas un fournisseur de la plateforme OpenBB (`obb`). Depuis Python, vous appelez votre instance avec `requests` et construisez des objets pandas à partir des réponses JSON. Une douzaine de lignes remplacent un appel comme `obb.equity.price.historical(...)`.

## Prérequis

- Une instance en cours d'exécution — voir [Installation](../getting-started/installation.md).
- Une clé d'API dans l'environnement, définie avant de lancer Jupyter. Une clé en **lecture seule** suffit pour lire les prix :

```bash
export FONREX_URL=http://localhost:5000
export FONREX_API_KEY=frx_live_...
jupyter lab
```

- Les cotations nécessaires dans le catalogue (section suivante).

## 1. Ajouter les cotations au catalogue

Fonrex stocke les prix par **cotation** d'un instrument identifié par son ISIN. Un ticker absent du catalogue n'a pas de prix : `GET /eod/{ticker}` répond `404` avec `"reason": "No listing found for ticker ..."`.

L'exemple ci-dessous utilise huit actions américaines et l'ETF SPY. Écrivez-les dans un fichier CSV ([le télécharger](pathname:///notebooks/us-hedging-listings.csv)) :

```csv
name,ticker,isin,productType,currency
Newmont Corporation,NEM,US6516391066,STOCK,USD
Royal Gold Inc,RGLD,US7802871084,STOCK,USD
SSR Mining Inc,SSRM,CA7847301032,STOCK,USD
Coeur Mining Inc,CDE,US1921085049,STOCK,USD
Eli Lilly and Co,LLY,US5324571083,STOCK,USD
UnitedHealth Group Inc,UNH,US91324P1021,STOCK,USD
Johnson & Johnson,JNJ,US4781601046,STOCK,USD
Merck & Co Inc,MRK,US58933Y1055,STOCK,USD
SPDR S&P 500 ETF Trust,SPY,US78462F1030,ETF,USD
```

Copiez le fichier dans le conteneur et importez-le :

```bash
docker compose cp us-hedging-listings.csv fonrex-api:/app/data/us-hedging-listings.csv
docker compose exec fonrex-api python import_assets.py --file data/us-hedging-listings.csv
```

Voir [Importer des actifs](import-assets.md) pour les règles du CSV.

## 2. Lire les prix dans pandas

`GET /eod/{ticker}` avec `from` et `to` renvoie les barres quotidiennes d'une période. Quand la base de données n'a aucune barre sur cette période, la route l'ingère d'abord depuis Yahoo Finance (avec le symbole vérifié pour la cotation) ; le premier appel d'un ticker prend donc quelques secondes.

Un ticker seul ne désigne pas toujours un seul instrument. Dans le catalogue par défaut, `NEM` est Newmont en USD, sa ligne australienne en AUD et Nemetschek en EUR ; `MRK` est aussi Merck KGaA, et `CDE` aussi City Developments. Désignez chaque instrument par son **ISIN** (`isin`) et la cotation par sa **devise** (`currency`) : ensemble, ils désignent une seule cotation.

```python
import os

import pandas as pd
import requests

FONREX_URL = os.environ.get("FONREX_URL", "http://localhost:5000")
FONREX_API_KEY = os.environ["FONREX_API_KEY"]


def fonrex_prices(instruments, start_date, end_date, currency="USD"):
    """Daily closing prices of several listings, one column per ticker.

    ``instruments`` maps each ticker to the ISIN of its instrument.
    """
    session = requests.Session()
    session.headers["X-API-KEY"] = FONREX_API_KEY
    closes = {}
    for ticker, isin in instruments.items():
        response = session.get(
            f"{FONREX_URL}/eod/{ticker}",
            params={"from": start_date, "to": end_date, "isin": isin, "currency": currency},
            timeout=120,  # the first call ingests the prices from Yahoo Finance
        )
        if response.status_code != 200:
            raise RuntimeError(f"{ticker}: {response.status_code} {response.text}")
        bars = pd.DataFrame(response.json()["data"])
        closes[ticker] = bars.set_index(pd.to_datetime(bars["Date"]))["Close"]
    data = pd.DataFrame(closes).sort_index(axis=1)
    data.index.name = "date"
    data.columns.name = "symbol"
    return data


data = fonrex_prices(
    {"NEM": "US6516391066", "LLY": "US5324571083", "SPY": "US78462F1030"},
    "2020-01-01",
    "2022-12-31",
)
```

Chaque barre contient `Date`, `Open`, `High`, `Low`, `Close`, `Adj Close` et `Volume`. La réponse donne aussi la cotation lue, `listing` (`ticker`, `isin`, `currency`, `exchange`) — voir [`GET /eod/{ticker}`](../api-reference/assets.md).

:::tip Sans l'ISIN
`isin` est facultatif. Sans lui, Fonrex prend, parmi les cotations qui portent le ticker, d'abord la cotation principale, puis par devise dans l'ordre alphabétique : `/eod/NEM` sans `isin` ni `currency` renvoie la ligne australienne en AUD. Avec `currency="USD"` seul, les neuf tickers de l'exemple se trouvent être uniques, mais 196 paires ticker et devise du catalogue par défaut appartiennent encore à plusieurs instruments. Vérifiez `listing.isin` dans la réponse lorsque vous ne passez pas `isin`.
:::

## Remplacer OpenBB dans un notebook

| OpenBB | Fonrex |
|---|---|
| `from openbb import obb` | `import requests` et la fonction `fonrex_prices()` ci-dessus |
| `obb.equity.price.historical(symbols, start_date=..., end_date=..., provider="yfinance")` | `fonrex_prices(instruments, start_date, end_date)`, où `instruments` associe chaque ticker à son ISIN |
| `.pivot(columns="symbol", values="close")` | Déjà fait : une colonne par symbole, index `date` |
| `obb.user.preferences.output_type = "dataframe"` | Inutile |

Le reste d'un notebook qui travaille sur le DataFrame (`pct_change()`, régressions, graphiques) ne change pas.

:::note Close ou Adj Close
`Close` est la clôture négociée, ajustée des seules divisions d'actions (splits) : c'est le choix par défaut du fournisseur `yfinance` d'OpenBB, donc le notebook donne les mêmes chiffres qu'avec OpenBB. `Adj Close` est aussi ajusté des dividendes : utilisez-le pour les rendements qui incluent les dividendes, le choix habituel pour mesurer l'alpha et le bêta.
:::

## Exemple de notebook : couverture du bêta

[beta-hedging-fonrex.ipynb](pathname:///notebooks/beta-hedging-fonrex.ipynb) construit un portefeuille équipondéré d'actions aurifères (NEM, RGLD, SSRM, CDE) et d'actions de santé (LLY, UNH, JNJ, MRK), estime son alpha et son bêta par rapport à SPY avec une régression MCO (`statsmodels`), puis construit un portefeuille couvert dont le bêta est proche de zéro.

Sa seule partie propre à Fonrex est le chargement des prix :

```python
instruments = {
    "NEM": "US6516391066",   # Newmont
    "RGLD": "US7802871084",  # Royal Gold
    "SSRM": "CA7847301032",  # SSR Mining
    "CDE": "US1921085049",   # Coeur Mining
    "LLY": "US5324571083",   # Eli Lilly
    "UNH": "US91324P1021",   # UnitedHealth
    "JNJ": "US4781601046",   # Johnson & Johnson
    "MRK": "US58933Y1055",   # Merck & Co
    "SPY": "US78462F1030",   # SPDR S&P 500 ETF
}
data = fonrex_prices(instruments, start_date="2020-01-01", end_date="2022-12-31")

benchmark_returns = data.pop("SPY").pct_change().dropna()
portfolio_returns = data.pct_change().dropna().sum(axis=1)
```

Importez les cotations de l'étape 1, définissez `FONREX_API_KEY`, puis ouvrez le notebook dans Jupyter.

## Dépannage

| Réponse | Cause |
|---|---|
| `401` | `FONREX_API_KEY` est absente ou n'est pas une clé de l'instance |
| `400` avec `L'ISIN ... n'est pas valide` | L'ISIN n'a pas 12 caractères (deux lettres, puis dix lettres ou chiffres) |
| `404` avec `No listing found for ticker` | Aucune cotation du catalogue n'a ce ticker avec cet ISIN et cette devise : importez-la, ou vérifiez l'ISIN |
| `404` avec une autre `reason` | L'ingestion a échoué, par exemple aucun symbole Yahoo coté dans la devise de la cotation |
| `404` `No data found` sans `reason`, ou moins de lignes que prévu | La base de données contient déjà d'autres dates de la cotation : `/eod` n'ingère qu'une période vide, et l'ingestion complète après la dernière date stockée. Récupérez à nouveau la période avec une clé à accès complet : `POST /historical/ingest?ticker=NEM&isin=US6516391066&currency=USD&from_date=2020-01-01&to_date=2022-12-31&force_refresh=true` |

## Pages liées

- [API des prix historiques](../api-reference/historical.md)
- [Ingérer des données historiques](ingest-historical-data.md)
- [Parcours Quant & Algo-Trader](../pathways/quant-trader.md)
