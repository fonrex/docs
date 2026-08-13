---
id: "news-providers"
title: "News Aggregator Providers"
sidebar_label: "News Providers"
description: "Documentation for the 7 financial news web scraper modules and deduplication logic"
---

# News Aggregator Providers

The `NewsService` module aggregates news articles from 7 scraping connectors:

## Provider Scraper Matrix

| Scraper Module | Provider Name | Method | Language | Deduplication Key |
|---|---|---|---|---|
| `yfinance_news.py` | Yahoo Finance | JSON API (`ticker.news`) | `en` | URL |
| `google_finance_news.py` | Google Finance | HTML / Embedded JSON | `en` | URL |
| `zonebourse_news.py` | ZoneBourse | HTML BeautifulSoup | `fr` | URL |
| `boursorama_news.py` | Boursorama | HTML BeautifulSoup | `fr` | URL |
| `investing_news.py` | Investing.com | HTML Scraper | `en` | URL |
| `marketwatch_news.py` | MarketWatch | HTML Scraper | `en` | URL |
| `msn_finance_news.py` | MSN Finance | JSON API Endpoint | `en` / `fr` | URL |

## News Deduplication Engine

To eliminate cross-posted articles across multiple news outlets, Fonrex enforces a two-tier deduplication algorithm:

1. **Exact URL Deduplication**: Database unique constraint `ON CONFLICT (url) DO UPDATE` in table `news_articles`.
2. **Title Similarity Matching**: Before inserting new articles into the database feed, Fonrex compares article titles using Python's `difflib.SequenceMatcher`. Titles with a similarity ratio exceeding `NEWS_DEDUP_SIMILARITY` (default `0.85`) are merged under the earliest publication timestamp.
