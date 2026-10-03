---
id: "quant-trader"
title: "量化交易员使用路径"
sidebar_label: "量化交易员"
description: "量化分析师技术指南：OHLCV K线数据摄取、Pandas-TA指标计算与Zipline回测集成"
---

# 量化交易员使用路径

本路径为**量化分析师与算法交易员**提供技术集成指南。涵盖本地基础设施部署、TimescaleDB K线数据摄取、服务端 Pandas-TA 技术指标计算以及 Python Zipline 回测框架集成。

| 领域组件 | 技术栈 | 规格说明 |
|---|---|---|
| **数据摄取** | TimescaleDB Hypertables | 分区 K 线 (OHLCV) 时序存储 |
| **技术指标** | Pandas-TA 引擎 | 18+ 内置服务端指标 (SMA, EMA, RSI, MACD, Bollinger) |
| **回测集成** | Zipline 适配器 | 原生 Python DataBundle 客户端 |

---

## 1. 本地基础设施部署

使用 Docker Compose 启动 Fonrex 应用服务器、TimescaleDB 和 Redis 容器：

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

验证实例健康状态：

```http
GET /health
```

预期 JSON 响应：

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "alembic_version": "011_provider_monitoring"
}
```

---

## 2. 摄取历史 K 线数据

通过摄取端点导入目标资产的历史 K 线 (OHLCV) 数据至 TimescaleDB：

```http
POST /api/v1/historical/ingest
Content-Type: application/json

{
  "symbol": "AAPL",
  "interval": "1d",
  "provider": "yfinance",
  "start_date": "2023-01-01"
}
```

> **注意**：批量摄取请参考 [历史数据摄取指南](/docs/guides/ingest-historical-data)。

---

## 3. 服务端技术指标计算

查询 Pandas-TA 指标引擎以直接根据存储的历史数据计算指标：

```http
GET /api/v1/indicators/sma?symbol=AAPL&period=20&interval=1d
```

响应 JSON 格式：

```json
{
  "symbol": "AAPL",
  "indicator": "SMA",
  "period": 20,
  "data": [
    { "timestamp": "2024-01-15T00:00:00Z", "value": 185.42 },
    { "timestamp": "2024-01-16T00:00:00Z", "value": 186.10 }
  ]
}
```

---

## 4. 连接 Zipline 进行策略回测

在 Python 交易策略中直接集成 Fonrex 客户端适配器：

```python
from fonrex_client import FonrexDataIngestor
import zipline

ingestor = FonrexDataIngestor(base_url="http://localhost:5000")
ingestor.register_bundle(name="fonrex-us-equities", symbols=["AAPL", "MSFT", "NVDA"])

print("Zipline Bundle 注册成功。")
```

---

## 后续步骤

- 参考 [技术指标 API 参考](/docs/api-reference/technical-indicators)
- 参考 [历史价格 API 参考](/docs/api-reference/historical)
- 参考 [Zipline 回测指南](/docs/guides/backtesting-zipline)
