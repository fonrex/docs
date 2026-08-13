---
id: "hexagonal"
title: "六边形架构（端口与适配器）"
sidebar_label: "六边形架构"
description: "Fonrex 中六边形架构原则、端口接口和适配器边界约束的说明"
---


# 六边形架构

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
   - `FinancialProviderPort`：上游提供商的抽象接口 (`fetch(ticker, isin)`)。
   - `CachePort`: Contract for key-value TTL operations.

3. **Adapters (`routers/`, `database/`, `financials/`)**:
   - HTTP 路由 (`routers/fundamentals.py`) 将请求参数转换为用例输入对象，并捕获领域异常 (`use_cases/errors.py`) 以将其映射到标准 HTTP 状态码（`404 Not Found`、`422 Unprocessable Entity`）。

## Exception Mapping Table

| Domain Exception (`use_cases/errors.py`) | HTTP Status 状态码 (`routers/errors.py`) |
|---|---|
| `ResourceNotFound` | `404 Not Found` |
| `InvalidInput` | `422 Unprocessable Entity` |
| `DependencyUnavailable` | `503 Service Unavailable` |
| `UpstreamFailure` | `502 Bad Gateway` |
