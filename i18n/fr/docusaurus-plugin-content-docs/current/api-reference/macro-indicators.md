---
id: "macro-indicators"
title: "Référence API des indicateurs macro (Eurostat)"
sidebar_label: "Indicateurs macro (Eurostat)"
description: "Inflation, chômage, croissance du PIB et enquêtes de conjoncture de la zone euro et de chaque pays de l'UE, lus sur Eurostat et conservés période par période"
---

# Référence API des indicateurs macro (Eurostat)

Fonrex lit les principaux indicateurs macroéconomiques de la zone euro et de chaque pays de l'Union européenne sur [Eurostat](https://ec.europa.eu/eurostat) (gratuit, sans clé) et les conserve dans votre base, période par période. C'est l'équivalent européen de ce que FRED donne pour les États-Unis : le contexte macro d'un portefeuille européen, et le tableau de bord *Macro Context* d'OpenBB.

| Route | Rôle |
|---|---|
| `GET /macro/indicators` | La dernière valeur de chaque indicateur pour un pays ou une zone |
| `GET /macro/indicators/{indicator}` | Un indicateur dans le temps, pour 10 pays au plus |
| `POST /macro/indicators/refresh` | Lit des séries sur Eurostat à la demande |

Les taux de FRED et de la BCE (taux sans risque, taux de dépôt, CISS) restent sur [`GET /macro/rates`](./valuation-dcf.md) ; la courbe de taux américaine, toutes les maturités jour par jour, est sur [`GET /macro/treasury/curve`](./treasury-curves.md).

## Indicateurs

| `indicator` | Ce que c'est | Fréquence | Unité | Flux Eurostat |
|---|---|---|---|---|
| `hicp` | Inflation IPCH, taux annuel | mensuelle | ratio | `prc_hicp_minr` |
| `hicp_core` | IPCH hors énergie, alimentation, alcool et tabac, taux annuel | mensuelle | ratio | `prc_hicp_minr` |
| `unemployment` | Taux de chômage, corrigé des variations saisonnières | mensuelle | ratio | `une_rt_m` |
| `gdp_qoq` | Croissance du PIB sur le trimestre précédent (volumes chaînés) | trimestrielle | ratio | `namq_10_gdp` |
| `gdp_yoy` | Croissance du PIB sur le même trimestre de l'année précédente | trimestrielle | ratio | `namq_10_gdp` |
| `economic_sentiment` | Indicateur du sentiment économique (100 = moyenne de long terme) | mensuelle | index | `ei_bssi_m_r2` |
| `consumer_confidence` | Confiance des consommateurs (solde des réponses positives et négatives) | mensuelle | balance | `ei_bssi_m_r2` |

- **Les taux sont des ratios** (`0.038` = 3,8 % ; Eurostat publie des pourcentages). Le sentiment économique et le solde de confiance sont gardés tels que publiés.
- **Une période est datée de son premier jour** : `2026-09-01` est septembre 2026, `2026-04-01` le deuxième trimestre 2026.
- **`status`** garde le marqueur d'Eurostat : `e` signale une estimation, comme l'inflation flash du dernier mois, remplacée par le chiffre définitif quelques semaines plus tard.
- **L'inflation** vient de `prc_hicp_minr`, le flux de la classification ECOICOP 2. L'ancien flux `prc_hicp_manr` s'est arrêté en décembre 2025.

## Pays et zones

`geo` prend les codes d'Eurostat : `DE`, `FR`, `IT`, `ES`, `NL`, `BE`, `AT`, `PT`, `IE`, `FI`… et `EU27_2020` pour l'Union européenne.

**`EA` est la zone euro**, lue comme `EA21` : sa composition depuis l'entrée de la Bulgarie en 2026, recalculée par Eurostat sur tout l'historique. Les flux du marché du travail et des enquêtes n'ont pas de code pour une composition variable : le même code sert donc partout.

## Fraîcheur et révisions

Une série est lue sur Eurostat la première fois qu'elle est demandée, en entier (inflation et chômage depuis 2000, PIB depuis 1995, enquêtes depuis les années 1980). Ensuite :

- une série lue il y a moins de **`EUROSTAT_REFRESH_HOURS`** heures (24 par défaut) est servie depuis la base ;
- une série plus ancienne est relue, à partir de 24 mois (8 trimestres pour le PIB) avant la dernière période stockée, pour qu'**une révision remplace la valeur de sa période** ;
- quand Eurostat ne répond pas, les valeurs stockées sont données avec `load.status` = `failed` et la raison.

Chaque réponse indique dans `load` ce qui a été fait : `fetched` (lu maintenant), `fresh` (lu récemment) ou `failed`.

