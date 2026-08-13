---
id: "hexagonal"
title: "Architecture Hexagonale (Ports & Adaptateurs)"
sidebar_label: "Architecture Hexagonale"
description: "Explication des principes d'architecture hexagonale, interfaces de ports et limites d'adaptateurs dans Fonrex"
---


# Architecture Hexagonale

Fonrex respecte strictement l'**Architecture Hexagonale** (Ports et Adaptateurs) dans ses modules du domaine. Cela isole la logique métier des frameworks de transport (FastAPI), des ORM (SQLAlchemy) et des scrapers externes (`yfinance`, `BeautifulSoup`).

## Organisation en Couches

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

## Règles d'Architecture

1. **`use_cases/` Directory Isolation**:
   - MUST NOT import `fastapi`, `starlette`, `sqlalchemy`, `yfinance`, or `requests`.
   - MUST NOT handle HTTP status codes or DB connection pooling directly.
   - Communicates exclusively via domain entities, dataclasses, and abstract Ports defined in `use_cases/ports.py`.

2. **Abstract Ports (`use_cases/ports.py`)**:
   - `FinancialsRepositoryPort`: Contract for persisting fundamental snapshots.
   - `FinancialProviderPort` : Interface abstraite pour les providers en amont (`fetch(ticker, isin)`).
   - `CachePort`: Contract for key-value TTL operations.

3. **Adapters (`routers/`, `database/`, `financials/`)**:
   - Les routeurs HTTP (`routers/fundamentals.py`) traduisent les paramètres de requête en objets d'entrée Use Case et capturent les exceptions du domaine (`use_cases/errors.py`) pour les associer aux codes de statut HTTP standards (`404 Not Found`, `422 Unprocessable Entity`).

## Table de Correspondance des Exceptions

| Domain Exception (`use_cases/errors.py`) | HTTP Status Code (`routers/errors.py`) |
|---|---|
| `ResourceNotFound` | `404 Not Found` |
| `InvalidInput` | `422 Unprocessable Entity` |
| `DependencyUnavailable` | `503 Service Unavailable` |
| `UpstreamFailure` | `502 Bad Gateway` |
