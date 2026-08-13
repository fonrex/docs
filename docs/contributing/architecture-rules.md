---
id: "architecture-rules"
title: "Architecture Rules & Guidelines"
sidebar_label: "Architecture Rules"
description: "Architectural constraints, module boundaries, and coding standards for Fonrex contributors"
---

# Architecture Rules & Guidelines

To maintain code quality, maintainability, and hexagonal separation, all code contributions MUST follow these rules:

## 1. Strict Layering Boundaries

- **`use_cases/`**: Pure business logic. MUST NOT import `fastapi`, `sqlalchemy`, or provider implementations directly.
- **`routers/`**: Transport layer. Translates HTTP requests to use case inputs and maps domain exceptions to HTTP status codes.
- **`concurrency.py`**: Blocking synchronous operations (SQLAlchemy, Pandas, yfinance) MUST be executed via `run_sync()`.

## 2. Identifier Strategy

- Always use `(asset_id, ticker, exchange, currency)` resolution via `DatabaseService.get_asset_context()`.
- Do not assume a ticker uniquely identifies a stock globally (`TSLA` can be a stock or an ETP). Always respect ISIN mappings.

## 3. Data Integrity & Validation

- All provider inputs MUST pass through `ValidationLayer` checks before being exposed to end users.
- Do not mask symptoms by returning dummy fallbacks or swallowing exceptions silently.
