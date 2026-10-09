---
id: "ingest-historical-data"
title: "采集历史市场数据"
sidebar_label: "采集历史数据"
description: "Fonrex 如何按上市品种获取、验证并存储日终价格"
---

# 采集历史市场数据

价格按**上市品种**（listing，即 ticker + 交易所 + 货币）、分辨率和交易日存储。上市品种会在以下情况下被采集：

- 自动采集：`GET /eod/{ticker}` 首次发现该请求没有任何已存储数据时；
- 按需采集：使用 `POST /historical/ingest` 或 `POST /historical/ingest/bulk`；
- 为整个目录采集：使用 `scripts/ingest_all.py`。

## 处理流程

`HistoricalIngestionService` 依次执行以下步骤：

1. **序列** — ticker 指向一个上市品种：即带有该 ticker 的上市品种（优先选择主上市品种；可用 `currency` 或 `exchange` 选择其他上市品种），否则为该金融工具的首选上市品种。没有上市品种的金融工具无法被采集。
2. **缺口检测** — 没有任何已存储 K 线时，获取十年数据；如果最后一个已存储的交易日是今天或昨天，该上市品种为 `up_to_date`；否则只获取缺失的天数。如果 `from_date` 早于第一根已存储的 K 线，也会获取更早的部分。使用 `force_refresh` 时，请求的范围和已存储的范围会被一次性整体重新获取。
3. **来源代码** — 您目录中的 ticker 并不总是 Yahoo 代码（`EUCO` 在 Yahoo 上是 `SYBC.DE`，而单独的 `SPFF` 是一只美国基金）。Fonrex 按 **ISIN** 搜索 Yahoo，保留第一个以**该上市品种的货币**报价且有价格的行情，并将其存储为该上市品种的已验证代码。没有任何匹配的上市品种不会从 Yahoo 获取数据，并且在 24 小时内不会再次搜索。
4. **获取** — 使用已验证代码从 Yahoo Finance 获取；TradingView 作为回退，仅当其行情以该上市品种的货币报价时才被接受。`open`、`high`、`low` 和 `close` 是成交价格，已针对拆股进行调整；`adj_close` 是针对拆股**和分红**调整后的收盘价（TradingView 的 K 线中为空）。每根 K 线以其交易日标注日期。最后几根已存储的 K 线会与新的 K 线一起被重新获取，以检查调整情况（见下一节）。
5. **规范化** — 丢弃没有价格的 K 线，修正颠倒的最高价/最低价，将负成交量设为零，丢弃重复日期。
6. **Upsert** — 每批 1,000 行，`ON CONFLICT (asset_listing_id, resolution, time) DO UPDATE`。使用 `force_refresh` 时，或整个序列被重新获取时，所获取范围内已存储的 K 线会被替换。
7. **缓存** — 删除根据该 ticker 价格计算出的缓存响应（`eod`、`history`、`technical`、`dcf`）。
8. **日志** — 在 `ingest_log` 中写入一行：状态、来源、新增行数、范围、耗时、错误。

## 拆股与分红：整个序列使用同一种调整 {#splits-and-dividends-one-adjustment-for-the-whole-series}

每次拆股（所有价格）和每次分红（`adj_close`）之后，Yahoo 都会重新调整整段历史。如果只是把新的 K 线追加到已存储的 K 线之后，两部分的调整方式就会不同，并在衔接处出现一个虚假的收益率：分红之后约为负的股息率，四拆一之后为 -75 %。

因此，Fonrex 让每个序列（上市品种和分辨率）保持同一种调整：

- 补全一个序列时，它会获取新的交易日**以及最后五根已存储的 K 线**。如果来源为这些 K 线给出的价格相同，则只写入新的交易日。
- 如果价格不同（自上次采集以来发生了拆股或分红），则**整个序列会被重新获取**并替换已存储的序列。结果会在 `note` 中说明：`Whole history fetched again: the source adjusted the stored bars again (split or dividend)`。如果这次获取失败，则不写入任何数据，采集失败并给出原因。
- 表 `price_series_adjustments` 按序列记录其 K 线的调整方式，以及最后一次整体获取的时间。

`close` 用于成交价格（图表、指标、估值），`adj_close` 用于包含分红的收益率（业绩表现、beta、回测）。

:::note 升级到迁移 016 之后
迁移 016 之前存储的序列在 `close` 中保存的是经分红调整的价格。每个序列会在下一次采集时被完整地重新获取。如需立即为整个目录执行：

```bash
docker compose exec fonrex-api python scripts/ingest_all.py --force
```
:::

## ticker 没有价格或价格错误时

采集结果会说明原因：

```json
{
  "ticker": "GOVY",
  "status": "failed",
  "error": "No Yahoo symbol quoted in CHF for ISIN IE00B3S5XW04; Yahoo offers SYBB.DE (EUR)"
}
```

- **多个上市品种共用该 ticker**：指定您需要的那个，例如 `POST /historical/ingest?ticker=GOVY&currency=CHF`。
- **使用了哪个代码**：查看结果中的 `provider_symbol`；`note` 说明为何使用 TradingView 而不是 Yahoo。
- **重新查找代码，或替换旧序列**：`POST /historical/ingest?ticker=<ticker>&force_refresh=true`。
- 当您知道正确的行情时，**自行设置代码**（之后会被原样信任）：

```bash
docker compose exec -T db psql -U fonrex -d fonrex -c "
  INSERT INTO asset_mappings (asset_id, asset_listing_id, provider_name, provider_ticker,
                              source, is_active, failure_count, created_at, updated_at)
  SELECT l.asset_id, l.id, 'YahooFinance', 'GOVY.SW', 'manual', true, 0, now(), now()
  FROM asset_listings l WHERE l.ticker = 'GOVY' AND l.currency = 'CHF'
  ON CONFLICT (asset_listing_id, provider_name)
  DO UPDATE SET provider_ticker = EXCLUDED.provider_ticker, source = 'manual', is_active = true"
```

## 采集整个目录

```bash
docker compose exec fonrex-api python scripts/ingest_all.py
```

| 选项 | 默认值 | 说明 |
|---|---|---|
| `--resolution` | `1D` | `1D`、`1W` 或 `1M` |
| `--source` | `auto` | `auto`、`yfinance` 或 `tradingview` |
| `--force` | 关闭 | 重新获取全部历史（不进行缺口检测） |
| `--concurrency` | `5` | 并行采集数 |

每个 ticker 之前会有一个短暂的随机暂停，以免对数据来源造成过大压力。

## 保留或删除旧价格

首次采集会获取十年数据。`POST /database/cleanup` 会删除早于 `days_to_keep` 天的价格，**默认值为 730**，这会删除这十年中的八年。请先使用 `dry_run` 统计数量：

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"days_to_keep": 3650, "dry_run": true}' http://localhost:5000/database/cleanup
```

## 从共享序列升级（迁移 014）

在迁移 014 之前，同一金融工具的各个上市品种共用一个序列，欧洲或亚洲的交易日会被标注为前一天的日期。该迁移按上市品种重建 `prices_eod` 并重新标注现有行的日期；无需重新下载任何数据。如果之后某个序列看起来不正确，请使用 `force_refresh=true` 替换它。升级前请备份数据库。
