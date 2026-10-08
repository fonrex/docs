---
id: "docker-compose"
title: "Docker Compose Topology"
sidebar_label: "Docker Compose"
description: "Containers, ports, volumes, health checks and everyday operations of the Fonrex stack"
---

# Docker Compose Topology

`docker-compose.yml` runs the API (`fonrex-api`), the database (`db`) and the cache (`redis`). A fourth service, `fonrex-migrate`, runs the migrations on demand. Commands such as `docker compose exec` take the service name; `docker exec` takes the container name (`fonrex-db`, `fonrex-redis`).

```
┌───────────────────────────── docker compose ─────────────────────────────┐
│                                                                          │
│   fonrex-api  ──────────►  fonrex-db (TimescaleDB)                       │
│   :5000                    127.0.0.1:5432, volume timescale_data         │
│      │                                                                   │
│      └────────────────►  fonrex-redis (Redis 7)                          │
│                            127.0.0.1:6379, volume redis_data             │
│                                                                          │
│   fonrex-migrate (profile "migrate"): alembic upgrade head               │
└──────────────────────────────────────────────────────────────────────────┘
```

## Services

### `fonrex-api`
- **Image**: built from the `Dockerfile` (Python 3.12, non-root user). It holds the code, the Alembic migrations and the seed files (`data/*.csv`).
- **Port**: `5000` on every interface of the host — the API key protects it.
- **Start-up** (`entrypoint.sh`): waits for PostgreSQL and Redis, applies `alembic upgrade head`, optionally imports `data/etf.csv` (`SEED_ON_FIRST_RUN=true`), then starts Gunicorn with Uvicorn workers (`WEB_CONCURRENCY`, 1 by default).
- **Configuration**: `.env` (`env_file`). `DATABASE_URL`, `REDIS_URL` and `ASYNC_DATABASE_URL` are overridden so that the container reaches the `db` and `redis` services, not `localhost`.
- **Mounts**: only what the application writes — `./logs` and `./static/logos`.
- **Health check**: `curl -f http://localhost:5000/health`.

### `db` (container `fonrex-db`)
- **Image**: `timescale/timescaledb-ha:pg16` (PostgreSQL 16 + TimescaleDB).
- **Port**: `127.0.0.1:5432` — reachable from the host (psql, Zipline bundle), never from the network.
- **Volume**: `timescale_data`, mounted on the data directory of this image, `/home/postgres/pgdata/data` (`PGDATA`). The data survives `docker compose down` and a rebuild.
- **Initialisation**: `postgres-init.sh` creates the `fonrex` database.

### `redis` (container `fonrex-redis`)
- **Image**: `redis:7-alpine`, `--appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru`.
- **Port**: `127.0.0.1:6379` (Redis has no password).
- **Role**: cache of the answers, real-time quotes, Pub/Sub channels of the WebSocket stream.

### `fonrex-migrate`
- **Profile**: `migrate` — it does not start with `docker compose up`.
- **Command**: `alembic upgrade head`. Useful to migrate without starting the API.

## Common operations

```bash
docker compose up -d                       # start
docker compose up -d --build               # rebuild after a code update
docker compose logs -f fonrex-api          # API logs
docker compose --profile migrate run --rm fonrex-migrate   # migrations alone
docker compose down                        # stop, keep the data
docker compose down -v                     # stop and DELETE the database and cache volumes
```

Development: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` mounts the project folder on `/app`, so an edit only needs a restart.

## Backing up the database

```bash
# Backup to one file on the host
docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex.dump

# Restore into an empty database
docker compose up -d db
docker compose exec -T db psql -U fonrex -d fonrex \
  -c "CREATE EXTENSION IF NOT EXISTS timescaledb;" -c "SELECT timescaledb_pre_restore();"
docker compose exec -T db pg_restore -U fonrex -d fonrex -Fc < fonrex.dump
docker compose exec -T db psql -U fonrex -d fonrex -c "SELECT timescaledb_post_restore();"
docker compose up -d
```

Restore with the same TimescaleDB version as the one that made the dump. Never commit a dump to Git: it holds the data of your instance.

## Troubleshooting

### `401 Missing API key` or `403` on every request
Set `FONREX_API_KEY` in `.env`, run `docker compose up -d` and send the key with each request. The start-up logs state the authentication mode: `docker compose logs fonrex-api | grep -i auth`.

### Permission denied on `logs`
```bash
mkdir -p logs
chmod 777 logs
docker compose up -d
```

### Container name already in use
```bash
docker rm -f fonrex-db fonrex-redis fonrex-api
docker compose up -d
```

### An installation whose database was not on a volume
Older versions mounted the volume on `/var/lib/postgresql/data`, a path this image does not use: the database lived inside the container. Check before upgrading:

```bash
docker exec fonrex-db psql -U fonrex -d fonrex -tc "show data_directory"
docker inspect fonrex-db --format '{{range .Mounts}}{{.Destination}} {{end}}'
```

If the data directory is not a mounted destination, back the database up **before** `docker compose up -d` with the new `docker-compose.yml`, then restore it.
