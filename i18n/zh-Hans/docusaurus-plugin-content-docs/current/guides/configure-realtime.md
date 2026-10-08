---
id: "configure-realtime"
title: "实时流与 WebSocket 设置"
sidebar_label: "配置实时数据"
description: "启动 TradingView 流、通过 WebSocket 接收 tick，并调整实时 worker"
---

# 实时流与 WebSocket 设置

实时 worker 运行在 API 进程内部。它为已订阅的 ticker 保持 TradingView WebSocket 流处于打开状态，并通过 Redis 分发每个 1 分钟 tick。

```
TradingView WebSocket
        │
        ▼
RealtimePriceWorker (API process)
        ├─► Redis key quote:{ticker}       last tick, 60 s      ──► GET /quote/{ticker}
        ├─► Redis channel price:{ticker}   each tick            ──► WS /ws/realtime/{ticker}
        └─► prices_intraday (TimescaleDB)  1-minute candles, kept 30 days
```

## 1. 订阅 ticker

启动流需要使用**完全访问**密钥：

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"tickers": ["AIR.PA", "BNP.PA"]}' http://localhost:5000/realtime/subscribe
```

使用完全访问密钥连接 `WS /ws/realtime/{ticker}` 时，也会为尚未推流的 ticker 启动流。订阅保存在 `realtime_subscriptions` 中，并在 API 重启时恢复。

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/realtime/status
curl -s -X DELETE -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/realtime/subscribe/BNP.PA
```

## 2. 接收 tick

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === "snapshot" || type === "tick") console.log(type, data.close);
};
```

仓库中还提供了一个 Python 示例客户端：`make example-client`（`scripts/example_realtime_client.py`）。

**只读密钥**（用于仪表板或您机器之外的任何客户端）永远不会启动流。对于尚未推流的 ticker，它们会收到一条 `not_streaming` 消息，一旦某个完全访问客户端订阅了该 ticker，就会开始接收其 tick。`GET /quote/{ticker}` 和 `GET /openbb/quote/{ticker}` 也从不启动流：没有流时，它们返回 Yahoo Finance 的延迟价格。

## 3. 设置

```env
# Simultaneous TradingView connections
TV_MAX_CONNECTIONS=10
# First reconnection delay in seconds, doubled after each failure up to 60
TV_RECONNECT_DELAY=5
# Lifetime of the last tick in Redis, in seconds
REALTIME_QUOTE_TTL=60
```

## 注意事项

- **单一进程。** 流、订阅和 WebSocket 客户端都保存在 API 进程的内存中。请保持 `WEB_CONCURRENCY=1`：每增加一个 Gunicorn worker，都会打开自己的一套流。
- **TradingView 代码。** 它根据 ticker 后缀推导（`AIR.PA` → `EURONEXT:AIR`，`.DE` → `XETRA`）；没有后缀的 ticker 被视为 NASDAQ 上的品种。与日终数据采集不同，实时路径不会根据上市品种的 ISIN 和货币核对该行情。
- **日内数据存储。** 当 ticker 在目录中时，1 分钟 K 线按金融工具（而非上市品种）保存，并由 TimescaleDB 保留策略在 30 天后清除。
- **反向代理。** API 前面的代理必须转发 WebSocket 升级请求，请参阅 [Docker 生产部署](../deployment/docker.md)。
