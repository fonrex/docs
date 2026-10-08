---
id: "news"
title: "News Aggregator API Reference"
sidebar_label: "News"
description: "News of a ticker from 7 providers, deduplicated, and the global feed of stored articles"
---

# News Aggregator API Reference

`GET /news/{ticker}` asks seven providers in parallel — Yahoo Finance, Google Finance, ZoneBourse, Boursorama, Investing.com, MarketWatch and MSN Finance — removes duplicates and stores the articles of instruments that are in the catalogue in `news_articles`. See [News providers](../providers/news-providers.md).

---

## <span className="api-method get">GET</span> `/news/{ticker}`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker (e.g. `AIR.PA`) |
| `limit` | integer | `20` | Articles returned (at most `NEWS_MAX_LIMIT`, 100) |
| `language` | string | — | Keep only this language (`en`, `fr`…); articles of unknown language are kept. `all` means no filter |
| `force_refresh` | boolean | `false` | Ignore the cached answer |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/news/AIR.PA?limit=5&language=fr"
```

```json
{
  "ticker": "AIR.PA",
  "isin": "NL0000235190",
  "count": 1,
  "providers": ["boursorama"],
  "cached": false,
  "articles": [
    {
      "title": "Airbus : livraisons en hausse en septembre",
      "summary": "...",
      "url": "https://www.boursorama.com/bourse/actualites/...",
      "image_url": null,
      "source": "Boursorama",
      "provider": "boursorama",
      "author": null,
      "published_at": "2026-10-08T07:45:00Z",
      "related_tickers": [],
      "language": "fr"
    }
  ]
}
```

Each answer is cached 30 minutes (`NEWS_CACHE_TTL`), separately for each `limit` and language. A provider that fails returns nothing without blocking the others.

### Deduplication

1. **URL**: lower case, `utm_*` parameters, fragment and trailing slash removed. The first article received is kept.
2. **Title similarity**: `difflib.SequenceMatcher` on normalised titles; at or above `NEWS_DEDUP_SIMILARITY` (0.85) the most recent article is kept.

Articles are then sorted newest first and cut to `limit` (each provider is asked for twice that number).

---

## <span className="api-method get">GET</span> `/news/feed`

The latest articles stored in `news_articles`, all instruments together. Nothing is fetched from the providers.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `50` | Articles returned |
| `language` | string | — | Language filter (`all` = none) |
| `tickers` | string | — | Comma-separated tickers; keeps the articles related to one of them |

```json
{ "count": 0, "from_date": null, "to_date": null, "articles": [] }
```

---

## <span className="api-method post">POST</span> `/news/{ticker}/refresh`

Fetch the news of a ticker again in the background and answer at once: `{"status": "queued", "ticker": "AIR.PA"}`. Full-access key only.

---

## <span className="api-method get">GET</span> `/news/stats`

```json
{
  "total_articles": 0,
  "by_provider": {},
  "by_language": {},
  "last_fetched_at": null,
  "top_assets": {}
}
```
