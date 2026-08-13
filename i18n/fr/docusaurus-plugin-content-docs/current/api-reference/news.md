---
id: "news"
title: "Référence API Agrégateur d'Actualités"
sidebar_label: "Agrégateur d'Actualités"
description: "Endpoints pour les flux d'actualités multi-sources, articles par ticker et ingestion en arrière-plan"
---


# Référence API Agrégateur d'Actualités

The Agrégateur d'Actualités API collects, deduplicates, and classifies financial news articles across 7 scrapers: Yahoo Finance, Google Finance, ZoneBourse, Boursorama, Investing.com, MarketWatch, and MSN Finance.

---

## <span className="api-method get">GET</span> `/news/{ticker}`

Récupérer les articles d'actualités financières mentionnant un ticker spécifique. Résultats mis en cache dans Redis pendant 30 minutes.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker financier (ex. `AIR.PA`, `AAPL`) |
| `limit` | `integer` | ❌ | `20` | Nombre d'articles |
| `lang` | `string` | ❌ | — | Filtre par langue (`en`, `fr`) |

### Exemple de Réponse

```json
{
  "ticker": "AIR.PA",
  "count": 2,
  "articles": [
    {
      "id": 842,
      "title": "Airbus Delivers 65 Aircraft in July, Reaffirms Full-Year Target",
      "summary": "Airbus reported strong commercial airplane deliveries for July...",
      "url": "https://www.marketwatch.com/story/airbus-delivers-65-aircraft-2026",
      "source": "MarketWatch",
      "provider": "marketwatch_news",
      "author": "Financial Desk",
      "published_at": "2026-08-10T14:30:00Z",
      "sentiment": "POSITIVE",
      "sentiment_score": 0.78,
      "language": "en"
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/news/feed`

Récupérer le flux d'actualités financières global pour tous les actifs.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `limit` | `integer` | ❌ | `20` | Nombre maximum d'articles à retourner |
| `lang` | `string` | ❌ | — | Filtrer par langue (`en`, `fr`) |
| `provider` | `string` | ❌ | — | Filtrer par provider (ex. `zonebourse_news`) |

---

## <span className="api-method post">POST</span> `/news/{ticker}/refresh`

Déclencher un rafraîchissement asynchrone en arrière-plan des scrapers d'actualités pour un ticker sans bloquer la requête.

---

## <span className="api-method get">GET</span> `/news/stats`

Récupérer les statistiques globales de l'agrégateur d'actualités (nombre total d'articles indexés, répartition par provider, totaux par langue).
