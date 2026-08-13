---
id: "hexagonal"
title: "Hexagonal Architecture (Ports & Adapters)"
sidebar_label: "Hexagonal Architecture"
description: "Explanation of hexagonal architecture principles, port interfaces, and adapter boundary enforcement in Fonrex"
---

# Hexagonal Architecture

Fonrex strictly adheres to **Hexagonal Architecture** (Ports and Adapters) in its core domain modules. This decouples core business logic from transport frameworks (FastAPI), database ORMs (SQLAlchemy), and external scrapers (`yfinance`, `BeautifulSoup`).

## Layer Organization

```
┌──────────────────────────────────────────────────────────┐
│                   Adapters (Outer Layer)                 │
│  ┌───────────────────┐        ┌───────────────────────┐  │
│  │ HTTP Routers      │        │ SQLAlchemy ORM        │  │
│  │ (FastAPI)         │        │ (database/assets.py)  │  │
│  └─────────┬─────────┘        └───────────▲───────────┘  │
└────────────┼──────────────────────────────┼──────────────┘
             │ Implements Ports             │
┌────────────▼──────────────────────────────┴──────────────┐
│                    Application / Domain                  │
│  ┌───────────────────┐        ┌───────────────────────┐  │
│  │ Ports             │ ◄──────┤ Use Cases             │  │
│  │ (use_cases/ports) │        │ (use_cases/fundam...) │  │
│  └───────────────────┘        └───────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Architectural Rules

1. **`use_cases/` Directory Isolation**:
   - MUST NOT import `fastapi`, `starlette`, `sqlalchemy`, `yfinance`, or `requests`.
   - MUST NOT handle HTTP status codes or DB connection pooling directly.
   - Communicates exclusively via domain entities, dataclasses, and abstract Ports defined in `use_cases/ports.py`.

2. **Abstract Ports (`use_cases/ports.py`)**:
   - `FinancialsRepositoryPort`: Contract for persisting fundamental snapshots.
   - `FinancialProviderPort`: Abstract interface for upstream providers (`fetch(ticker, isin)`).
   - `CachePort`: Contract for key-value TTL operations.

3. **Adapters (`routers/`, `database/`, `financials/`)**:
   - HTTP Routers (`routers/fundamentals.py`) translate query parameters into Use Case input objects and catch domain exceptions (`use_cases/errors.py`) to map them to standard HTTP status codes (`404 Not Found`, `422 Unprocessable Entity`).

## Exception Mapping Table

| Domain Exception (`use_cases/errors.py`) | HTTP Status Code (`routers/errors.py`) |
|---|---|
| `ResourceNotFound` | `404 Not Found` |
| `InvalidInput` | `422 Unprocessable Entity` |
| `DependencyUnavailable` | `503 Service Unavailable` |
| `UpstreamFailure` | `502 Bad Gateway` |
