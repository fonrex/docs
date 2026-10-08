---
id: "first-api-call"
title: "Making Your First API Call"
sidebar_label: "First API Call"
description: "Authenticate and query prices, indicators and real-time quotes with cURL, Python and WebSocket clients"
---

# Making Your First API Call

Every route except `/health`, `/docs`, `/redoc`, `/openapi.json`, `/widgets.json`, `/apps.json` and `/static` requires an API key, sent in one of two headers:

```
Authorization: Bearer frx_live_...
X-API-KEY: frx_live_...
```

A missing key answers `401`, an unknown key `403`. The examples below use the key you set in `.env` during the [installation](installation.md):

```bash
export FONREX_API_KEY="frx_live_..."   # the value of FONREX_API_KEY in .env
AUTH="X-API-KEY: $FONREX_API_KEY"
```

The interactive documentation of your instance is at `http://localhost:5000/docs`.

## 1. End-of-day prices

```bash
curl -s -H "$AUTH" "http://localhost:5000/eod/AIR.PA?period=5d"
```

When nothing is stored yet for the listing, Fonrex ingests its history first (Yahoo Finance, TradingView as a fallback), so the first call can take a few seconds.

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

Add `&fmt=csv` for CSV. When several listings share a ticker, choose one with `currency` or `exchange`.

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

## 2. A technical indicator

Indicators are computed on the prices stored in the database: ingest the listing first (step 1, or `POST /historical/ingest?ticker=AIR.PA`). Without prices the answer is `404`.

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

Values are returned as strings (decimal numbers) or `null` while the indicator has too few bars.

## 3. Fundamentals

```bash
curl -s -H "$AUTH" "http://localhost:5000/fundamental?ticker=AIR.PA"
```

The answer is one document in the EODHD layout (`General`, `Highlights`, `Valuation`, …) with a `Sources` section naming the source of each figure. See [Fundamentals](../api-reference/fundamentals.md).

## 4. Real-time prices over WebSocket

Browsers cannot set headers on a WebSocket: pass the key in the query string (`token`, `api_key` or `key`).

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

With a full-access key, connecting starts the TradingView stream of the ticker when it is not streamed yet. A read-only key never starts one: it receives a `not_streaming` message and then the ticks, once a full-access client has subscribed the ticker. See [Realtime](../api-reference/realtime.md).
