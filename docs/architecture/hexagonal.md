---
id: "hexagonal"
title: "Layers & Ports"
sidebar_label: "Layers & Ports"
description: "How Fonrex separates HTTP adapters, application logic and adapters to the outside, and how far each feature follows it"
---

# Layers & Ports

The code is organised by feature, and inside a feature in three levels:

1. **HTTP adapters** (`routers/`) — parse the request, call the level below, translate errors into HTTP statuses.
2. **Application logic** — use cases (`use_cases/`) or feature services (`historical/`, `technical/`, `news/`, `valuation/`, `monitoring/`, `macro/`).
3. **Adapters to the outside** — SQLAlchemy repositories (`database/`), Redis (`cache/`), providers (`financials/providers/`, `news/providers/`, `historical/providers.py`).

```
┌──────────────── routers/ (FastAPI) ────────────────┐
│  parse request → call use case → map errors        │
└──────────────────────────┬─────────────────────────┘
                           ▼
┌──────── use_cases/ — depends on ports only ────────┐
│  GetFundamentals, GetDeepFundamentals, GetQuote…   │
│  use_cases/ports.py: repository, cache, providers  │
└──────────────────────────┬─────────────────────────┘
                           ▼ implemented by
┌──── database/, cache/, financials/providers/ ──────┐
│  SQLAlchemy, Redis, HTTP                           │
└────────────────────────────────────────────────────┘
```

## How far each feature follows it

| Feature | Router | Application logic | Behind ports? |
|---|---|---|---|
| Fundamentals | `routers/fundamentals.py` | `use_cases/fundamentals.py` | Yes (`use_cases/ports.py`) |
| Specialised providers | `routers/specialized.py` | `use_cases/specialized.py` | Yes |
| Realtime | `routers/realtime.py` | `use_cases/realtime.py` | Partly — the WebSocket protocol is in the router |
| Technical indicators | `routers/technical.py` | `technical/indicator_service.py` | Yes (`technical/contracts.py`) |
| Monitoring | `routers/monitoring.py` | `monitoring/` | Partly — the canary and the validation layer use `monitoring/ports.py`; the read queries of the routes are written in the router |
| History and EOD | `routers/historical.py`, `routers/assets.py` | `historical/ingestion_service.py`, `database/query.py` | No |
| Valuation | `routers/valuation.py` | `valuation/dcf_service.py` | No |
| News | `routers/news.py` | `news/news_service.py` | No |
| Macro, operations | `routers/macro.py`, `routers/admin.py` | `macro/`, `database/maintenance.py`, `cache/` | No |

The use-case layer is the target model; the other features call their services directly.

## Rules held by tests

- `technical/` imports neither FastAPI, SQLAlchemy, Redis nor the ORM models; `monitoring/` neither SQLAlchemy nor the ORM models (`tests/test_exception_boundaries.py`).
- Blocking code (SQLAlchemy sessions, pandas, yfinance) is reached through `concurrency.run_sync()` from the asynchronous code (`tests/test_async_boundary.py`) — see [Concurrency](concurrency.md).
- Routers translate application errors with `routers/errors.py`.

## Error mapping

| Application error (`use_cases/errors.py`) | HTTP status |
|---|---|
| `InvalidInput` | `400 Bad Request` |
| `ResourceNotFound` | `404 Not Found` |
| `DependencyUnavailable` | `503 Service Unavailable` |
| `UpstreamFailure` | `500 Internal Server Error` |

The technical indicators have their own errors: unknown indicator `400`, no prices `404`, too few bars `422`.
