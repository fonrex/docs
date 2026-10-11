---
id: "factors"
title: "Référence de l'API des facteurs Fama/French"
sidebar_label: "Facteurs Fama/French"
description: "Rendements des facteurs de la Kenneth French Data Library, exposition d'une cotation aux facteurs, et taux de change de la BCE utilisés pour la comparer en dollars US"
---

# Référence de l'API des facteurs Fama/French

Fonrex stocke les rendements des facteurs de la [Kenneth R. French Data Library](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html) (gratuite, sans clé) et mesure l'exposition d'une cotation à ces facteurs : marché, taille, valeur, rentabilité, investissement et momentum.

| Route | Rôle |
|---|---|
| `GET /factors` | Les jeux de données, et ce qui est stocké de chaque fichier |
| `GET /factors/{dataset}` | Les rendements des facteurs d'un jeu de données |
| `POST /factors/refresh` | Télécharge des fichiers de la bibliothèque |
| `GET /factors/exposure/{ticker}` | L'exposition d'une cotation aux facteurs : bêtas, alpha, R² |

Les facteurs peuvent aussi servir au coût des fonds propres d'une valorisation : voir [`cost_of_equity_model`](./valuation-dcf.md#factor-cost-of-equity).

## Jeux de données {#datasets}

Neuf jeux de données, chacun en **mensuel** et en **journalier** :

| Jeu de données | Facteurs |
|---|---|
| `us_3`, `europe_3`, `developed_3` | `MKT_RF`, `SMB`, `HML`, `RF` |
| `us_5`, `europe_5`, `developed_5` | `MKT_RF`, `SMB`, `HML`, `RMW`, `CMA`, `RF` |
| `us_mom`, `europe_mom`, `developed_mom` | `MOM` |

- `MKT_RF` : le rendement du marché moins le taux sans risque. `SMB` : petites moins grandes capitalisations (taille). `HML` : ratio valeur comptable / cours élevé moins faible (valeur). `RMW` : rentabilité forte moins faible. `CMA` : investissement prudent moins agressif. `MOM` : gagnants moins perdants de l'année écoulée (momentum). `RF` : le taux des bons du Trésor américain à un mois.
- **Tous les rendements sont en dollars US**, y compris ceux de l'Europe et des marchés développés, et `RF` est le taux américain pour toutes les régions.
- Les valeurs sont des **ratios** (`0.0289` = 2,89 % ; la bibliothèque publie des pourcentages). Un mois est daté de son dernier jour.
- Historique : les États-Unis depuis 1926 (1963 pour les 5 facteurs), l'Europe et les marchés développés depuis 1990. Les fichiers mensuels paraissent avec un ou deux mois de retard.

## Charger les fichiers {#loading-the-files}

Un fichier est téléchargé à sa première utilisation. Pour les charger à l'avance :

```bash
docker compose exec fonrex-api python scripts/load_factors.py
docker compose exec fonrex-api python scripts/load_factors.py --dataset us_5 europe_5 --frequency monthly daily
```

Sans option, le script charge le fichier mensuel de chaque jeu de données. Un fichier lu il y a moins de `FACTORS_REFRESH_DAYS` jours (7 par défaut) n'est pas retéléchargé ; `--force` le télécharge quand même. Un téléchargement qui échoue conserve les valeurs stockées.

---

## <span className="api-method get">GET</span> `/factors`

Les neuf jeux de données, avec ce que la base contient de chaque fichier. Ne télécharge rien.

```json
{
  "source": "Kenneth R. French Data Library, https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html",
  "datasets": [
    {
      "dataset": "us_3",
      "region": "us",
      "label": "US 3 factors",
      "factors": ["MKT_RF", "SMB", "HML", "RF"],
      "currency": "USD",
      "loads": [
        {
          "dataset": "us_3",
          "frequency": "monthly",
          "status": "fresh",
          "fetched_at": "2026-10-10T15:25:00Z",
          "first_period": "1926-07-31",
          "last_period": "2026-08-31",
          "periods": 1202,
          "source_note": "CRSP 202608",
          "reason": null
        },
        { "dataset": "us_3", "frequency": "daily", "status": "missing", "periods": 0, "...": "..." }
      ]
    }
  ]
}
```

`status` :

| Valeur | Signification |
|---|---|
| `fetched` | Téléchargé pour cette réponse |
| `fresh` | Téléchargé il y a moins de `FACTORS_REFRESH_DAYS` jours |
| `stale` | Téléchargé avant : il sera retéléchargé à la prochaine lecture |
| `failed` | Le dernier téléchargement a échoué (`reason`) ; les valeurs stockées sont conservées |
| `missing` | Jamais téléchargé |

