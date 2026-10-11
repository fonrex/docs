---
id: "openbb"
title: "API d'intégration OpenBB Workspace"
sidebar_label: "Intégration OpenBB"
description: "Les routes /openbb et les fichiers de découverte qui alimentent les widgets d'OpenBB Workspace"
---

# API d'intégration OpenBB Workspace

Les routes `/openbb` servent les widgets d'[OpenBB Workspace](https://openbb.co) depuis votre propre instance. Chaque route appelle la route Fonrex qu'elle adapte et remet en forme la réponse dans l'un des trois formats attendus par OpenBB :

- **metric** : une liste de tuiles `[{"label": "...", "value": ..., "delta": ...}]`
- **chart** : une figure Plotly `{"data": [...], "layout": {...}}`
- **table** : une liste plate de lignes `[{...}, {...}]` pour AgGrid

La mise en place est décrite dans le [guide OpenBB Workspace](../guides/openbb-workspace.md).

## Authentification

| Route | Clé |
|---|---|
| `GET /widgets.json`, `GET /apps.json` | Aucune : OpenBB les récupère avant qu'une clé soit configurée |
| `GET /openbb/...` | Obligatoire, dans l'en-tête `X-API-KEY` (ou `Authorization: Bearer`) |

Une clé en lecture seule (`FONREX_READ_ONLY_API_KEYS`) suffit pour tous les widgets. CORS accepte les origines de `OPENBB_ALLOWED_ORIGIN` (`https://pro.openbb.co` par défaut).

## Fichiers de découverte

- `GET /widgets.json` : les 19 widgets, avec pour chacun son nom, sa catégorie, son type, sa route et ses paramètres (`integrations/openbb/widgets.json`).
- `GET /apps.json` : deux tableaux de bord pré-assemblés, **Fonrex — EU Markets** et **Fonrex — Screener & Macro** (`integrations/openbb/apps.json`).

## Routes

| Widget | Type | Route | Adapte |
|---|---|---|---|
| `fonrex_quote` | metric | `GET /openbb/quote/{ticker}` | `/quote/{ticker}` |
| `fonrex_macro_rates` | metric | `GET /openbb/macro/rates` | `/macro/rates` |
| `fonrex_eod` | chart | `GET /openbb/eod/{ticker}` (`period` 1y par défaut) | `/eod/{ticker}` |
| `fonrex_history` | chart | `GET /openbb/ticker/{symbol}/history` | `/ticker/{symbol}/history` |
| `fonrex_technical` | chart | `GET /openbb/technical/{ticker}` | `/technical/{ticker}` |
| `fonrex_technical_multi` | chart | `GET /openbb/technical/{ticker}/multi` | `/technical/{ticker}/multi` |
| `fonrex_technical_chart` | chart | `GET /openbb/technical/{ticker}/chart` | `/technical/{ticker}/chart` |
| `fonrex_fundamentals` | table | `GET /openbb/fundamental` | `/fundamental` |
| `fonrex_fundamentals_deep` | table | `GET /openbb/fundamental/deep` | `/fundamental/deep` |
| `fonrex_quotes_batch` | table | `GET /openbb/quotes` | `/quotes` |
| `fonrex_screener` | table | `GET /openbb/technical/screen` | `/technical/screen` |
| `fonrex_news` | table | `GET /openbb/news/{ticker}` | `/news/{ticker}` |
| `fonrex_news_feed` | table | `GET /openbb/news/feed` | `/news/feed` |
| `fonrex_dcf` | table | `GET /openbb/dcf/{ticker}` | `/dcf/{ticker}` |
| `fonrex_dcf_compare` | table | `GET /openbb/dcf/{ticker}/compare` | `/dcf/{ticker}/compare` |
| `fonrex_dcf_sensitivity` | table | `GET /openbb/dcf/{ticker}/sensitivity` | `/dcf/{ticker}/sensitivity` |
| `fonrex_insider_transactions` | table | `GET /openbb/insider-transactions/{ticker}` | `/insider-transactions/{ticker}` |
| `fonrex_etf_details` | table | `GET /openbb/etf/{isin}/details` | `/etf/{isin}/details` |
| `fonrex_index_constituents` | table | `GET /openbb/index/{index_name}/constituents` | `/index/{index_name}/constituents` |

Le widget macro prend un paramètre `currency` (`USD`, `EUR`, ou vide pour les deux) et affiche une carte par série : le taux américain à 10 ans, le taux AAA de la zone euro à 10 ans, le taux de dépôt de la BCE et l'indice de stress CISS.

Chaque route accepte les paramètres de la route qu'elle adapte (voir la page de référence API correspondante), avec quelques différences : `/openbb/fundamental` n'a pas de `fmt` ; `/openbb/technical/{ticker}/multi` n'a pas de `include_ohlcv` et utilise `sma_20,ema_50,rsi_14` par défaut ; `/openbb/technical/{ticker}/chart` utilise `sma_20,rsi_14` par défaut ; `/openbb/news/feed` renvoie 20 articles par défaut.

`GET /openbb/quote/{ticker}` ne démarre jamais de flux temps réel : la cotation est en temps réel une fois le ticker abonné avec `POST /realtime/subscribe`, et c'est le prix différé de Yahoo Finance sinon.

## Exemple

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/openbb/quote/AIR.PA"
```

```json
[
  { "label": "AIR.PA Price", "value": 154.6, "delta": 0.13 },
  { "label": "Change", "value": "+0.20", "delta": "+0.13%" },
  { "label": "Previous Close", "value": 154.4, "delta": null },
  { "label": "Day High", "value": 155.48, "delta": null },
  { "label": "Day Low", "value": 155.1, "delta": null },
  { "label": "Volume", "value": 18250, "delta": null }
]
```

Cet exemple est une cotation différée de Yahoo Finance. Les tuiles sans valeur (pas de clôture précédente, pas de volume…) sont omises.
