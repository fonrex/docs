---
id: "testing"
title: "Testing Guidelines & Execution"
sidebar_label: "Testing Guidelines"
description: "The quality gate, the database tests and how to test providers without network"
---

# Testing Guidelines & Execution

## The quality gate

```bash
make ci
```

`make ci` is what GitHub Actions runs on every pull request and push to `main`:

| Step | Command | Blocks |
|---|---|---|
| Lint | `make lint` (Ruff) | Strict Ruff violations |
| Annotations | `make typecheck` | Untyped boundaries of the listed modules |
| Syntax | `make syntax` | Python files that do not compile |
| Migrations | `make migration-check` | More than one Alembic head |
| Tests and coverage | `make test-cov` | Failing tests, warnings (`PYTHONWARNINGS=error`), global coverage under 70 %, a module under its own floor |

Coverage floors are listed per module in `scripts/check_coverage_distribution.py`, including every data provider; a provider without a floor fails the gate. Floors only go up.

## Running tests

```bash
PYTHONPATH=. pytest                                   # everything
PYTHONPATH=. pytest tests/test_technical_indicators.py -v
PYTHONPATH=. pytest -k "cache_key"
```

The suite never talks to a real service: `tests/conftest.py` clears the credentials of your shell, points Redis and the database to unreachable addresses and makes any real Yahoo lookup fail.

## Database tests

`tests/test_timescale_integration.py` runs the real migrations on a real TimescaleDB: migration of existing prices, compressed hypertable, upserts, cleanup, downgrade and upgrade, and a migration that waits for a TimescaleDB job. Without a server they are skipped.

```bash
make test-db     # throwaway container of the image of docker-compose.yml, port 54329
```

Or against any TimescaleDB server — each run creates and drops its own database:

```bash
FONREX_TEST_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/postgres make ci
```

The CI runs them on a `timescaledb` service of the same image as `docker-compose.yml`.

## Writing tests

- **No real network.** Provider tests use the `fake_network` fixture (`tests/conftest.py`): every `httpx` request is answered by a canned response, and a request without one fails the test.
- **Real pages.** Parsers are tested on reduced copies of real pages in `tests/fixtures/providers/`.
- **Cache keys.** A route that gains a parameter gets a test with two requests differing by that parameter only (`tests/test_cache_keys.py`).
- **Statements by fiscal year.** Test a calculation on rows stored the way the enrichment stores them: three rows per fiscal year.
- **A test must fail without the fix.** Check it by reverting the change once.

Some guards read the documents: `tests/test_docs_consistency.py` compares the tables of `ARCHITECTURE.md` (routes, migrations, modules, cache lifetimes, canary assets) and the figures of `README.md` with the code.
