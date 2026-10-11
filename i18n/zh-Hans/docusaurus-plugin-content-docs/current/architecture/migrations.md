---
id: "migrations"
title: "Schema 迁移（Alembic）"
sidebar_label: "Schema 迁移"
description: "Alembic 迁移链、迁移的执行方式以及如何新增迁移"
---

# Schema 迁移（Alembic）

Alembic 掌管整个 Schema，包括 TimescaleDB 超表、压缩和连续聚合。迁移链是线性的，只有一个 head。

## 迁移历史

| 修订版本 | 文件 | 变更 |
|---|---|---|
| 001 | `001_initial_schema.py` | 初始 Schema：`assets`（ISIN 唯一索引）、`asset_listings`、`asset_mappings`、`prices_eod`、`fundamentals`、`usage_logs`，以及旧版表 `stock_data`、`data_requests`、`cache_status` |
| 002 | `002_refonte_fundamentals.py` | `fundamentals_highlights`、`financial_statements`、`earnings_history`、`analyst_ratings`、`etf_details`、`etf_holdings` |
| 003 | `003_index_constituents.py` | `index_constituents` 表（代码中未使用） |
| 004 | `004_fix_assets_columns.py` | `assets` 的概况列 |
| 005 | `005_premium_fields.py` | 空头头寸、TTM 和增长率列；GICS 列；`earnings_trend`、`esg_scores`、`outstanding_shares_history` |
| 006 | `006_prices_eod_resolution.py` | `prices_eod` 上的 `resolution`、`adjusted`、`source`；`ingest_log` |
| 007 | `007_realtime_tables.py` | `prices_intraday` 超表（保留 30 天）、`realtime_subscriptions` |
| 008 | `008_drop_legacy_tables.py` | **破坏性**：删除旧版价格表 |
| 009 | `009_fix_assets_isin_unique.py` | 合并重复 ISIN，添加 ISIN 唯一索引和上市品种身份约束 |
| 010 | `010_news_articles.py` | `news_articles`（`url` 唯一） |
| 011 | `011_provider_health.py` | `provider_health_log` 超表、`provider_health_daily`、`provider_alerts` |
| 012 | `012_alembic_schema_authority.py` | 由 Alembic 接管超表、压缩以及周/月聚合 |
| 013 | `013_solvency_ratios.py` | 偿债能力比率和债务成本；`macro_rates_cache` |
| 014 | `014_prices_per_listing.py` | 按上市品种重建 `prices_eod`：键为 `(asset_listing_id, resolution, time)`，各行重新标注为其交易日日期；压缩和聚合按上市品种进行 |
| 015 | `015_dividend_yield_as_ratio.py` | 已存储的股息率从百分比转换为比率 |
| 016 | `016_price_series_adjustments.py` | `price_series_adjustments`：每个已存储价格序列的调整方式，以及最后一次整体获取的时间。之前存储的序列会在下一次采集时被完整地重新获取 |
| 017 | `017_macro_rates_source.py` | `macro_rates_cache` 存放多个来源的序列：`series_id` 更长，新增 `source` 列（`fred`、`ecb`） |
| 018 | `018_statements_currency_unknown.py` | `financial_statements.currency` 不再默认为 `USD`；已存储的行变为未知（`NULL`），直到下一次深度补全记录 Yahoo 给出的货币 |
| 019 | `019_yahoo_epoch_dates.py` | 等于 1970-01-01 的 `dividend_ex_date` 和 `shares_short_date`（Yahoo 的秒数被当作纳秒读取）变为 `NULL` |
| 020 | `020_factor_returns.py` | `factor_returns` 和 `factor_dataset_loads`：Fama/French 因子文件 |
| 021 | `021_fx_rates.py` | `fx_rates` 和 `fx_rate_loads`：欧洲央行参考汇率 |

## 迁移的执行方式

1. API 容器在启动应用之前，在 `entrypoint.sh` 中运行 `alembic upgrade head`。`fonrex-migrate` 服务（profile `migrate`）会单独执行同样的操作。
2. `main.py` 将 `alembic_version` 中存储的修订版本与 head 进行比较。落后于代码的数据库会被标记为不可用，需要它的路由返回 `503`——应用本身从不修改 Schema。

迁移 014 会先删除价格表的 TimescaleDB 作业（如有正在运行的作业则等待其完成），并锁定 `prices_eod`：否则同时运行的压缩或刷新作业会与其发生死锁。迁移会重新创建这些作业。

## 新增迁移

```bash
alembic revision -m "describe_the_change"
```

重命名 `alembic/versions/` 中的新文件，并将其标识符设置在最后一个迁移之后（`revision = "022"`、`down_revision = "021"`，文件名 `022_describe_the_change.py`），然后：

```bash
alembic upgrade head
make migration-check     # one head only
```

- 将该迁移添加到 `ARCHITECTURE.md` 的迁移表中（`tests/test_docs_consistency.py`）。
- 移动或改写数据的迁移需要在 `tests/test_timescale_integration.py` 中附带测试，并在真实的 TimescaleDB 上运行（`make test-db`）。
- 同时编写 `downgrade()`：集成测试会先降级再升级。
