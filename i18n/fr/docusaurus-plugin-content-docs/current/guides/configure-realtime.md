---
id: "configure-realtime"
title: "Configuration Streaming Temps Réel & WebSockets"
sidebar_label: "Configuration du Streaming Temps Réel"
description: "Configuration du bridge WebSocket TradingView, Redis Pub/Sub et persistance intraday TimescaleDB"
---


# Configuration Streaming Temps Réel & WebSockets

Fonrex includes a real-time market data streaming subsystem capable of maintaining active TradingView WebSocket connections, broadcasting price ticks through Redis Pub/Sub, and persisting 1-minute bars into TimescaleDB hypertables.

## Flux de Données de l'Architecture

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

## Variables de Configuration Clés

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

## S'abonner via l'API REST

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
