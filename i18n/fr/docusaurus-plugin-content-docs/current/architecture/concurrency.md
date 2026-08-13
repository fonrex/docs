---
id: "concurrency"
title: "Concurrence & Exécution Asynchrone"
sidebar_label: "Concurrence & Asynchrone"
description: "Comment Fonrex gère les appels bloquants synchrones dans la boucle d'événements asynchrone FastAPI"
---


# Concurrence & Exécution Asynchrone

FastAPI s'appuie sur une boucle d'événements asynchrone (`asyncio`). Les opérations bloquantes (calculs pandas, appels ORM ou requêtes HTTP synchrones) ne doivent jamais s'exécuter directement sur le thread principal de la boucle d'événements.

## The `run_sync` Helper (`concurrency.py`)

Fonrex provides `run_sync()` in `concurrency.py` as a unified abstraction for executing blocking synchronous code safely inside worker threads:

```python
from concurrency import run_sync

# Offloads a synchronous blocking function to the default ThreadPoolExecutor
result = await run_sync(sync_blocking_function, arg1, arg2, kwarg=value)
```

## Architecture Interne

```
FastAPI Event Loop (Async)
       │
       ├─► Async HTTP Router Endpoint (async def)
       │         │
       │         ├─► Calls run_sync(DatabaseService.get_asset, ticker)
       │         │         │
       │         │         ▼
       │         │   ThreadPoolExecutor Worker Thread
       │         │   (Exécute une requête ORM SQLAlchemy synchrone)
       │         │         │
       │         │   ◄─────┘
       │         │
       │   ◄─────┘ Event Loop remains unblocked for other requests!
       │
       └─► Processes other concurrent HTTP / WS connections
```

## Directives pour les Développeurs

1. **Async Routers**: Define router functions with `async def`.
2. **Synchronous Services**: If a service method interacts with `DatabaseService` or `yfinance`, invoke it via `await run_sync(service.method, ...)` from the router.
3. **Async Services**: Services that utilize `redis.asyncio` or `httpx.AsyncClient` (`NewsService`, `CanaryMonitor`) can be awaited directly without `run_sync`.
