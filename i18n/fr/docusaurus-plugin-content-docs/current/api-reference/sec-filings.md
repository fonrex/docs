---
id: "sec-filings"
title: "Référence API des dépôts SEC (XBRL)"
sidebar_label: "Dépôts SEC (XBRL)"
description: "Les états annuels déposés auprès de la SEC, lus dans les faits XBRL d'EDGAR, et les états Yahoo vérifiés par rapport à eux"
---

# Référence API des dépôts SEC (XBRL)

Une société cotée aux États-Unis dépose son rapport annuel auprès de la [SEC](https://www.sec.gov/edgar), et chacun de ses chiffres est publié comme un **fait XBRL** : un concept (`us-gaap:Revenues`), une unité, une période, une valeur et le dépôt d'où il vient. Fonrex lit ces faits (API gratuite, sans clé), les garde dans votre base de données et s'en sert comme **source de vérification** des états enregistrés depuis Yahoo Finance.

| Route | Ce qu'elle fait |
|---|---|
| `GET /sec/{ticker}/statements` | Les états annuels déposés auprès de la SEC, chaque chiffre avec son concept et son dépôt |
| `GET /sec/{ticker}/check` | Les états Yahoo vérifiés par rapport aux dépôts SEC, chiffre par chiffre |
| `POST /sec/{ticker}/refresh` | Recherche à nouveau la société et lit ses faits tout de suite |

Les transactions d'initiés Form 4 restent sur [`GET /insider-transactions/{ticker}`](./specialized.md).

## Quels instruments

La SEC classe ses données par société, sous un **CIK** (Central Index Key). Fonrex ne le devine jamais à partir d'un ticker : `AIR.PA` est Airbus à Paris, alors que `AIR` à la SEC est AAR Corp, une société américaine. Un CIK pris sur le mauvais ticker donnerait les états d'une autre société, sans aucune erreur.

- Seule une **cotation américaine** de l'instrument est recherchée : cotée en USD, sur une bourse américaine, avec un ticker qui ne désigne aucune bourse étrangère. `AIR.PA` et `SAP.DE` ne sont jamais envoyés à la SEC.
- Le ticker doit figurer dans la [table de la SEC](https://www.sec.gov/files/company_tickers_exchange.json), et le **nom** de la société dans cette table doit correspondre au nom de l'instrument dans votre catalogue.
- Le CIK trouvé est gardé pour l'**instrument** (un ISIN) : toutes ses cotations partagent les mêmes dépôts. Un ADR a son propre ISIN, c'est donc un instrument à part : l'ADR de SAP au NYSE (`US8030542042`, nommé *ADR on SAP SE* ou *SAP SE ADR*) est trouvé, l'action allemande `SAP.DE` (`DE0007164600`) ne l'est pas.
- Quand plusieurs instruments partagent un ticker (`MSFT` pour Microsoft et pour un tracker Leverage Shares, par exemple), ajoutez `isin=` pour en choisir un.
- Un instrument sans cotation américaine reçoit `404` avec la raison. Il n'est pas recherché à nouveau pendant 7 jours ; `POST /sec/{ticker}/refresh` le recherche tout de suite (après l'ajout d'une cotation américaine, par exemple).
- Un CIK que vous renseignez vous-même dans `asset_mappings` (fournisseur `SEC`, `source` = `manual`, sans cotation) est accepté tel quel.

## Comment les états sont lus

- **Rapports annuels seulement** : formulaires `10-K` (sociétés américaines), `20-F` (sociétés étrangères), `40-F` (sociétés canadiennes) et leurs amendements.
- **Un exercice est une période de 350 à 380 jours** ; un chiffre du bilan est un fait à la date de fin d'exercice. Les chiffres sur neuf mois d'un rapport trimestriel ne sont jamais pris pour une année.
- **Le retraitement l'emporte** : un 10-K reprend les deux années précédentes et peut les corriger. Pour chaque période, la valeur du dépôt le plus récent est gardée, et le chiffre indique de quel dépôt il vient.
- **Plusieurs concepts pour un chiffre** : le chiffre d'affaires est `Revenues` chez JPMorgan, `RevenueFromContractWithCustomerExcludingAssessedTax` chez Apple, `Revenue` (IFRS) chez SAP. Chaque chiffre liste ses concepts dans l'ordre et le premier déposé pour l'année est pris ; la réponse le nomme.
- **Une seule devise par année** : celle du dernier rapport annuel. Une société étrangère qui publie en euros donne des euros, jamais un mélange d'euros et de dollars.
- **Valeurs telles que déposées** : les paiements (`capex`, `dividends_paid`, `stock_repurchases`) sont des montants **positifs**, là où Yahoo donne des flux négatifs. Un chiffre que la société ne dépose pas est absent : une banque n'a pas d'`operating_income`.

### Chiffres

| État | Chiffres |
|---|---|
| Compte de résultat | `revenue`, `gross_profit`, `operating_income`, `net_income`, `eps_basic`, `eps_diluted`, `shares_basic`, `shares_diluted`, `rd_expense`, `sga_expense`, `interest_expense`, `tax_provision` |
| Bilan | `total_assets`, `total_liabilities`, `total_equity`, `cash_and_equivalents`, `short_term_investments`, `accounts_receivable`, `inventory`, `goodwill`, `intangible_assets`, `long_term_debt`, `retained_earnings` |
| Flux de trésorerie | `operating_cashflow`, `investing_cashflow`, `financing_cashflow`, `capex`, `dividends_paid`, `stock_repurchases`, `depreciation_amortization` |

Les noms sont ceux des colonnes de `financial_statements` : un chiffre de la SEC et le même chiffre de Yahoo portent le même nom.

## Fraîcheur

Les faits d'une société sont lus depuis la SEC la première fois qu'on les demande, en une fois (un fichier par société, 4 à 8 Mo pour les plus grosses). Ensuite :

- une société lue il y a moins de **`SEC_XBRL_REFRESH_HOURS`** heures (24 par défaut) est servie depuis la base ;
- une société plus ancienne est relue ; un nouveau dépôt ajoute ses années et remplace les valeurs qu'il retraite ;
- quand la SEC ne répond pas, les chiffres enregistrés sont donnés avec `load.status` = `failed` et la raison.

Chaque réponse indique dans `load` ce qui a été fait : `fetched` (lu maintenant), `fresh` (lu récemment) ou `failed`, avec `last_filed` (le dépôt le plus récent gardé) et `facts` (le nombre de faits gardés).

La SEC demande à chaque client automatisé de donner une adresse de contact. Renseignez **`SEC_EDGAR_EMAIL`** avec votre propre adresse : l'API écrit un avertissement au démarrage tant que c'est l'adresse de l'exemple.

---

## <span className="api-method get">GET</span> `/sec/{ticker}/statements`

Les états annuels déposés auprès de la SEC, exercice le plus récent en premier.

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `years` | toutes les années | Nombre d'exercices les plus récents donnés (1 à 30) |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/statements?years=1"
```

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "entity_name": "Apple Inc.",
  "source": "SEC EDGAR, XBRL company facts (https://www.sec.gov/edgar)",
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-16T09:00:00Z",
    "last_filed": "2025-10-31",
    "facts": 1240,
    "reason": null
  },
  "years": [
    {
      "period_end": "2025-09-27",
      "currency": "USD",
      "figures": {
        "revenue": {
          "value": 416161000000.0,
          "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
          "taxonomy": "us-gaap",
          "unit": "USD",
          "form": "10-K",
          "filed": "2025-10-31",
          "accession": "0000320193-25-000079",
          "filing_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/"
        },
        "net_income": { "value": 112010000000.0, "concept": "NetIncomeLoss", "...": "..." },
        "eps_diluted": { "value": 7.46, "unit": "USD/shares", "...": "..." },
        "capex": { "value": 12715000000.0, "concept": "PaymentsToAcquirePropertyPlantAndEquipment", "...": "..." }
      }
    }
  ]
}
```

`period_end` est la fin de l'exercice telle que déposée : Apple clôt son année le dernier samedi de septembre. `filing_url` ouvre le dossier du dépôt sur EDGAR.

---

## <span className="api-method get">GET</span> `/sec/{ticker}/check`

Les états enregistrés depuis Yahoo vérifiés par rapport aux dépôts SEC. Pour chaque exercice déposé, chaque chiffre que les deux sources définissent de la même façon reçoit un statut :

| `status` | Sens |
|---|---|
| `match` | Même valeur, à **`SEC_CHECK_TOLERANCE`** près (1 % par défaut) |
| `mismatch` | Un écart plus grand que la tolérance : à regarder |
| `missing_yahoo` | Déposé auprès de la SEC, absent chez Yahoo |
| `missing_sec` | Donné par Yahoo, non déposé auprès de la SEC |

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `years` | toutes les années | Nombre d'exercices les plus récents donnés (1 à 30) |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

Comment les deux sources sont mises côte à côte :

- **Une année est associée par sa date de fin**, à deux semaines près au plus : Yahoo date au 30 l'exercice d'Apple clos le 27 septembre 2025. `yahoo_period_end` donne la date associée, `null` quand Yahoo n'a pas cette année.
- **`difference`** vaut `(yahoo - sec) / |sec|`, sous forme de ratio. Le capex, les dividendes versés et les charges d'intérêts sont comparés en **montants**, sans tenir compte du signe.
- **Chiffres comparés** : chiffre d'affaires, marge brute, résultat d'exploitation, résultat net, BPA et nombres d'actions (de base et dilués), charges d'intérêts, impôt sur le résultat, total de l'actif, total du passif, les trois flux de trésorerie, capex et dividendes versés.
- **Non comparés**, car les deux sources les définissent différemment (listés dans `not_compared`) : la trésorerie (Yahoo peut ajouter les placements à court terme) et les capitaux propres (Yahoo inclut les intérêts minoritaires).
- **Une année que Yahoo n'a pas** (enrichissement complet jamais lancé, ou Yahoo donne moins d'années) et **une année dans une autre devise** ne sont pas comparées : elles n'ont pas de chiffres et une `note` explique pourquoi.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/check?years=1"
```

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "entity_name": "Apple Inc.",
  "source": "SEC EDGAR, XBRL company facts (https://www.sec.gov/edgar)",
  "tolerance": 0.01,
  "not_compared": {
    "cash_and_equivalents": "Yahoo may add the short-term investments",
    "total_equity": "Yahoo includes the minority interests"
  },
  "load": { "status": "fresh", "...": "..." },
  "years": [
    {
      "period_end": "2025-09-27",
      "yahoo_period_end": "2025-09-30",
      "currency": "USD",
      "yahoo_currency": "USD",
      "note": null,
      "match": 14,
      "mismatch": 1,
      "missing_yahoo": 0,
      "missing_sec": 0,
      "figures": [
        {
          "column": "revenue",
          "statement": "income",
          "status": "match",
          "sec": 416161000000.0,
          "yahoo": 416161000000.0,
          "difference": 0.0,
          "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
          "filing_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/"
        },
        { "column": "capex", "statement": "cashflow", "status": "match", "sec": 12715000000.0, "yahoo": -12715000000.0, "difference": 0.0, "...": "..." }
      ]
    }
  ]
}
```

Les valeurs sont données à titre d'illustration. Un `mismatch` n'est pas toujours une erreur de Yahoo : vérifiez le chiffre dans le dépôt (`filing_url`) avant de corriger quoi que ce soit.

---

## <span className="api-method post">POST</span> `/sec/{ticker}/refresh`

Recherche à nouveau le CIK de l'instrument dans la table de la SEC et lit tout de suite les faits de la société, même s'ils ont été lus récemment. Demande une clé à accès complet : une clé en lecture seule reçoit `403`.

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/refresh"
```

La réponse donne `ticker`, `cik`, `entity_name` et le `load` de la lecture.

## Erreurs

| Statut | Quand |
|---|---|
| `404` | Ticker inconnu, ou aucune société déclarante à la SEC pour l'instrument (la raison est donnée : pas de cotation américaine, nom qui ne correspond pas…) |
| `422` | `years` en dehors de 1 à 30 |
| `502` | La SEC n'a pas pu être lue et rien n'est encore enregistré pour la société |
| `503` | Pas de base de données |

## Widget OpenBB

**Fonrex SEC Check** (`fonrex_sec_check`) affiche la vérification sous forme de tableau : une ligne par année et par chiffre, les écarts en premier, avec les valeurs SEC et Yahoo, l'écart en pourcentage, le concept XBRL et le lien vers le dépôt. Son paramètre `years` vaut 3 par défaut.

Il n'est pas dans les tableaux de bord pré-assemblés, qui suivent des tickers européens sans dépôt SEC : ajoutez-le à votre propre tableau de bord pour un ticker américain. Voir le [guide OpenBB Workspace](../guides/openbb-workspace.md).
