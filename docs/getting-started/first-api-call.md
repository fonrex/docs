---
id: "first-api-call"
title: "Making Your First API Call"
sidebar_label: "First API Call"
description: "Learn how to retrieve financial data, technical indicators, and real-time streams using cURL, Python, and WebSocket clients"
---

# Making Your First API Call

This guide demonstrates how to interact with Fonrex using REST HTTP endpoints and real-time WebSockets.

## 1. Get EOD Price History

Retrieve End-of-Day (EOD) OHLCV historical prices for **Airbus SE (`AIR.PA`)**.

### cURL
```bash
curl -s "http://localhost:5000/eod/AIR.PA?period=1mo"
```

### Python
```python
import requests

url = "http://localhost:5000/eod/AIR.PA"
params = {"period": "1mo"}
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

## 2. Compute Technical Indicators

:::note Prerequisite
Before computing technical indicators for a ticker (e.g., `AAPL`), historical data must be ingested first via `POST /historical/ingest?ticker=AAPL` (e.g., `curl -X POST "http://localhost:5000/historical/ingest?ticker=AAPL"`). If data has not been ingested beforehand, the endpoint will return `{"detail":"No historical data found for AAPL"}`.
:::

Calculate a 14-period **RSI (Relative Strength Index)** for **Apple Inc. (`AAPL`)**.

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
