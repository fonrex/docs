---
id: "overview"
title: "提供商架构概述"
sidebar_label: "概述"
description: "多提供商抓取架构、超时、并行执行及共识过滤概述"
---


# 提供商架构概述

Fonrex uses a distributed multi-provider scraping architecture to aggregate market indicators, fundamental statistics, and financial news without reliance on a single upstream vendor.

## Execution Flow

```
GET /fundamental?ticker=AIR.PA
       │
       ▼
FinancialProviderRunner.run()
       │
       ├─► Asynchronous Parallel Scraping (asyncio.gather)
       │    ├── ZoneBourse.fetch()       (Timeout: 8s)
       │    ├── Gurufocus.fetch()        (Timeout: 8s)
       │    ├── YahooFinance.fetch()     (Timeout: 5s)
       │    └── MorningStar.fetch()      (Timeout: 8s)
       │
       ▼
ValidationLayer.validate_results()
       │ Outlier Check & Range Limits (min/max boundaries)
       ▼
StandardFinancials Formatter
       │ Merges validated metrics across providers
       ▼
HTTP JSON Response
```

## Resilience Strategy

1. **Non-Blocking Gather**: Providers execute in parallel via `asyncio.gather(..., return_exceptions=True)`. A failure or timeout in one provider (e.g. ZoneBourse) does not affect the remaining providers.
2. **Provider Mapping Fallbacks**: Resolves search parameters in this priority order: `provider_url` ➔ `provider_ticker` ➔ `ISIN` ➔ `ticker`.
3. **Consensus Outlier Filtering**: The `ValidationLayer` filters out anomalous metrics returned by individual providers before merging responses.
