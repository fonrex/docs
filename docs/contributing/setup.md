---
id: "setup"
title: "Development Environment Setup"
sidebar_label: "Dev Setup"
description: "Run Fonrex from source with locked dependencies, a local database and the quality gate"
---

# Development Environment Setup

## Prerequisites

- Python 3.12
- Docker and Docker Compose (database and Redis)
- Git, and `make`

## 1. Clone and create a virtual environment

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

## 2. Install the locked dependencies

```bash
make install-dev
```

This installs `requirements-dev.lock`: exact versions, each checked against its hash — the same packages as the Docker image and the CI. After editing `requirements*.txt`, refresh the locks with `make lock` (needs `uv`); never edit the `.lock` files by hand.

## 3. Start the database and Redis

```bash
cp .env.example .env              # set FONREX_API_KEY
docker compose up -d db redis
```

Both are published on `127.0.0.1`, so the `localhost` addresses of `.env.example` reach them.

## 4. Migrate and run the API

```bash
alembic upgrade head
make run                          # uvicorn --reload on port 5000, loads .env
```

The interactive documentation is at `http://localhost:5000/docs`.

To run your working copy inside Docker instead, without rebuilding at each change:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 5. Run the quality gate

```bash
make ci
```

See [Testing](testing.md). Before opening a pull request, read [Architecture rules](architecture-rules.md): each rule is held by a test. Pull request titles follow Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`), subject in lower case.
