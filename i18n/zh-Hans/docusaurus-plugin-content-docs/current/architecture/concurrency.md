---
id: "concurrency"
title: "并发与异步执行"
sidebar_label: "并发与异步"
description: "Fonrex 如何在不阻塞 FastAPI 事件循环的情况下执行阻塞调用"
---

# 并发与异步执行

FastAPI 在一个 `asyncio` 事件循环上处理所有请求。在该循环上进行的阻塞调用——同步的 SQLAlchemy 查询、pandas 计算、`yfinance` 下载——会使进程中所有其他请求和 WebSocket 停顿，直到该调用返回。

## `run_sync()`

`concurrency.py` 提供了从异步代码中执行阻塞代码的唯一方式：

```python
from concurrency import run_sync

result = await run_sync(database.get_asset_context, ticker=ticker)
```

`run_sync` 在工作线程中运行函数（`asyncio.to_thread`），传播上下文变量，并接受关键字参数。`tests/test_async_boundary.py` 检查 `main.py`、路由器、用例和功能包只通过它来调用阻塞代码。

```
event loop ──► async route ──► await run_sync(blocking_call) ──► worker thread
     │                                                               │
     └── keeps serving other requests and WebSockets ◄───────────────┘
```

## 已经是异步的部分

- 历史查询、新闻、监控和实时 worker 使用异步 SQLAlchemy 引擎（asyncpg），由 `DATABASE_URL` 派生。
- 数据提供方通过 `BaseFinancialProvider` 使用 `httpx.AsyncClient`；同一请求中的各数据提供方并行运行（`asyncio.gather`），每个都有各自的并发请求数限制。
- 缓存使用异步 Redis 客户端，`CacheService` 除外（同步，通过 `run_sync` 调用）。

## 后台任务

| 任务 | 运行方式 |
|---|---|
| 实时数据流 | 线程池中的 TradingView 客户端，同时最多 `TV_MAX_CONNECTIONS` 个；tick 交回事件循环处理 |
| 每日金丝雀 | APScheduler `AsyncIOScheduler`，UTC 时间 `CANARY_RUN_HOUR` |
| 使用日志 | 由中间件放入队列，由后台任务批量写入；响应从不等待它 |
| 新闻刷新、按需金丝雀运行 | FastAPI 后台任务 |

## 贡献者指南

1. 使用 `async def` 编写路由。
2. 使用 `await run_sync(service.method, ...)` 调用同步服务；切勿在协程中直接调用。
3. 直接 await 异步服务（Redis asyncio、`httpx`、asyncpg）。
4. 保持只有一个 Gunicorn worker：数据流、WebSocket 客户端和金丝雀都存在于进程内存中。
