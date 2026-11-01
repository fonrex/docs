---
id: "docker"
title: "Docker Production Deployment"
sidebar_label: "Docker Deployment"
description: "Run Fonrex on a server: Compose overrides, reverse proxy with TLS and WebSocket, what to expose"
---

# Docker Production Deployment

Fonrex is a self-hosted application for your own use. On a server, run the same `docker-compose.yml` as locally and put a reverse proxy with TLS in front of the API.

## What is exposed

| Service | Published on | Reach it from |
|---|---|---|
| `fonrex-api` | `0.0.0.0:5000` | The reverse proxy only — bind it to `127.0.0.1` on a server (override below) |
| `db` | `127.0.0.1:5432` | The host only |
| `redis` | `127.0.0.1:6379` | The host only (Redis has no password) |

Every API route except `/health`, the documentation, the OpenBB discovery files and `/static` requires a key. Give clients outside the machine (dashboards, Google Sheets) a **read-only** key.

## Compose override

Create `docker-compose.prod.yml`:

```yaml
services:
  fonrex-api:
    ports: !override
      - "127.0.0.1:5000:5000"
    deploy:
      resources:
        limits:
          memory: 4g

  db:
    deploy:
      resources:
        limits:
          memory: 4g
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

`!override` replaces the port list instead of adding to it; it needs Docker Compose 2.24 or later.

Keep `WEB_CONCURRENCY=1`: the realtime streams, the WebSocket clients and the daily canary live in the API process, and each extra worker would duplicate them.

## External database

To use a PostgreSQL server outside Compose (it needs the TimescaleDB extension), keep `docker-compose.yml` as it is and put the address in `docker-compose.override.yml`, which `docker compose` loads on its own:

```yaml
services:
  db:
    profiles: [local-db]          # db no longer starts
  fonrex-api:
    environment:
      - DATABASE_URL=postgresql://fonrex:${POSTGRES_PASSWORD}@db.example.com:5432/fonrex
    depends_on: !override
      redis:
        condition: service_healthy
  fonrex-migrate:
    environment:
      - DATABASE_URL=postgresql://fonrex:${POSTGRES_PASSWORD}@db.example.com:5432/fonrex
    depends_on: !reset []
```

At start-up the entrypoint waits for the host and port of `DATABASE_URL` (here `db.example.com:5432`; `db:5432` when the URL gives none). The `!override` and `!reset` tags need Docker Compose 2.24 or later.

With `db` stopped, the backup command of the `db` service no longer applies: run `pg_dump` against the external server, for example `pg_dump -h db.example.com -U fonrex -d fonrex -Fc > fonrex.dump`.

## Reverse proxy (NGINX)

```nginx
server {
    listen 443 ssl http2;
    server_name fonrex.example.com;

    ssl_certificate     /etc/letsencrypt/live/fonrex.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fonrex.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

Gunicorn runs with a 120-second timeout: a first ingestion or a `/fundamental` request querying every provider can take several seconds.

Without a server, a tunnel (zrok, Cloudflare Tunnel, Tailscale Funnel) gives a local instance an HTTPS URL — see the [Google Sheets guide](../guides/google-sheets-connector.md).

## Outbound requests

Your server's IP address makes the requests to the data sources. Websites protected by an anti-bot service may refuse a datacenter IP; route those providers through a proxy:

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
```

## Data and backups

The database is in the `timescale_data` volume. Back it up with `pg_dump` (see [Docker Compose](../getting-started/docker-compose.md#backing-up-the-database)) before every upgrade, and keep dumps out of Git.
