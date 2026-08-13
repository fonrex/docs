---
id: "architecture-rules"
title: "Règles & Directives d'Architecture"
sidebar_label: "Règles d'Architecture"
description: "Contraintes architecturales, limites de modules et normes de code pour les contributeurs Fonrex"
---


# Règles & Directives d'Architecture

To maintain code quality, maintainability, and hexagonal separation, all code contributions MUST follow these rules:

## 1. Limites Strictes des Couches

- **`use_cases/`**: Pure business logic. MUST NOT import `fastapi`, `sqlalchemy`, or provider implementations directly.
- **`routers/`**: Transport layer. Translates HTTP requests to use case inputs and maps domain exceptions to HTTP status codes.
- **`concurrency.py`**: Blocking synchronous operations (SQLAlchemy, Pandas, yfinance) MUST be executed via `run_sync()`.

## 2. Stratégie d'Identifiants

- Always use `(asset_id, ticker, exchange, currency)` resolution via `DatabaseService.get_asset_context()`.
- Do not assume a ticker uniquely identifies a stock globally (`TSLA` can be a stock or an ETP). Always respect ISIN mappings.

## 3. Intégrité & Validation des Données

- All provider inputs MUST pass through `ValidationLayer` checks before being exposed to end users.
- Do not mask symptoms by returning dummy fallbacks or swallowing exceptions silently.
