---
id: "technical-indicators"
title: "Référence API Indicateurs Techniques"
sidebar_label: "Indicateurs Techniques"
description: "Calcul d'indicateurs de tendance, momentum, volatilité et volume, calcul par lot et screener de marché"
---


# Référence API Indicateurs Techniques

L'API des indicateurs techniques exploite le moteur de calcul `pandas-ta` pour calculer plus de 18 indicateurs techniques, retourner des superpositions de graphiques OHLCV, effectuer des calculs d'indicateurs par lot multi-tickers et filtrer les marchés selon des critères techniques.

---

## <span className="api-method get">GET</span> `/technical/{ticker}`

Calculer un indicateur technique unique pour un ticker.

:::note Prérequis
Nécessite au préalable l'ingestion des données historiques via `POST /historical/ingest?ticker={ticker}`. Retourne une erreur `404` (`{"detail": "No historical data found for {ticker}"}`) si aucune donnée historique n'est présente en base pour le ticker spécifié.
:::

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker financier (ex. `AIR.PA`) |
| `indicator` | `string` | ✅ | — | Code d'indicateur (`sma`, `ema`, `rsi`, `macd`, `bbands`, `stoch`, `atr`, `obv`, `adx`, `vwap`, etc.) |
| `period` | `integer` | ❌ | `14` | Période de calcul principale |
| `resolution` | `string` | ❌ | `d` | Résolution des bougies (`d`, `w`, `m`) |

### Exemple de Réponse

```json
{
  "ticker": "AIR.PA",
  "indicator": "rsi",
  "period": 14,
  "count": 50,
  "values": [
    { "time": "2026-08-10T00:00:00Z", "value": 58.42 },
    { "time": "2026-08-11T00:00:00Z", "value": 61.15 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/technical/{ticker}/multi`

Calculer plusieurs indicateurs techniques dans une seule requête HTTP.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Symbole ticker |
| `indicators` | `string` | ✅ | — | Liste d'indicateurs séparés par des virgules (ex. `rsi,sma,macd`) |
| `period` | `integer` | ❌ | `14` | Défaut period applied to simple indicators |

---

## <span className="api-method get">GET</span> `/technical/{ticker}/chart`

Récupérer des bougies OHLCV combinées avec des séries d'indicateurs techniques sélectionnées au format adapté aux bibliothèques graphiques (TradingView Lightweight Charts, Highcharts).

---

## <span className="api-method post">POST</span> `/technical/batch`

Calcul par lot sur plusieurs tickers et indicateurs.

### Corps de la Requête

```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "indicators": [
    { "name": "rsi", "period": 14 },
    { "name": "sma", "period": 50 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/technical/list`

Récupérer le catalogue des indicateurs techniques supportés, leurs paramètres par défaut et descriptions.

---

## <span className="api-method get">GET</span> `/technical/screen`

Filtrer les actifs en base de données selon des conditions techniques (ex. RSI sous le seuil de survente de 30).

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `indicator` | `string` | ✅ | — | Indicateur à évaluer (ex. `rsi`) |
| `condition` | `string` | ✅ | — | Opérateur logique (`lt`, `gt`, `crosses_above`, `crosses_below`) |
| `target_value` | `number` | ✅ | — | Seuil numérique (ex. `30.0`) |
