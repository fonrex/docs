---
id: "concurrency"
title: "并发与异步执行"
sidebar_label: "并发与异步"
description: "Fonrex 如何在异步 FastAPI 事件循环中管理同步阻塞调用"
---


# 并发与异步执行

FastAPI relies on an asynchronous event loop (`asyncio`). Blocking operations—such as CPU-heavy pandas calculations, synchronous database ORM calls, or synchronous network requests (`yfinance`, `requests`)—must never be executed directly on the main event loop thread.

## The `run_sync` Helper (`concurrency.py`)

Fonrex provides `run_sync()` in `concurrency.py` as a unified abstraction for executing blocking synchronous code safely inside worker threads:

```python
from concurrency import run_sync

# Offloads a synchronous blocking function to the default ThreadPoolExecutor
result = await run_sync(sync_blocking_function, arg1, arg2, kwarg=value)
```

## Internal Architecture

```
FastAPI Event Loop (Async)
       │
       ├─► Async HTTP Router Endpoint (async def)
       │         │
       │         ├─► Calls run_sync(DatabaseService.get_asset, ticker)
       │         │         │
       │         │         ▼
       │         │   ThreadPoolExecutor Worker Thread
       │         │   (执行同步 SQLAlchemy ORM 查询)
       │         │         │
       │         │   ◄─────┘
       │         │
       │   ◄─────┘ Event Loop remains unblocked for other requests!
       │
       └─► Processes other concurrent HTTP / WS connections
```

## Guidelines for Developers

1. **Async Routers**: Define router functions with `async def`.
2. **Synchronous Services**: If a service method interacts with `DatabaseService` or `yfinance`, invoke it via `await run_sync(service.method, ...)` from the router.
3. **Async Services**: Services that utilize `redis.asyncio` or `httpx.AsyncClient` (`NewsService`, `CanaryMonitor`) can be awaited directly without `run_sync`.
