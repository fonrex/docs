---
id: "concurrency"
title: "Concurrence & exécution asynchrone"
sidebar_label: "Concurrence & async"
description: "Comment Fonrex exécute des appels bloquants sans bloquer la boucle d'événements de FastAPI"
---

# Concurrence & exécution asynchrone

FastAPI sert chaque requête sur une seule boucle d'événements `asyncio`. Un appel bloquant fait sur cette boucle (une requête SQLAlchemy synchrone, un calcul pandas, un téléchargement `yfinance`) arrête toutes les autres requêtes et tous les WebSockets du processus jusqu'à son retour.

## `run_sync()`

`concurrency.py` fournit une manière unique d'exécuter du code bloquant depuis du code asynchrone :

```python
from concurrency import run_sync

result = await run_sync(database.get_asset_context, ticker=ticker)
```

`run_sync` exécute la fonction dans un thread de travail (`asyncio.to_thread`), propage les variables de contexte et accepte des arguments nommés. `tests/test_async_boundary.py` vérifie que `main.py`, les routeurs, les cas d'usage et les paquets fonctionnels n'atteignent du code bloquant qu'à travers elle.

```
event loop ──► async route ──► await run_sync(blocking_call) ──► worker thread
     │                                                               │
     └── keeps serving other requests and WebSockets ◄───────────────┘
```

## Ce qui est déjà asynchrone

- Les requêtes d'historique, les actualités, la surveillance et le worker temps réel utilisent le moteur SQLAlchemy asynchrone (asyncpg), dérivé de `DATABASE_URL`.
- Les fournisseurs utilisent `httpx.AsyncClient` via `BaseFinancialProvider` ; les fournisseurs d'une même requête s'exécutent en parallèle (`asyncio.gather`), chacun avec sa propre limite de requêtes simultanées.
- Les caches utilisent le client Redis asynchrone, sauf `CacheService` (synchrone, appelé via `run_sync`).

## Travail en arrière-plan

| Travail | Mode d'exécution |
|---|---|
| Flux temps réel | Clients TradingView dans un pool de threads, au plus `TV_MAX_CONNECTIONS` à la fois ; les ticks sont rendus à la boucle d'événements |
| Canari quotidien | `AsyncIOScheduler` d'APScheduler, à `CANARY_RUN_HOUR` UTC |
| Journal d'utilisation | Mis en file par le middleware, écrit par lots par une tâche de fond ; une réponse ne l'attend jamais |
| Rafraîchissement des actualités, exécution du canari à la demande | Tâches de fond FastAPI |

## Consignes pour les contributeurs

1. Écrivez les routes avec `async def`.
2. Appelez un service synchrone avec `await run_sync(service.method, ...)` ; ne l'appelez jamais directement depuis une coroutine.
3. Attendez (`await`) directement les services asynchrones (Redis asyncio, `httpx`, asyncpg).
4. Gardez un seul worker Gunicorn : les flux, les clients WebSocket et le canari vivent dans la mémoire du processus.
