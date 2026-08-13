---
id: "realtime"
title: "实时与 WebSocket API 参考"
sidebar_label: "实时与 WebSockets"
description: "WebSocket 实时价格流、REST 行情快照及订阅管理 Endpoint"
---


# 实时与 WebSocket API 参考

实时 API 通过 TradingView 桥接连接和 Redis 发布/订阅，借助 WebSocket 实时传输 1 分钟市场 Tick，并暴露高速行情 REST 快照。

---

## <span className="api-method ws">WS</span> `/ws/realtime/{ticker}`

打开针对给定股票代码的持久 WebSocket 流传输通道，以获取实时 Tick 更新。

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

从 Redis 易失性缓存中获取最新的价格行情快照。如果 `REALTIME_AUTO_SUBSCRIBE=true`，将自动触发实时流订阅。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | 股票代码（例如 `AAPL`） |

### 响应示例

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

针对多个股票代码的批量行情快照获取。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `tickers` | `string` | ✅ | — | Comma-separated list of tickers (e.g. `AAPL,MSFT,TSLA`) |

---

## <span className="api-method post">POST</span> `/realtime/subscribe`

将股票代码显式订阅到后台流处理 Worker `RealtimePriceWorker`。

### 请求体 (Request Body)

```json
{
  "ticker": "NVDA"
}
```

---

## <span className="api-method delete">DELETE</span> `/realtime/subscribe/{ticker}`

取消股票代码在后台实时流中的订阅。

---

## <span className="api-method get">GET</span> `/realtime/status`

列出所有活跃的市场流处理 Worker 订阅。

### 响应示例

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
