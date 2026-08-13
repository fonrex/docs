---
id: "configure-realtime"
title: "Realtime Streaming & WebSocket Setup"
sidebar_label: "Realtime Streaming Setup"
description: "How to configure TradingView WebSocket bridge streaming, Redis Pub/Sub, and TimescaleDB intraday persistence"
---

# Realtime Streaming & WebSocket Setup

Fonrex includes a real-time market data streaming subsystem capable of maintaining active TradingView WebSocket connections, broadcasting price ticks through Redis Pub/Sub, and persisting 1-minute bars into TimescaleDB hypertables.

## Architecture Data Flow

```
TradingView WebSocket Bridge
           │
           ▼
  RealtimePriceWorker
           │
           ├─► Redis Pub/Sub (`price:{ticker}`) ──► ConnectionManager ──► WS Clients
           ├─► Redis Key-Value (`quote:{ticker}`) (Snapshot TTL)
           └─► TimescaleDB `prices_intraday` Hypertable (1-min candles)
```

## Key Configuration Variables

Ensure the following variables are set in `.env`:

```env
# Maximum concurrent TradingView WebSocket connections
TV_MAX_CONNECTIONS=10

# Reconnection delay in seconds
TV_RECONNECT_DELAY=5

# Redis TTL for quote snapshots (seconds)
REALTIME_QUOTE_TTL=60

# Auto-subscribe when calling GET /quote/{ticker}
REALTIME_AUTO_SUBSCRIBE=true
```

## Subscribing via REST API

Start background streaming for an asset programmatically:

```bash
curl -X POST "http://localhost:5000/realtime/subscribe" \
     -H "Content-Type: application/json" \
     -d '{"ticker": "AIR.PA"}'
```

Check active subscriptions:

```bash
curl "http://localhost:5000/realtime/status"
```
