---
id: "first-api-call"
title: "发送您的第一个 API 请求"
sidebar_label: "First API Call"
description: "学习如何使用 cURL、Python 和 WebSocket 客户端获取金融数据、技术指标和实时流"
---


# 发送您的第一个 API 请求

本指南演示了如何使用 REST HTTP Endpoint 和实时 WebSocket 与 Fonrex 进行交互。

## 1. Get EOD Price History

获取 **Airbus SE (`AIR.PA`)** 的日终 (EOD) OHLCV 历史价格。

### cURL
```bash
curl -s "http://localhost:5000/eod/AIR.PA?resolution=d&limit=5"
```

### Python
```python
import requests

url = "http://localhost:5000/eod/AIR.PA"
params = {"resolution": "d", "limit": 5}
response = requests.get(url, params=params)

data = response.json()
print(f"Ticker: {data['symbol']}, Total Candles: {len(data['data'])}")
for bar in data['data']:
    print(f"Date: {bar['time']} | Close: {bar['close']} {data['currency']}")
```

### Sample Response
```json
{
  "symbol": "AIR.PA",
  "name": "Airbus SE",
  "currency": "EUR",
  "resolution": "d",
  "count": 5,
  "data": [
    {
      "time": "2026-08-07T00:00:00Z",
      "open": 134.20,
      "high": 136.50,
      "low": 133.80,
      "close": 135.90,
      "adj_close": 135.90,
      "volume": 1245000
    }
  ]
}
```

---

## 2. 计算技术指标

计算 **Apple Inc. (`AAPL`)** 的 14 周期 **RSI（相对强弱指数）**。

### cURL
```bash
curl -s "http://localhost:5000/technical/AAPL?indicator=rsi&period=14"
```

### Python
```python
import requests

resp = requests.get("http://localhost:5000/technical/AAPL", params={"indicator": "rsi", "period": 14})
rsi_data = resp.json()
latest_rsi = rsi_data["values"][-1]
print(f"AAPL Current RSI(14): {latest_rsi['value']:.2f}")
```

---

## 3. Connect to Realtime WebSocket Stream

Subscribe to live 1-minute candle ticks for **Tesla (`TSLA`)**.

### JavaScript Browser / Node.js
```javascript
const ws = new WebSocket("ws://localhost:5000/ws/realtime/TSLA");

ws.onopen = () => {
  console.log("Connected to Fonrex Realtime Stream for TSLA");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Stream Event:", message.type, message.data);
};
```

### Python WebSocket Client
```python
import asyncio
import websockets
import json

async def stream_quote():
    async with websockets.connect("ws://localhost:5000/ws/realtime/TSLA") as websocket:
        while True:
            msg = await websocket.recv()
            data = json.loads(msg)
            print(f"[{data['type']}] Close: {data['data'].get('close')} Volume: {data['data'].get('volume')}")

asyncio.run(stream_quote())
```
