---
id: "quant-trader"
title: "📈 使用路径：量化交易员"
sidebar_label: "📈 量化交易员"
description: "量化分析师入门指南：历史数据摄取、Pandas-TA指标计算与Zipline回测。"
---

# 📈 使用路径：量化交易员

欢迎使用**量化分析师与算法交易员**专属路径。本指南将引导您完成 Fonrex 的部署、技术指标计算以及与 Python 回测引擎的对接。

> [!TIP]
> **目标：** 在 10 分钟内部署自托管金融数据管道，计算 18+ 种技术指标，并连接 Zipline / Backtrader 脚本。

---

### ⏱️ 预计耗时：10 分钟

---

## 📌 步骤 1：本地部署

使用 Docker Compose 启动 Fonrex 以及 TimescaleDB 和 Redis：

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

验证 API 状态：
```bash
curl http://localhost:5000/health
```

---

## 📌 步骤 2：摄取历史数据

通过摄取端点导入目标股票的历史 K 线数据（OHLCV）：

```bash
curl -X POST http://localhost:5000/api/v1/historical/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "interval": "1d",
    "provider": "yfinance",
    "start_date": "2023-01-01"
  }'
```

*(参考 [历史数据摄取指南](/docs/guides/ingest-historical-data) 了解批量摄取流程)*。

---

## 📌 步骤 3：技术指标计算 (Pandas-TA)

查询内置指标引擎以获取移动平均线 (SMA/EMA)、RSI、MACD 或布林带：

```bash
curl "http://localhost:5000/api/v1/indicators/sma?symbol=AAPL&period=20&interval=1d"
```

---

## 📌 步骤 4：连接 Zipline 进行策略回测

在 Python 交易策略中使用 Fonrex Zipline 适配器：

```python
from fonrex_client import FonrexDataIngestor
import zipline

ingestor = FonrexDataIngestor(base_url="http://localhost:5000")
ingestor.register_bundle(name="fonrex-us-equities", symbols=["AAPL", "MSFT", "NVDA"])

print("✅ Zipline Bundle 已就绪！")
```

---

## 🎯 建议的后续步骤

- 📖 [技术指标 API 参考](/docs/api-reference/technical-indicators)
- 📊 [历史价格 API 参考](/docs/api-reference/historical)
