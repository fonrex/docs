---
id: "concurrency"
title: "Concurrency & Async Execution"
sidebar_label: "Concurrency & Async"
description: "How Fonrex runs blocking calls without blocking the FastAPI event loop"
---

# Concurrency & Async Execution

FastAPI serves every request on one `asyncio` event loop. A blocking call made on that loop — a synchronous SQLAlchemy query, a pandas calculation, a `yfinance` download — stops every other request and WebSocket of the process until it returns.

## `run_sync()`

`concurrency.py` provides one way to run blocking code from asynchronous code:

```python
from concurrency import run_sync

result = await run_sync(database.get_asset_context, ticker=ticker)
```

`run_sync` runs the function in a worker thread (`asyncio.to_thread`), propagates the context variables and accepts keyword arguments. `tests/test_async_boundary.py` checks that `main.py`, the routers, the use cases and the feature packages reach blocking code only through it.

```
event loop ──► async route ──► await run_sync(blocking_call) ──► worker thread
     │                                                               │
     └── keeps serving other requests and WebSockets ◄───────────────┘
```

## What is asynchronous already

- History queries, news, monitoring and the realtime worker use the asynchronous SQLAlchemy engine (asyncpg), derived from `DATABASE_URL`.
- Providers use `httpx.AsyncClient` through `BaseFinancialProvider`; the providers of one request run in parallel (`asyncio.gather`), each with its own limit of simultaneous requests.
- Caches use the asynchronous Redis client, except `CacheService` (synchronous, called through `run_sync`).

## Background work

| Work | How it runs |
|---|---|
| Realtime streams | TradingView clients in a thread pool, at most `TV_MAX_CONNECTIONS` at once; ticks handed back to the event loop |
| Daily canary | APScheduler `AsyncIOScheduler`, `CANARY_RUN_HOUR` UTC |
| Usage log | Queued by the middleware, written in batches by a background task; a response never waits for it |
| News refresh, canary run on demand | FastAPI background tasks |

## Guidelines for contributors

1. Write routes with `async def`.
2. Call a synchronous service with `await run_sync(service.method, ...)`; never call it directly from a coroutine.
3. Await asynchronous services (Redis asyncio, `httpx`, asyncpg) directly.
4. Keep one Gunicorn worker: the streams, the WebSocket clients and the canary live in the process memory.
