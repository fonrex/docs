---
id: "realtime"
title: "Realtime & WebSocket API Reference"
sidebar_label: "Realtime Streaming"
description: "WebSocket price stream, quote snapshots and stream subscriptions"
---

# Realtime & WebSocket API Reference

The realtime worker of the API streams 1-minute ticks from TradingView, stores the last tick of each ticker in Redis (`quote:{ticker}`, 60 s), publishes it on the Redis channel `price:{ticker}` and saves it in the `prices_intraday` hypertable when the instrument is in the catalogue.

Streams are started by a full-access key: by `POST /realtime/subscribe`, or by connecting to the WebSocket. A **read-only key never starts a stream**; it is served what is already streamed. Subscriptions of tickers that name an instrument of the catalogue are stored in `realtime_subscriptions` and restored when the API starts; other tickers are streamed but not restored after a restart.

---

## <span className="api-method ws">WS</span> `/ws/realtime/{ticker}`

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);
```

The key is checked during the handshake. A WebSocket client can send it as a header (`Authorization` or `X-API-KEY`) or in the query string as `token`, `api_key` or `key`. A missing or wrong key closes the connection with code `1008`.

### Messages sent by the server

Every message has the form `{"type", "ticker", "data", "error", "ts"}`, except `pong`, sent as `{"type": "pong"}`.

| `type` | When | `data` |
|---|---|---|
| `not_streaming` | Read-only key on a ticker that is not streamed (sent first; `error` explains it) | — |
| `snapshot` | Right after the connection, when a last tick is cached | The last tick |
| `tick` | Each new tick | The tick |
| `pong` | Answer to a `ping` from the client | — |

```json
{
  "type": "tick",
  "ticker": "AIR.PA",
  "data": {
    "ticker": "AIR.PA",
    "timestamp": "2026-10-08T09:31:00Z",
    "open": "155.20",
    "high": "155.48",
    "low": "155.10",
    "close": "155.42",
    "volume": 18250,
    "source": "tradingview",
    "exchange": null,
    "currency": null
  },
  "error": null,
  "ts": "2026-10-08T09:31:02.114Z"
}
```

Prices are decimal numbers serialised as strings.

### Messages sent by the client

| Text | Effect |
|---|---|
| `ping` | The server answers `{"type": "pong"}` |
| `unsubscribe` | The server closes the connection |

The TradingView symbol is derived from the ticker suffix (`AIR.PA` → `EURONEXT:AIR`, `.DE` → `XETRA`); a ticker without suffix is taken for a NASDAQ line.

---

## <span className="api-method get">GET</span> `/quote/{ticker}`

The last known price of a ticker.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `subscribe_if_missing` | boolean | `false` | Also start the stream of the ticker in the background. Ignored for a read-only key |

When the ticker is streamed, the cached tick is returned (`is_realtime: true`, `source: "tradingview"`). Otherwise Fonrex returns the delayed Yahoo Finance price of the ticker **as typed** (`is_realtime: false`, `source: "yfinance"`, `delay_seconds: 900`). Nothing found answers `404`. A tick carries no previous close: for a streamed ticker `change` and `change_pct` are `0` and `previous_close` is `null`; the delayed Yahoo answer fills them.

```json
{
  "ticker": "AIR.PA",
  "price": "155.42",
  "open": "155.20",
  "high": "155.48",
  "low": "155.10",
  "close": "155.42",
  "volume": 18250,
  "change": "0",
  "change_pct": "0",
  "previous_close": null,
  "timestamp": "2026-10-08T09:31:00Z",
  "is_realtime": true,
  "source": "tradingview",
  "delay_seconds": 0
}
```

---

## <span className="api-method get">GET</span> `/quotes`

Quotes of several tickers: `tickers` is a comma-separated list, cut to the first 20. A ticker without a quote is `null`. This route never starts a stream.

```json
{ "count": 2, "tickers": ["AIR.PA", "BNP.PA"], "quotes": { "AIR.PA": { "...": "..." }, "BNP.PA": null } }
```

---

## <span className="api-method post">POST</span> `/realtime/subscribe`

Start the stream of up to 50 tickers. Full-access key only.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"tickers": ["AIR.PA", "BNP.PA"]}' http://localhost:5000/realtime/subscribe
```

```json
[
  {
    "ticker": "AIR.PA",
    "tv_exchange": "EURONEXT",
    "tv_symbol": "AIR",
    "is_active": true,
    "subscribed_at": "2026-10-08T09:30:00Z",
    "last_tick_at": null,
    "tick_count": 0,
    "is_streaming": true
  }
]
```

---

## <span className="api-method delete">DELETE</span> `/realtime/subscribe/{ticker}`

Stop the stream of a ticker. Full-access key only. Answers `{"status": "unsubscribed", "ticker": "AIR.PA"}`, or `404` when the ticker is not streamed.

---

## <span className="api-method get">GET</span> `/realtime/status`

```json
{
  "streaming_count": 1,
  "active_tickers": ["AIR.PA"],
  "ws_connections": { "AIR.PA": 2 },
  "total_ws_clients": 2,
  "stale_tickers": [],
  "worker_running": true
}
```

`stale_tickers` lists streamed tickers without a fresh tick in Redis.
