---
id: "first-api-call"
title: "第一次 API 调用"
sidebar_label: "第一次 API 调用"
description: "使用 cURL、Python 和 WebSocket 客户端进行身份验证，并查询价格、指标和实时报价"
---

# 第一次 API 调用

除 `/health`、`/docs`、`/redoc`、`/openapi.json`、`/widgets.json`、`/apps.json` 和 `/static` 之外，所有路由都需要 API 密钥，可通过以下两个请求头之一发送：

```
Authorization: Bearer frx_live_...
X-API-KEY: frx_live_...
```

缺少密钥时返回 `401`，密钥未知时返回 `403`。以下示例使用您在[安装](installation.md)过程中于 `.env` 中设置的密钥：

```bash
export FONREX_API_KEY="frx_live_..."   # the value of FONREX_API_KEY in .env
AUTH="X-API-KEY: $FONREX_API_KEY"
```

您实例的交互式文档位于 `http://localhost:5000/docs`。

## 1. 日终价格

```bash
curl -s -H "$AUTH" "http://localhost:5000/eod/AIR.PA?period=5d"
```

如果该上市品种（listing）尚未存储任何数据，Fonrex 会先采集其历史数据（Yahoo Finance，TradingView 作为回退），因此第一次调用可能需要几秒钟。

```json
{
  "ticker": "AIR.PA",
  "period": "5d",
  "format": "json",
  "count": 3,
  "retrieved_at": "2026-10-08T16:34:42.404598+00:00",
  "data_source": "database",
  "data": [
    {
      "Date": "2026-10-07",
      "Open": 154.46,
      "High": 156.46,
      "Low": 152.46,
      "Close": 155.46,
      "Adj Close": 155.46,
      "Volume": 1400000
    }
  ]
}
```

添加 `&fmt=csv` 可获取 CSV 格式。当多个上市品种共用同一个 ticker 时，可使用 `currency` 或 `exchange` 选择其中之一。

### Python

```python
import os
import requests

session = requests.Session()
session.headers["X-API-KEY"] = os.environ["FONREX_API_KEY"]

eod = session.get("http://localhost:5000/eod/AIR.PA", params={"period": "1mo"}).json()
for bar in eod["data"]:
    print(bar["Date"], bar["Close"])
```

## 2. 技术指标

指标基于数据库中存储的价格计算：请先采集该上市品种（第 1 步，或 `POST /historical/ingest?ticker=AIR.PA`）。没有价格时返回 `404`。

```bash
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14"
```

```python
rsi = session.get(
    "http://localhost:5000/technical/AIR.PA",
    params={"indicator": "rsi", "period": 14},
).json()
last = rsi["series"][0]["values"][-1]
print(f"RSI(14) on {last['t']}: {last['v']}")
```

数值以字符串（十进制数）形式返回；当 K 线数量不足以计算指标时，返回 `null`。

## 3. 基本面数据

```bash
curl -s -H "$AUTH" "http://localhost:5000/fundamental?ticker=AIR.PA"
```

响应是一份采用 EODHD 布局的文档（`General`、`Highlights`、`Valuation`……），其中的 `Sources` 部分列出每个数字的来源。请参阅[基本面数据](../api-reference/fundamentals.md)。

## 4. 通过 WebSocket 获取实时价格

浏览器无法为 WebSocket 设置请求头：请在查询字符串中传递密钥（`token`、`api_key` 或 `key`）。

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "tick") console.log(message.data.close, message.data.timestamp);
};
```

```python
import asyncio
import json
import os

import websockets

async def stream(ticker: str) -> None:
    url = f"ws://localhost:5000/ws/realtime/{ticker}?token={os.environ['FONREX_API_KEY']}"
    async with websockets.connect(url) as ws:
        async for raw in ws:
            message = json.loads(raw)
            if message["type"] in ("snapshot", "tick"):
                print(message["type"], message["data"]["close"])

asyncio.run(stream("AIR.PA"))
```

使用完全访问密钥连接时，如果该 ticker 尚未推流，会启动它的 TradingView 流。只读密钥永远不会启动推流：它会先收到一条 `not_streaming` 消息，等到某个完全访问客户端订阅了该 ticker 后，再接收 tick 数据。请参阅[实时数据](../api-reference/realtime.md)。
