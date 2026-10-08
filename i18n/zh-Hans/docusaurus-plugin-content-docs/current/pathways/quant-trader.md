---
id: "quant-trader"
title: "量化与算法交易者路径"
sidebar_label: "量化与算法交易者"
description: "从空实例到回测：按上市品种采集价格、在服务端计算指标、为 Zipline 提供数据"
---

# 量化与算法交易者路径

本路径带您从一个空实例走到回测：日线价格按上市品种（listing）存储在 TimescaleDB 中，指标由 API 计算，Zipline bundle 直接读取您的数据库。

| 步骤 | 使用的工具 |
|---|---|
| 价格 | `POST /historical/ingest`、`scripts/ingest_all.py`、`GET /eod` |
| 指标 | `GET /technical/{ticker}` 和 `/multi`，18 个指标（pandas-ta） |
| 筛选 | `GET /technical/screen` |
| 回测 | `zipline_bundle`（zipline-reloaded）或 pandas |

## 1. 启动实例

```bash
git clone https://github.com/fonrex/fonrex.git && cd fonrex
cp .env.example .env
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
mkdir -p logs && docker compose up -d
AUTH="X-API-KEY: $FONREX_API_KEY"
```

## 2. 导入金融工具并采集价格

```bash
docker compose exec fonrex-api python import_assets.py --file data/stocks.csv
curl -s -X POST -H "$AUTH" "http://localhost:5000/historical/ingest?ticker=AIR.PA"
```

采集过程使用为该上市品种验证过的代码，从 Yahoo Finance 获取十年的日线 K 线（TradingView 作为回退），这些数据已针对拆股和分红复权，并按交易日标注日期。如需采集整个目录：`docker compose exec fonrex-api python scripts/ingest_all.py`。详情：[采集历史数据](../guides/ingest-historical-data.md)。

## 3. 计算指标

```bash
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14"
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA/multi?indicators=sma_50,sma_200,macd,bbands_20"
curl -s -H "$AUTH" "http://localhost:5000/technical/screen?indicator=rsi&operator=lt&value=30"
```

指标使用 pandas-ta 基于已存储的价格计算，并缓存在 Redis 中。请参阅[技术指标参考](../api-reference/technical-indicators.md)。

## 4. 回测

使用 Zipline 时，注册 bundle 并从您的数据库导入：

```bash
pip install zipline-reloaded
export DATABASE_URL="postgresql://fonrex:<POSTGRES_PASSWORD>@localhost:5432/fonrex"
python -m zipline_bundle ingest --start 2020-01-01 --end 2025-12-31 --tickers AIR.PA,BNP.PA --calendar XPAR
```

或者通过 `GET /eod/{ticker}` 将价格加载到 pandas 中。请参阅[使用 Zipline 进行回测](../guides/backtesting-zipline.md)。

## 后续步骤

- [历史价格 API](../api-reference/historical.md)
- [实时流](../api-reference/realtime.md)，用于获取 1 分钟 tick
- [数据模型](../architecture/data-model.md)
