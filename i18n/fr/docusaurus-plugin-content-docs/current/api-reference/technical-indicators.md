---
id: "technical-indicators"
title: "Référence API Indicateurs techniques"
sidebar_label: "Indicateurs techniques"
description: "18 indicateurs techniques calculés côté serveur, requêtes multi-indicateurs, données de graphique et screener"
---

# Référence API Indicateurs techniques

Fonrex calcule 18 indicateurs avec pandas-ta sur les prix **enregistrés en base**. Ingérez une cotation avant de demander ses indicateurs (`GET /eod/{ticker}` ou `POST /historical/ingest`). Sans prix, `GET /technical/{ticker}` répond `404` ; `/multi` et `/chart` répondent sans barres, avec la raison dans `errors`.

| Catégorie | Indicateurs (paramètres par défaut) |
|---|---|
| Tendance | `sma` (20), `ema` (20), `wma` (20), `dema` (20), `tema` (20), `vwap` (intrajournalier uniquement) |
| Momentum | `rsi` (14), `macd` (12, 26, 9), `stoch` (14, 3, 3), `cci` (20), `roc` (10), `mom` (10) |
| Volatilité | `bbands` (20, 2.0), `atr` (14), `kc` (20) |
| Volume | `obv`, `ad`, `mfi` (14) |

`GET /technical/list` renvoie ce catalogue avec les paramètres, les colonnes de sortie et le nombre minimal de barres de chaque indicateur.

Les résolutions `1D` (par défaut), `1W` et `1M` lisent les cours de clôture de la cotation ; une résolution intrajournalière comme `1min` lit les bougies d'une minute enregistrées par le flux temps réel (`prices_intraday`). Les résultats sont mis en cache dans Redis (1 heure pour les barres journalières, 60 secondes pour les barres d'une minute) lorsque `TECHNICAL_CACHE_ENABLED=true`.

---

## <span className="api-method get">GET</span> `/technical/{ticker}`

Un indicateur.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `indicator` | string | `rsi` | Nom de l'indicateur |
| `period` | integer | — | Fixe le paramètre `length` (pas utilisé par `macd` et `stoch`, qui prennent `fast`/`slow`/`signal` ou leurs valeurs par défaut) |
| `fast`, `slow`, `signal` | integer | — | Paramètres du MACD |
| `std` | number | — | Écarts-types des bandes de Bollinger |
| `resolution` | string | `1D` | `1D`, `1W`, `1M`, ou intrajournalier (`1min`) |
| `from_date`, `to_date` | date | — | Fenêtre `YYYY-MM-DD` |
| `limit` | integer | `500` | Nombre de barres chargées (`TECHNICAL_DEFAULT_LIMIT`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14&limit=60"
```

```json
{
  "ticker": "AIR.PA",
  "indicator": "rsi",
  "params": { "length": 14 },
  "resolution": "1D",
  "category": "momentum",
  "from_date": "2026-07-16T00:00:00Z",
  "to_date": "2026-10-07T00:00:00Z",
  "count": 60,
  "series": [
    {
      "name": "RSI_14",
      "label": "RSI",
      "values": [
        { "t": "2026-07-16T00:00:00Z", "v": null },
        { "t": "2026-10-07T00:00:00Z", "v": "74.81" }
      ]
    }
  ],
  "cached": false,
  "calculated_at": "2026-10-08T16:34:58Z"
}
```

Un indicateur à plusieurs sorties (MACD, bandes de Bollinger, stochastique…) a une entrée par sortie dans `series`. Les valeurs sont des chaînes décimales, `null` tant que l'indicateur a trop peu de barres.

| Code | Quand |
|---|---|
| `400` | Indicateur inconnu, ou VWAP demandé sur des barres journalières |
| `404` | Aucun prix enregistré pour le ticker |
| `422` | Pas assez de barres pour les paramètres |

---

## <span className="api-method get">GET</span> `/technical/{ticker}/multi`

Plusieurs indicateurs calculés sur une seule lecture des prix.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `indicators` | string | `sma_20,ema_50,rsi_14,macd` | Noms séparés par des virgules ; un suffixe fixe le premier paramètre (`sma_50`, `bbands_20`) |
| `resolution`, `from_date`, `to_date`, `limit` | | | Comme ci-dessus |
| `include_ohlcv` | boolean | `false` | Renvoyer aussi les barres |

La réponse contient un résultat par indicateur dans `indicators` (même format que ci-dessus) et les échecs dans `errors`.

---

## <span className="api-method get">GET</span> `/technical/{ticker}/chart`

Les barres et les colonnes d'indicateurs alignées sur les mêmes horodatages, prêtes pour une bibliothèque de graphiques.

| Paramètre | Défaut |
|---|---|
| `indicators` | `sma_20,ema_50,volume` |
| `limit` | `200` |

```json
{
  "ticker": "AIR.PA",
  "resolution": "1D",
  "timestamps": ["2026-08-27", "2026-08-28"],
  "ohlcv": { "open": [158.14, 157.45], "high": [160.14, 159.45], "low": [156.14, 155.45], "close": [159.14, 158.45], "volume": [1359000, 1360000] },
  "indicators": { "SMA_20": [null, null], "RSI_14": [null, 0.0] }
}
```

---

## <span className="api-method post">POST</span> `/technical/batch`

Plusieurs tickers à la fois. Corps JSON :

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "MC.PA"],
  "indicators": ["rsi_14", "sma_50"],
  "resolution": "1D",
  "from_date": null,
  "to_date": null,
  "limit": 500,
  "include_ohlcv": false
}
```

Au plus `TECHNICAL_MAX_BATCH_TICKERS` tickers (20) et `TECHNICAL_MAX_BATCH_INDICATORS` indicateurs (10). La réponse associe à chaque ticker un résultat multi-indicateurs. Cette route ne fait que calculer : une clé en lecture seule peut l'appeler.

---

## <span className="api-method get">GET</span> `/technical/screen`

Les instruments du catalogue dont la dernière valeur d'un indicateur remplit une condition.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `indicator` | string | `rsi` | Indicateur |
| `operator` | string | `lt` | `lt`, `gt`, `lte`, `gte` |
| `value` | number | `30` | Seuil |
| `resolution` | string | `1D` | Résolution |
| `period` | integer | `14` | Longueur de l'indicateur |
| `limit` | integer | `50` | Nombre maximal de résultats |

```json
{
  "indicator": "rsi",
  "params": { "length": 14 },
  "operator": "gt",
  "value": 50.0,
  "resolution": "1D",
  "matches": [ { "ticker": "AIR.PA", "name": "Airbus SE", "isin": "NL0000235190", "value": "74.81" } ],
  "total": 1,
  "calculated_at": "2026-10-08T16:34:59Z"
}
```

Les résultats du screener sont mis en cache 15 minutes.
