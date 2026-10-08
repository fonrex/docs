---
id: "realtime"
title: "实时与 WebSocket API 参考"
sidebar_label: "实时数据流"
description: "WebSocket 价格流、报价快照及数据流订阅"
---

# 实时与 WebSocket API 参考

API 的实时 worker 从 TradingView 接收 1 分钟级的 tick 数据流，将每个代码的最新 tick 存储在 Redis 中（`quote:{ticker}`，60 秒），发布到 Redis 频道 `price:{ticker}`，并在金融工具位于目录中时将其保存到 `prices_intraday` 超表。

数据流由完全访问密钥启动：通过 `POST /realtime/subscribe`，或通过连接 WebSocket。**只读密钥从不启动数据流**；它只能获取已经在推送的数据。指向目录中某个金融工具的代码，其订阅存储在 `realtime_subscriptions` 中，并在 API 启动时恢复；其他代码也会推送，但重启后不会恢复。

---

## <span className="api-method ws">WS</span> `/ws/realtime/{ticker}`

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);
```

密钥在握手期间校验。WebSocket 客户端可以通过请求头（`Authorization` 或 `X-API-KEY`）发送密钥，也可以在查询字符串中以 `token`、`api_key` 或 `key` 发送。密钥缺失或错误时，连接会以代码 `1008` 关闭。

### 服务器发送的消息

每条消息的形式均为 `{"type", "ticker", "data", "error", "ts"}`，`pong` 除外，它以 `{"type": "pong"}` 发送。

| `type` | 触发时机 | `data` |
|---|---|---|
| `not_streaming` | 只读密钥访问未在推送的代码（最先发送；`error` 说明原因） | — |
| `snapshot` | 连接建立后立即发送，前提是已缓存最新 tick | 最新 tick |
| `tick` | 每个新 tick | 该 tick |
| `pong` | 对客户端 `ping` 的应答 | — |

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

价格为以字符串形式序列化的十进制数。

### 客户端发送的消息

| 文本 | 效果 |
|---|---|
| `ping` | 服务器应答 `{"type": "pong"}` |
| `unsubscribe` | 服务器关闭连接 |

TradingView 代码根据代码后缀推导（`AIR.PA` → `EURONEXT:AIR`，`.DE` → `XETRA`）；没有后缀的代码被视为 NASDAQ 上市品种。

---

## <span className="api-method get">GET</span> `/quote/{ticker}`

某个代码的最新已知价格。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `subscribe_if_missing` | boolean | `false` | 同时在后台启动该代码的数据流。对只读密钥无效 |

当该代码正在推送时，返回已缓存的 tick（`is_realtime: true`，`source: "tradingview"`）。否则 Fonrex 返回 Yahoo Finance 上**按输入原样**查询的该代码的延迟价格（`is_realtime: false`，`source: "yfinance"`，`delay_seconds: 900`）。未找到任何数据时返回 `404`。tick 不包含前一日收盘价：对于正在推送的代码，`change` 和 `change_pct` 为 `0`，`previous_close` 为 `null`；延迟的 Yahoo 响应会填充这些字段。

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

多个代码的报价：`tickers` 为逗号分隔的列表，只取前 20 个。没有报价的代码为 `null`。该路由从不启动数据流。

```json
{ "count": 2, "tickers": ["AIR.PA", "BNP.PA"], "quotes": { "AIR.PA": { "...": "..." }, "BNP.PA": null } }
```

---

## <span className="api-method post">POST</span> `/realtime/subscribe`

启动最多 50 个代码的数据流。仅限完全访问密钥。

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

停止某个代码的数据流。仅限完全访问密钥。返回 `{"status": "unsubscribed", "ticker": "AIR.PA"}`；如果该代码未在推送，则返回 `404`。

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

`stale_tickers` 列出正在推送但在 Redis 中没有最新 tick 的代码。
