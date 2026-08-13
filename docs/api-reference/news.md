---
id: "news"
title: "News Aggregator API Reference"
sidebar_label: "News Aggregator"
description: "Endpoints for multi-source financial news feeds, ticker-specific articles, and background ingestion"
---

# News Aggregator API Reference

The News Aggregator API collects, deduplicates, and classifies financial news articles across 7 scrapers: Yahoo Finance, Google Finance, ZoneBourse, Boursorama, Investing.com, MarketWatch, and MSN Finance.

---

## <span className="api-method get">GET</span> `/news/{ticker}`

Retrieve financial news articles mentioning a specific ticker. Results are cached in Redis for 30 minutes.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Financial ticker (e.g. `AIR.PA`, `AAPL`) |
| `limit` | `integer` | ❌ | `20` | Number of articles |
| `lang` | `string` | ❌ | — | Language filter (`en`, `fr`) |

### Response Example

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

Retrieve global financial news feed across all assets.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `limit` | `integer` | ❌ | `20` | Maximum items to return |
| `lang` | `string` | ❌ | — | Filter by language (`en`, `fr`) |
| `provider` | `string` | ❌ | — | Filter by provider (e.g. `zonebourse_news`) |

---

## <span className="api-method post">POST</span> `/news/{ticker}/refresh`

Trigger an asynchronous background refresh of news scrapers for a ticker without blocking the request.

---

## <span className="api-method get">GET</span> `/news/stats`

Retrieve global news aggregator statistics (total articles indexed, provider breakdown, language counts).
