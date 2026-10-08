---
id: "configure-realtime"
title: "Realtime Streaming & WebSocket Setup"
sidebar_label: "Configure Realtime"
description: "Start TradingView streams, receive ticks over WebSocket and tune the realtime worker"
---

# Realtime Streaming & WebSocket Setup

The realtime worker runs inside the API process. It keeps TradingView WebSocket streams open for the subscribed tickers and spreads each 1-minute tick through Redis.

```
TradingView WebSocket
        │
        ▼
RealtimePriceWorker (API process)
        ├─► Redis key quote:{ticker}       last tick, 60 s      ──► GET /quote/{ticker}
        ├─► Redis channel price:{ticker}   each tick            ──► WS /ws/realtime/{ticker}
        └─► prices_intraday (TimescaleDB)  1-minute candles, kept 30 days
```

## 1. Subscribe tickers

Streams are started with a **full-access** key:

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"tickers": ["AIR.PA", "BNP.PA"]}' http://localhost:5000/realtime/subscribe
```

Connecting to `WS /ws/realtime/{ticker}` with a full-access key also starts the stream of a ticker that is not streamed. Subscriptions are stored in `realtime_subscriptions` and restored when the API restarts.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/realtime/status
curl -s -X DELETE -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/realtime/subscribe/BNP.PA
```

## 2. Receive the ticks

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === "snapshot" || type === "tick") console.log(type, data.close);
};
```

The repository also has a Python example client: `make example-client` (`scripts/example_realtime_client.py`).

**Read-only keys** (for a dashboard or any client outside your machine) never start a stream. They receive a `not_streaming` message for a ticker that is not streamed, then its ticks as soon as a full-access client subscribes it. `GET /quote/{ticker}` and `GET /openbb/quote/{ticker}` never start a stream either: without one they return the delayed Yahoo Finance price.

## 3. Settings

```env
# Simultaneous TradingView connections
TV_MAX_CONNECTIONS=10
# First reconnection delay in seconds, doubled after each failure up to 60
TV_RECONNECT_DELAY=5
# Lifetime of the last tick in Redis, in seconds
REALTIME_QUOTE_TTL=60
```

## Things to know

- **One process.** Streams, subscriptions and WebSocket clients live in the memory of the API process. Keep `WEB_CONCURRENCY=1`: each additional Gunicorn worker would open its own streams.
- **TradingView symbol.** It is derived from the ticker suffix (`AIR.PA` → `EURONEXT:AIR`, `.DE` → `XETRA`); a ticker without suffix is taken for a NASDAQ line. Unlike the end-of-day ingestion, the realtime path does not check the line against the ISIN and currency of a listing.
- **Intraday storage.** 1-minute candles are saved per instrument (not per listing) when the ticker is in the catalogue, and purged after 30 days by a TimescaleDB retention policy.
- **Reverse proxy.** A proxy in front of the API must forward the WebSocket upgrade — see [Docker production deployment](../deployment/docker.md).