`source_note` est la base de données à partir de laquelle la bibliothèque a construit le fichier (`CRSP 202608` : données CRSP jusqu'à août 2026).

---

## <span className="api-method get">GET</span> `/factors/{dataset}`

Les rendements d'un jeu de données, de la période la plus ancienne à la plus récente. Un fichier jamais téléchargé, ou plus ancien que `FACTORS_REFRESH_DAYS` jours, est d'abord téléchargé.

| Paramètre | Défaut | Description |
|---|---|---|
| `frequency` | `monthly` | `monthly` ou `daily` |
| `start`, `end` | — | Première et dernière période incluses (`AAAA-MM-JJ`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/us_3?start=2026-07-01"
```

```json
{
  "dataset": "us_3",
  "frequency": "monthly",
  "region": "us",
  "label": "US 3 factors",
  "factors": ["MKT_RF", "SMB", "HML", "RF"],
  "currency": "USD",
  "unit": "ratio",
  "source": "Kenneth R. French Data Library, https://...",
  "load": { "status": "fresh", "last_period": "2026-08-31", "periods": 1202, "source_note": "CRSP 202608", "...": "..." },
  "data": [
    { "date": "2026-07-31", "MKT_RF": -0.0061, "SMB": -0.0192, "HML": 0.0211, "RF": 0.0033 },
    { "date": "2026-08-31", "MKT_RF": 0.0256, "SMB": 0.0034, "HML": -0.0354, "RF": 0.0029 }
  ]
}
```

Les chiffres sont donnés à titre d'exemple. Quand un téléchargement échoue, les valeurs stockées sont renvoyées avec `load.status` = `failed`.

| Code | Cas |
|---|---|
| `404` | Jeu de données inconnu |
| `422` | `start` après `end`, ou `frequency` inconnue |
| `503` | Rien de stocké et le téléchargement a échoué, ou pas de base de données |

---

## <span className="api-method post">POST</span> `/factors/refresh`

Télécharge des fichiers de la bibliothèque dans la base. Cette route modifie la base : il faut une **clé à accès complet**.

| Paramètre | Défaut | Description |
|---|---|---|
| `dataset` | tous les jeux de données | À répéter pour plusieurs : `?dataset=us_3&dataset=europe_3` |
| `frequency` | `monthly` | À répéter pour les deux : `?frequency=monthly&frequency=daily` |
| `force` | `false` | Télécharger même un fichier lu récemment |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/refresh?dataset=europe_5&frequency=monthly&frequency=daily"
```

La réponse liste un `load` par fichier, avec les mêmes champs que `GET /factors`. Un fichier lu il y a moins de `FACTORS_REFRESH_DAYS` jours garde son statut `fresh` et n'est pas téléchargé.

---

## <span className="api-method get">GET</span> `/factors/exposure/{ticker}`

Régresse les rendements excédentaires d'une cotation sur les facteurs de sa région, par moindres carrés ordinaires :

> r − RF = α + Σ βₖ · Fₖ + ε

| Paramètre | Défaut | Description |
|---|---|---|
| `model` | `ff3` | `ff3` (MKT_RF, SMB, HML), `ff5` (plus RMW, CMA) ou `carhart` (ff3 plus MOM) |
| `frequency` | `monthly` | `monthly` ou `daily` |
| `window` | 60 mois ou 252 jours | Nombre de périodes régressées (24 à 10 000) |
| `end` | dernière période disponible | Dernière période de la régression |
| `region` | selon la devise | `us`, `europe` ou `developed` |
| `currency`, `exchange`, `isin` | — | Choisissent la cotation, comme sur les routes de prix |

**D'abord les prix.** La régression lit les clôtures journalières stockées pour la cotation (`adj_close`, dividendes compris). Ingérez-les avant :

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/historical/ingest?ticker=AIR.PA"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/exposure/AIR.PA?model=ff5"
```

**Région.** Une cotation en USD prend les facteurs américains ; dans une devise européenne (EUR, GBP, CHF, SEK, DKK, NOK…), les facteurs européens ; dans toute autre devise, ceux des marchés développés. `region` en choisit une autre.

**Rendements en dollars US.** Les facteurs sont en dollars : les clôtures d'une cotation dans une autre devise sont converties au cours de référence de la BCE de leur jour (ou au dernier connu dans la semaine) avant le calcul des rendements ; `converted_from` donne la devise d'origine. Une clôture sans cours dans la semaine est écartée, avec un avertissement. Un prix en pence est d'abord converti en livres. Les cours sont téléchargés au besoin : voir [Taux de change](#exchange-rates).

**Périodes.** Un rendement mensuel va de la dernière clôture d'un mois à la dernière clôture du mois suivant ; un rendement journalier, d'une clôture à la suivante. La régression garde les `window` dernières périodes qui ont un rendement et tous les facteurs.

| Périodes disponibles | Résultat |
|---|---|
| moins de 24 mois (60 jours) | `422` |
| moins de 36 mois (126 jours) | Mesurée, avec un avertissement : les estimations sont imprécises |

```json
{
  "ticker": "AIR.PA",
  "listing": { "ticker": "AIR", "isin": "NL0000235190", "currency": "EUR", "exchange": "XPAR" },
  "model": "ff5",
  "region": "europe",
  "frequency": "monthly",
  "datasets": ["europe_5"],
  "return_currency": "USD",
  "converted_from": "EUR",
  "start": "2021-09-30",
  "end": "2026-08-31",
  "periods": 60,
  "alpha": { "value": 0.0021, "std_error": 0.0035, "t_stat": 0.6, "annualized": 0.0252 },
  "betas": {
    "MKT_RF": { "value": 1.21, "std_error": 0.14, "t_stat": 8.64 },
    "SMB": { "value": -0.35, "std_error": 0.31, "t_stat": -1.13 },
    "HML": { "value": 0.42, "std_error": 0.22, "t_stat": 1.91 },
    "RMW": { "value": 0.18, "std_error": 0.37, "t_stat": 0.49 },
    "CMA": { "value": -0.27, "std_error": 0.41, "t_stat": -0.66 }
  },
  "r_squared": 0.58,
  "adj_r_squared": 0.54,
  "residual_volatility": 0.21,
  "warnings": [],
  "source": "Kenneth R. French Data Library, https://..."
}
```

Les chiffres sont donnés à titre d'exemple.

- `alpha.value` est par période ; `alpha.annualized` le multiplie par 12 (mensuel) ou 252 (journalier).
- `t_stat` = valeur / erreur type. Une valeur absolue inférieure à 2 signifie que le coefficient n'est pas nettement différent de zéro.
- `residual_volatility` : l'écart type annualisé de ce que les facteurs n'expliquent pas (le risque propre à la cotation).

| Code | Cas |
|---|---|
| `404` | Cotation inconnue, ou aucun prix journalier stocké |
| `422` | Trop peu de périodes, ou paramètre hors limites |
| `503` | Aucun fichier de facteurs ou aucun cours de la BCE n'a pu être téléchargé, ou pas de base de données |

---

## Taux de change {#exchange-rates}

Pour convertir les prix en dollars, Fonrex conserve les **cours de référence de la BCE** de l'euro, jour par jour depuis 1999 (gratuits, sans clé), dans la table `fx_rates`. Le cours entre deux devises passe par l'euro : dollars par livre = (USD par EUR) / (GBP par EUR). Une devise lue il y a moins de `FX_RATES_REFRESH_HOURS` heures (12 par défaut) n'est pas redemandée ; une mise à jour ne demande que les nouveaux jours.

La route d'exposition télécharge les cours dont elle a besoin. Pour les charger à l'avance (USD, GBP, CHF, SEK, DKK, NOK, JPY, CAD, AUD et HKD par défaut) :

```bash
docker compose exec fonrex-api python scripts/load_fx_rates.py
docker compose exec fonrex-api python scripts/load_fx_rates.py --currency USD GBP CHF --force
```

## Réglages {#settings}

| Variable | Défaut | Description |
|---|---|---|
| `FACTORS_REFRESH_DAYS` | `7` | Jours avant qu'un fichier de facteurs soit retéléchargé (1 à 90) ; la bibliothèque est mise à jour environ une fois par mois |
| `FRENCH_LIBRARY_URL` | `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp` | Adresse des fichiers de la bibliothèque ; à définir seulement pour utiliser un miroir |
| `FX_RATES_REFRESH_HOURS` | `12` | Heures avant que les cours BCE d'une devise soient redemandés (1 à 720) |

## Dans OpenBB Workspace {#in-openbb-workspace}

Deux widgets affichent ces routes : **Fonrex Factor Exposure** (tableau) et **Fonrex Factor Returns** (graphique des rendements cumulés). Voir la [référence OpenBB](./openbb.md).
