---
id: "realtime"
title: "Realtime & WebSocket API Reference"
sidebar_label: "Realtime & WebSockets"
description: "WebSocket live price streaming, REST quote snapshots, and subscription management endpoints"
---

# Realtime & WebSocket API Reference

The Realtime API streams live 1-minute market ticks over WebSockets via TradingView bridge connections and Redis Pub/Sub, and exposes high-speed quote REST snapshots.

---

## <span className="api-method ws">WS</span> `/ws/realtime/{ticker}`

Open a persistent WebSocket streaming channel for real-time tick updates on a given ticker.

### Connection Protocol

```javascript
const ws = new WebSocket("ws://localhost:5000/ws/realtime/AIR.PA");
```

### Event Messages

Upon connection, the server sends a initial `snapshot` message followed by real-time `tick` events:

#### Initial Snapshot Event
```json
{
  "type": "snapshot",
  "ticker": "AIR.PA",
  "data": {
    "close": 135.90,
    "open": 134.20,
    "high": 136.50,
    "low": 133.80,
    "volume": 1245000,
    "timestamp": "2026-08-11T10:15:00Z"
  }
}
```

#### Live Tick Event
```json
{
  "type": "tick",
  "ticker": "AIR.PA",
  "data": {
    "close": 136.10,
    "change": 0.20,
    "change_pct": 0.147,
    "volume": 1246500,
    "timestamp": "2026-08-11T10:16:00Z"
  }
}
```

---

## <span className="api-method get">GET</span> `/quote/{ticker}`

Retrieve the latest price quote snapshot from the Redis volatile cache. Auto-triggers realtime stream subscription if `REALTIME_AUTO_SUBSCRIBE=true`.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol (e.g. `AAPL`) |

### Response Example

```json
{
  "ticker": "AAPL",
  "price": 224.50,
  "open": 222.10,
  "high": 225.00,
  "low": 221.80,
  "volume": 45200000,
  "change": 2.40,
  "change_pct": 1.08,
  "source": "tradingview_stream",
  "timestamp": "2026-08-11T10:15:30Z"
}
```

---

## <span className="api-method get">GET</span> `/quotes`

Batch quote snapshot retrieval for multiple tickers.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `tickers` | `string` | ✅ | — | Comma-separated list of tickers (e.g. `AAPL,MSFT,TSLA`) |

---

## <span className="api-method post">POST</span> `/realtime/subscribe`

Explicitly subscribe a ticker to the background streaming worker `RealtimePriceWorker`.

### Request Body

```json
{
  "ticker": "NVDA"
}
```

---

## <span className="api-method delete">DELETE</span> `/realtime/subscribe/{ticker}`

Unsubscribe a ticker from background live streaming.

---

## <span className="api-method get">GET</span> `/realtime/status`

List all active market streaming worker subscriptions.

### Response Example

```json
{
  "active_subscriptions": 3,
  "subscriptions": [
    {
      "ticker": "AIR.PA",
      "subscribed_at": "2026-08-11T08:00:00Z",
      "last_tick_at": "2026-08-11T10:15:30Z",
      "tick_count": 1350
    }
  ]
}
```
