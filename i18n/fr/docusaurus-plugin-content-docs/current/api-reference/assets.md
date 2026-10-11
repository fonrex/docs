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
| `isin` | string | — | ISIN de l'instrument, lorsque plusieurs instruments partagent le ticker (12 caractères, sans distinction de casse) |

`weekly` renvoie des barres hebdomadaires et `monthly` des barres mensuelles ; toutes les autres périodes renvoient des barres journalières.

### Choisir la cotation {#choosing-the-listing}

Un ticker seul ne désigne pas toujours un seul instrument : dans le catalogue par défaut, `NEM` est Newmont en USD, sa ligne australienne en AUD et Nemetschek en EUR — trois ISIN. Fonrex prend, parmi les cotations qui portent le ticker, d'abord la cotation principale, puis par devise et par place dans l'ordre alphabétique : pour `NEM`, la ligne australienne en AUD.

- `isin` ne garde que les cotations d'un seul instrument. Une cotation d'un autre instrument n'est jamais renvoyée, même lorsque le ticker avec son suffixe n'est pas dans le catalogue (`MRK.DE` se replie sur `MRK` uniquement au sein de l'instrument indiqué).
- Un suffixe Yahoo désigne une place : sans cotation `AIR.PA`, Fonrex cherche `AIR` **à Paris uniquement** (place `XPAR`, `EPA`, `PAR` ou `PA`, ou sans place et cotée en EUR). `AIR` à New York (AAR Corp) n'est jamais pris ; la réponse est `404`. Un suffixe qui ne désigne aucune place (`BRK.B`) ne donne pas de recherche sans suffixe.
- `currency` et `exchange` choisissent parmi les cotations de cet instrument.

`isin` avec `currency` désigne une cotation sans ambiguïté : `GET /eod/NEM?period=1y&isin=US6516391066&currency=USD`. Un ISIN qui n'a pas 12 caractères (deux lettres, puis dix lettres ou chiffres) est refusé avec `400`.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/eod/AIR.PA?period=5d"
```

```json
{
  "ticker": "AIR.PA",
  "listing": { "ticker": "AIR.PA", "isin": "NL0000235190", "currency": "EUR", "exchange": "XPAR" },
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

`Open`, `High`, `Low` et `Close` sont les prix négociés, ajustés des splits ; `Adj Close` est la clôture ajustée des splits et des dividendes (la clôture quand la source n'en donne pas). `listing` est la cotation qui a été lue : comparez son `isin` avec l'instrument attendu. Son `exchange` vaut `null` lorsque le catalogue ne la connaît pas (tickers sans suffixe, comme les actions américaines). `Date` est la date de la séance. `data_source` vaut `database` lorsque les prix étaient déjà enregistrés, sinon la source de l'ingestion (`yfinance` ou `tradingview`). Les réponses sont mises en cache 24 heures dans Redis.

Avec `fmt=csv` :

```
Date,Open,High,Low,Close,Adj Close,Volume
2026-10-06,153.44,155.44,151.44,154.44,154.44,1399000
2026-10-07,154.46,156.46,152.46,155.46,155.46,1400000
```

### Erreurs

| Code | Corps | Quand |
|---|---|---|
| `400` | `{"error": "Invalid request", "message": "..."}` | Ticker, période, format, ordre, dates ou ISIN invalides |
| `404` | `{"error": "No data found", "message": "...", "reason": "..."}` | Rien n'est enregistré et rien n'a pu être ingéré. `reason` explique pourquoi, par ex. aucune cotation du ticker pour cet ISIN et cette devise (`No listing found for ticker NEM (ISIN DE0006452907, currency USD)`), ou aucun symbole Yahoo coté dans la devise de la cotation |

Voir [Ingérer des données historiques](../guides/ingest-historical-data.md) pour la façon dont le symbole source d'une cotation est choisi.
