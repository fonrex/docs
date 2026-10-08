---
id: "architecture-rules"
title: "Architecture Rules & Guidelines"
sidebar_label: "Architecture Rules"
description: "The contribution rules of AGENTS.md and the test that holds each one"
---

# Architecture Rules & Guidelines

`AGENTS.md`, at the root of the repository, is the contract for every contribution, human or automated. Each rule is held by a test: breaking one fails `make ci`.

| # | Rule | Held by |
|---|---|---|
| 1 | **One HTTP layer.** A provider never creates an HTTP client; it uses the helpers of `financials/providers/base.py`, where retries, pauses, concurrency limit and proxy live | `tests/test_provider_http_policy.py` |
| 2 | **Settings are real.** Read settings with the helpers of `settings.py`; every variable of `.env.example` is read by the code; an invalid value falls back with a warning | `tests/test_env_settings.py` |
| 3 | **Documents tell the truth.** Figures of `README.md` match the code; the tables of `ARCHITECTURE.md` list every route, migration and module | `tests/test_docs_consistency.py` |
| 4 | **Providers load, or the failure is visible** (`PROVIDER_SPECS`, `/health`) | `tests/test_docs_consistency.py` |
| 5 | **Units are declared** in `monitoring/units.py` | `tests/test_provider_units.py` |
| 6 | **Coverage floors only go up**, one per provider | `tests/test_coverage_gate.py` |
| 7 | **Secure by default.** Every route needs a key unless declared public; a route that changes something is never a `GET` | `tests/test_auth_defaults.py` |
| 8 | **The Docker image is self-contained**; `.env` never goes into it | `tests/test_docker_image.py` |
| 9 | **The usage log never delays a response**; no IP stored unless asked | `tests/test_usage_recorder.py` |
| 10 | **No real network in tests** (`fake_network`, saved pages) | `tests/conftest.py` |
| 11 | **Versions are locked** (`requirements*.lock`, hash-checked) | `tests/test_dependency_lock.py` |
| 12 | **Prices belong to a listing**: key `(asset_listing_id, resolution, time)`, session date at midnight UTC, tickers resolved by `database/price_series.py` | `tests/test_price_series.py` |
| 13 | **Source symbols are verified, never guessed** (`historical/yahoo_symbols.py`) | `tests/test_yahoo_symbols.py` |
| 14 | **Displayed numbers are read in one place** (`financials/numbers.py`) | `tests/test_numbers.py` |
| 15 | **A rendered figure names its source** (`Sources` of `/fundamental`) | `tests/test_financials_formatter.py` |
| 16 | **Nothing read from Redis is executed, nothing is deleted without bounds** (JSON cache, bounded cleanup with `dry_run`) | `tests/test_cache_service.py`, `tests/test_database_cleanup.py` |
| 17 | **The CI tests on the database of an installation** (same TimescaleDB image) | `tests/test_ci_workflow.py` |
| 18 | **Statements are read by fiscal year** (`financials/fiscal_years.py`) | `tests/test_fiscal_years.py` |
| 19 | **A cache key holds every parameter that changes the answer** | `tests/test_cache_keys.py` |

## Layering

- `routers/` parse the request and translate application errors into HTTP statuses.
- `use_cases/` depend on the ports of `use_cases/ports.py`, never on FastAPI, SQLAlchemy or a provider.
- Blocking code is called through `concurrency.run_sync()`.

See [Layers & ports](../architecture/hexagonal.md).

## Identity

- Never take a ticker for a global identifier: `SPFF` is a bond ETF in EUR in a catalogue and a US fund on Yahoo. Resolve a listing (ticker, exchange, currency) and use the symbol verified for it.
- Never mask a failure with a fallback value or a silent `except`: report why something is missing (`reason`, `note`, `warnings`).
