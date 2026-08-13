---
id: "configure-realtime"
title: "实时流与 WebSocket 设置"
sidebar_label: "实时流设置"
description: "如何配置 TradingView WebSocket 桥接流、Redis Pub/Sub 及 TimescaleDB 日内持久化"
---


# 实时流与 WebSocket 设置

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

## Key Configuration 变量s

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
     -H "Content-类型: application/json" \
     -d '{"ticker": "AIR.PA"}'
```

Check active subscriptions:

```bash
curl "http://localhost:5000/realtime/status"
```