---

## <span className="api-method get">GET</span> `/macro/indicators`

La dernière valeur de chaque indicateur pour un pays ou une zone, avec la période précédente et la variation.

| Paramètre | Par défaut | Description |
|---|---|---|
| `geo` | `EA` | Un pays ou une zone |
| `indicator` | tous les indicateurs | À répéter pour en garder certains : `indicator=hicp&indicator=unemployment` |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/macro/indicators?geo=EA"
```

```json
{
  "geo": "EA21",
  "source": "Eurostat, https://ec.europa.eu/eurostat",
  "indicators": [
    {
      "indicator": "hicp",
      "label": "HICP inflation, annual rate of change",
      "frequency": "monthly",
      "unit": "ratio",
      "period": "2026-09-01",
      "value": 0.038,
      "status": "e",
      "previous_period": "2026-08-01",
      "previous_value": 0.032,
      "change": 0.006,
      "load": {
        "status": "fresh",
        "fetched_at": "2026-10-15T09:00:00Z",
        "first_period": "2000-12-01",
        "last_period": "2026-09-01",
        "reason": null
      }
    },
    { "indicator": "unemployment", "unit": "ratio", "period": "2026-08-01", "value": 0.064, "...": "..." },
    { "indicator": "economic_sentiment", "unit": "index", "period": "2026-09-01", "value": 97.9, "change": -0.5, "...": "..." }
  ]
}
```

`change` vaut `value - previous_value`, dans l'unité de l'indicateur (0.006 correspond à 0,6 point de pourcentage). Une série qui n'a jamais pu être lue a `value` = `null` et donne la raison dans `load.reason`.

---

## <span className="api-method get">GET</span> `/macro/indicators/{indicator}`

Un indicateur dans le temps, une série par pays ou zone, de la plus ancienne période à la plus récente.

| Paramètre | Par défaut | Description |
|---|---|---|
| `geo` | `EA` | 10 pays ou zones au plus, séparés par des virgules |
| `start`, `end` | toute la série | Première et dernière période incluses (`AAAA-MM-JJ`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/indicators/hicp?geo=EA,FR,DE&start=2026-07-01"
```

```json
{
  "indicator": "hicp",
  "label": "HICP inflation, annual rate of change",
  "frequency": "monthly",
  "unit": "ratio",
  "source": "Eurostat, https://ec.europa.eu/eurostat",
  "series": [
    {
      "geo": "EA21",
      "load": { "status": "fresh", "...": "..." },
      "observations": [
        { "period": "2026-07-01", "value": 0.029, "status": null },
        { "period": "2026-08-01", "value": 0.032, "status": null },
        { "period": "2026-09-01", "value": 0.038, "status": "e" }
      ]
    },
    { "geo": "FR", "...": "..." },
    { "geo": "DE", "...": "..." }
  ]
}
```

---

## <span className="api-method post">POST</span> `/macro/indicators/refresh`

Lit des séries d'Eurostat dans la base. Demande une clé à accès complet : une clé en lecture seule reçoit `403`.

| Paramètre | Par défaut | Description |
|---|---|---|
| `geo` | `EA` | Pays ou zones, séparés par des virgules |
| `indicator` | tous les indicateurs | À répéter pour n'en lire que certains |
| `force` | `false` | Lire même une série lue récemment |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/indicators/refresh?geo=EA,FR,DE,IT,ES&force=true"
```

La réponse liste un `load` par série, avec `indicator`, `geo` et `received`, le nombre d'observations lues.

## Erreurs

| Statut | Quand |
|---|---|
| `404` | Indicateur inconnu |
| `422` | Un `geo` qui n'est pas un code, plus de 10 pays, plusieurs pays sur `GET /macro/indicators`, `start` après `end` |
| `503` | Pas de base de données |

Un code qu'Eurostat ne connaît pas (`geo=XX`) n'est pas une erreur de la requête : la série n'a pas de valeur et `load.reason` donne la réponse d'Eurostat (`GEO=XX` non autorisé).

## Widgets OpenBB

- **Fonrex Macro Indicators** (`fonrex_macro_indicators`) : une carte par indicateur pour un pays ; le delta est la variation sur la période précédente, en points de pourcentage pour un taux.
- **Fonrex Macro Indicator Chart** (`fonrex_macro_indicator_chart`) : un indicateur dans le temps, une ligne par pays, les 10 dernières années par défaut.

Les deux sont dans l'onglet *Macro Context* du tableau de bord **Fonrex — Screener & Macro**. Voir le [guide OpenBB Workspace](../guides/openbb-workspace.md).
