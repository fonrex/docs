---
id: "configuration"
title: "系统配置"
sidebar_label: "Configuration"
description: "Fonrex 环境变量和运行时设置的完整参考"
---


# 系统配置

Fonrex 使用 `.env` 中指定的环境变量进行配置。以下是按应用子系统分类的受支持变量的完整表格。

## 数据库与缓存

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://fonrex:fonrex_password@localhost:5432/fonrex` | ✅ | Primary PostgreSQL/TimescaleDB connection string |
| `ASYNC_DATABASE_URL` | Auto-derived from `DATABASE_URL` | ❌ | AsyncPG connection string for asynchronous workers |
| `POSTGRES_DB` | `fonrex` | ✅ | PostgreSQL database name |
| `POSTGRES_USER` | `fonrex` | ✅ | PostgreSQL username |
| `POSTGRES_PASSWORD` | `fonrex_password` | ✅ | PostgreSQL password |
| `REDIS_URL` | `redis://localhost:6379/0` | ✅ | Redis instance URL |
| `CACHE_TTL` | `300` | ❌ | 默认值 API cache TTL in seconds (5 minutes) |

## 专业数据提供商

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `OPENFIGI_API_KEY` | `""` | ❌ | Optional OpenFIGI API key for higher rate limits |
| `SEC_EDGAR_EMAIL` | `contact@fonrex.io` | ✅ | Contact email sent in HTTP User-Agent header to SEC EDGAR |

## 历史摄取

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `INGEST_CONCURRENCY` | `5` | ❌ | 批量摄取期间的并行 Worker 线程数 |
| `INGEST_YF_DELAY` | `0.5` | ❌ | Delay in seconds between consecutive Yahoo Finance requests |
| `INGEST_TV_DELAY` | `2.0` | ❌ | Delay in seconds between TradingView historical requests |
| `INGEST_BATCH_SIZE` | `1000` | ❌ | Batch size for SQL `INSERT ... ON CONFLICT` statements |

## 实时流传输

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `TV_MAX_CONNECTIONS` | `10` | ❌ | Maximum simultaneous TradingView WebSocket connections |
| `TV_RECONNECT_DELAY` | `5` | ❌ | Initial reconnect delay in seconds (exponential backoff) |
| `REALTIME_QUOTE_TTL` | `60` | ❌ | Redis TTL for realtime quote snapshots in seconds |
| `REALTIME_AUTO_SUBSCRIBE` | `true` | ❌ | Automatically start WebSocket stream when requesting `/quote/{ticker}` |

## 技术指标

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `TECHNICAL_CACHE_ENABLED` | `true` | ❌ | Enable Redis caching for technical indicator calculations |
| `TECHNICAL_DEFAULT_LIMIT` | `500` | ❌ | 指标计算默认检索的 K 线数量 |
| `TECHNICAL_MAX_BATCH_TICKERS` | `20` | ❌ | Maximum tickers per `/technical/batch` request |
| `TECHNICAL_MAX_BATCH_INDICATORS` | `10` | ❌ | Maximum indicators per `/technical/batch` request |

## 新闻聚合

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `NEWS_CACHE_TTL` | `1800` | ❌ | Redis TTL for news feed results in seconds (30 min) |
| `NEWS_DEFAULT_LIMIT` | `20` | ❌ | 每次新闻查询的默认文章限制数 |
| `NEWS_MAX_LIMIT` | `100` | ❌ | Maximum allowed articles per request |
| `NEWS_PROVIDERS_TIMEOUT` | `10` | ❌ | Global timeout for provider scraping requests in seconds |
| `NEWS_DEDUP_SIMILARITY` | `0.85` | ❌ | SequenceMatcher similarity threshold for title deduplication |

## DCF 估值

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `DCF_CACHE_TTL` | `21600` | ❌ | Redis TTL for DCF valuations in seconds (6 hours) |
| `DCF_DEFAULT_PROJECTION_YEARS` | `5` | ❌ | 默认值 cash flow projection window in years |
| `DCF_RISK_FREE_RATE` | `0.04` | ❌ | 默认值 risk-free rate (e.g. 4.0% US 10Y Treasury) |
| `DCF_EQUITY_RISK_PREMIUM` | `0.055` | ❌ | 默认值 equity risk premium (5.5%) |
| `DCF_TERMINAL_GROWTH_RATE` | `0.025` | ❌ | 默认值 terminal growth rate (2.5%) |

## 提供商监控 & Health

| 变量 | 默认值 | 是否必需 | 说明描述 |
|---|---|---|---|
| `VALIDATION_OUTLIER_THRESHOLD` | `0.50` | ❌ | Consensus deviation threshold (50%) to flag outliers |
| `VALIDATION_MIN_PROVIDERS` | `2` | ❌ | Minimum agreeing providers required for consensus check |
| `CANARY_RUN_HOUR` | `6` | ❌ | 触发每日金丝雀健康套件的 UTC 小时数 (0-23) |
| `CANARY_PROVIDER_SEMAPHORE` | `3` | ❌ | Concurrency limit for canary checks |
| `ALERT_CANARY_CRITICAL` | `3` | ❌ | Consecutive failed canary checks before critical alert |
| `ALERT_SUCCESS_RATE_CRITICAL` | `0.70` | ❌ | Provider success rate threshold for critical alert |
| `ALERT_SUCCESS_RATE_WARNING` | `0.85` | ❌ | Provider success rate threshold for warning alert |
