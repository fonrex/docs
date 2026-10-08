---
id: "news-providers"
title: "News Aggregator Providers"
sidebar_label: "News Providers"
description: "The 7 news providers, their mappings and the deduplication of articles"
---

# News Aggregator Providers

`NewsService` (`news/news_service.py`) asks the seven providers of `news/providers/` in parallel for `GET /news/{ticker}`.

| Module | Source | Method | Language |
|---|---|---|---|
| `yfinance_news.py` | Yahoo Finance | `yfinance` (`ticker.news`), ticker as typed | `en` |
| `google_finance_news.py` | Google Finance | Embedded JSON, HTML fallback | Deduced from the ticker suffix |
| `zonebourse_news.py` | ZoneBourse | HTML | `fr` |
| `boursorama_news.py` | Boursorama | HTML | `fr` |
| `investing_news.py` | Investing.com | HTML, needs a mapping | `en` |
| `marketwatch_news.py` | MarketWatch | HTML | `en` |
| `msn_finance_news.py` | MSN Finance | JSON endpoint, HTML fallback | `en` |

## Mappings

Three providers read a mapping of the instrument, by provider name in lower case: ZoneBourse (`zonebourse`) and Boursorama (`boursorama`) share the mapping of the fundamentals provider of the same name; Investing.com needs a mapping named `investing_com` and returns nothing without it. The four others build their request from the ticker.

## Deduplication

1. **URL** — lower case, `utm_*` parameters, fragment and trailing slash removed; the first article received is kept.
2. **Title** — `difflib.SequenceMatcher` on normalised titles (lower case, no punctuation); at or above `NEWS_DEDUP_SIMILARITY` (0.85) the most recent article is kept.

With `language`, articles whose language is known and different are removed before deduplication. Articles are sorted newest first and cut to `limit`; each provider is asked for twice that number.

## Storage

Articles of instruments that are in the catalogue are upserted into `news_articles` (`ON CONFLICT (url) DO UPDATE`); `GET /news/feed` and `GET /news/stats` read that table. Old articles are not purged automatically.

A failing provider returns an empty list without blocking the others.
