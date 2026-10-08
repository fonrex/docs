---
id: "assets"
title: "Référence API Actifs & Cotations"
sidebar_label: "Actifs & Cotations"
description: "Instruments, cotations et cours de clôture du catalogue Fonrex"
---

# Référence API Actifs & Cotations

Fonrex distingue un **instrument** (un ISIN, une ligne de `assets`) de ses **cotations** (une ligne de `asset_listings` par ticker, place et devise). Un même ETF coté en EUR et en USD est un seul instrument avec deux cotations, et chaque cotation a sa propre série de prix.

Toutes les routes de cette page exigent une clé d'API (`X-API-KEY` ou `Authorization: Bearer`).

---

## <span className="api-method get">GET</span> `/assets/by-isin/{isin}`

L'instrument d'un ISIN, avec sa cotation préférée et toutes ses cotations.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/assets/by-isin/NL0000235190"
```

```json
{
  "asset_id": 1,
  "name": "Airbus SE",
  "ticker": "AIR.PA",
  "exchange": "XPAR",
  "currency": "EUR",
  "sector": "Industrials",
  "industry": "Aerospace & Defense",
  "quote_type": "EQUITY",
  "isin": "NL0000235190",
  "listing_id": 1,
  "listings": [
    {
      "id": 1, "asset_id": 1, "ticker": "AIR.PA", "exchange": "XPAR", "currency": "EUR",
      "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import",
      "is_primary": true, "is_active": true
    },
    {
      "id": 2, "asset_id": 1, "ticker": "AIR.DE", "exchange": "XETR", "currency": "EUR",
      "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import",
      "is_primary": false, "is_active": true
    }
  ]
}
```

La réponse contient aussi `display_name`, `official_symbol`, `logo_path`, `ir_website` et `long_business_summary` lorsqu'ils sont connus. Un ISIN inconnu répond `404`.

---

## <span className="api-method get">GET</span> `/listings`

Les cotations actives qui correspondent aux filtres. Au moins un filtre est obligatoire (`400` sinon).

| Paramètre | Type | Description |
|---|---|---|
| `ticker` | string | Ticker de la cotation (ex. `AIR.PA`) |
| `isin` | string | ISIN de l'instrument |
| `exchange` | string | Code de la place tel qu'enregistré dans le catalogue |
| `currency` | string | Devise de la cotation (ex. `EUR`) |

```json
{
  "count": 2,
  "listings": [
    { "id": 1, "asset_id": 1, "ticker": "AIR.PA", "exchange": "XPAR", "currency": "EUR", "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import", "is_primary": true, "is_active": true }
  ]
}
```

---

## <span className="api-method get">GET</span> `/eod/{ticker}`

Les cours de clôture d'une cotation, en JSON ou en CSV. Lorsque rien n'est enregistré pour la requête, la cotation est d'abord ingérée (Yahoo Finance avec le symbole vérifié pour la cotation, TradingView en repli).

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker (10 caractères au plus : lettres, chiffres, `.` et `-`) |
| `period` | string | — | `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max`, `daily`, `weekly`, `monthly`. Obligatoire sauf si `from` et `to` sont fournis |
| `from`, `to` | date | — | Fenêtre `YYYY-MM-DD`, fournis ensemble |
| `fmt` | string | `json` | `json` ou `csv` |
| `order` | string | `a` | `a` (plus ancien d'abord) ou `d` (plus récent d'abord) |
| `currency` | string | — | Devise de la cotation, lorsque plusieurs cotations partagent le ticker |
| `exchange` | string | — | Place de la cotation, lorsque plusieurs cotations partagent le ticker |

`weekly` renvoie des barres hebdomadaires et `monthly` des barres mensuelles ; toutes les autres périodes renvoient des barres journalières. Sans `currency` ni `exchange`, c'est la cotation principale qui est utilisée.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/eod/AIR.PA?period=5d"
```

```json
{
  "ticker": "AIR.PA",
  "period": "5d",
  "format": "json",
  "count": 3,
  "retrieved_at": "2026-10-08T16:34:42.404598+00:00",
  "data_source": "database",
  "data": [
    { "Date": "2026-10-06", "Open": 153.44, "High": 155.44, "Low": 151.44, "Close": 154.44, "Adj Close": 154.44, "Volume": 1399000 },
    { "Date": "2026-10-07", "Open": 154.46, "High": 156.46, "Low": 152.46, "Close": 155.46, "Adj Close": 155.46, "Volume": 1400000 }
  ]
}
```

`Date` est la date de la séance. `data_source` vaut `database` lorsque les prix étaient déjà enregistrés, sinon la source de l'ingestion (`yfinance` ou `tradingview`). Les réponses sont mises en cache 24 heures dans Redis.

Avec `fmt=csv` :

```
Date,Open,High,Low,Close,Adj Close,Volume
2026-10-06,153.44,155.44,151.44,154.44,154.44,1399000
2026-10-07,154.46,156.46,152.46,155.46,155.46,1400000
```

### Erreurs

| Code | Corps | Quand |
|---|---|---|
| `400` | `{"error": "Invalid request", "message": "..."}` | Ticker, période, format, ordre ou dates invalides |
| `404` | `{"error": "No data found", "message": "...", "reason": "..."}` | Rien n'est enregistré et rien n'a pu être ingéré. `reason` explique pourquoi, par ex. aucun symbole Yahoo coté dans la devise de la cotation |

Voir [Ingérer des données historiques](../guides/ingest-historical-data.md) pour la façon dont le symbole source d'une cotation est choisi.
