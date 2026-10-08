---
id: "docker-compose"
title: "Topologie Docker Compose"
sidebar_label: "Docker Compose"
description: "Conteneurs, ports, volumes, contrôles de santé et opérations courantes de la stack Fonrex"
---

# Topologie Docker Compose

`docker-compose.yml` exécute l'API (`fonrex-api`), la base de données (`db`) et le cache (`redis`). Un quatrième service, `fonrex-migrate`, exécute les migrations à la demande. Les commandes comme `docker compose exec` prennent le nom du service ; `docker exec` prend le nom du conteneur (`fonrex-db`, `fonrex-redis`).

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
- **Image** : construite à partir du `Dockerfile` (Python 3.12, utilisateur non root). Elle contient le code, les migrations Alembic et les fichiers d'amorçage (`data/*.csv`).
- **Port** : `5000` sur toutes les interfaces de l'hôte ; la clé d'API le protège.
- **Démarrage** (`entrypoint.sh`) : attend PostgreSQL et Redis, applique `alembic upgrade head`, importe éventuellement `data/etf.csv` (`SEED_ON_FIRST_RUN=true`), puis lance Gunicorn avec des workers Uvicorn (`WEB_CONCURRENCY`, 1 par défaut).
- **Configuration** : `.env` (`env_file`). `DATABASE_URL`, `REDIS_URL` et `ASYNC_DATABASE_URL` sont redéfinies pour que le conteneur joigne les services `db` et `redis`, et non `localhost`.
- **Montages** : uniquement ce que l'application écrit, `./logs` et `./static/logos`.
- **Contrôle de santé** : `curl -f http://localhost:5000/health`.

### `db` (conteneur `fonrex-db`)
- **Image** : `timescale/timescaledb-ha:pg16` (PostgreSQL 16 + TimescaleDB).
- **Port** : `127.0.0.1:5432`, accessible depuis l'hôte (psql, bundle Zipline), jamais depuis le réseau.
- **Volume** : `timescale_data`, monté sur le répertoire de données de cette image, `/home/postgres/pgdata/data` (`PGDATA`). Les données survivent à `docker compose down` et à une reconstruction.
- **Initialisation** : `postgres-init.sh` crée la base de données `fonrex`.

### `redis` (conteneur `fonrex-redis`)
- **Image** : `redis:7-alpine`, `--appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru`.
- **Port** : `127.0.0.1:6379` (Redis n'a pas de mot de passe).
- **Rôle** : cache des réponses, cours en temps réel, canaux Pub/Sub du flux WebSocket.

### `fonrex-migrate`
- **Profil** : `migrate` ; il ne démarre pas avec `docker compose up`.
- **Commande** : `alembic upgrade head`. Utile pour migrer sans démarrer l'API.

## Opérations courantes

```bash
docker compose up -d                       # start
docker compose up -d --build               # rebuild after a code update
docker compose logs -f fonrex-api          # API logs
docker compose --profile migrate run --rm fonrex-migrate   # migrations alone
docker compose down                        # stop, keep the data
docker compose down -v                     # stop and DELETE the database and cache volumes
```

Développement : `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` monte le dossier du projet sur `/app` ; une modification ne demande alors qu'un redémarrage.

## Sauvegarder la base de données {#backing-up-the-database}

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

Restaurez avec la même version de TimescaleDB que celle qui a produit le dump. Ne commitez jamais un dump dans Git : il contient les données de votre instance.

## Dépannage

### `401 Missing API key` ou `403` sur chaque requête
Définissez `FONREX_API_KEY` dans `.env`, lancez `docker compose up -d` et envoyez la clé avec chaque requête. Les journaux de démarrage indiquent le mode d'authentification : `docker compose logs fonrex-api | grep -i auth`.

### Permission refusée sur `logs`
```bash
mkdir -p logs
chmod 777 logs
docker compose up -d
```

### Nom de conteneur déjà utilisé
```bash
docker rm -f fonrex-db fonrex-redis fonrex-api
docker compose up -d
```

### Une installation dont la base de données n'était pas sur un volume
Les anciennes versions montaient le volume sur `/var/lib/postgresql/data`, un chemin que cette image n'utilise pas : la base de données vivait à l'intérieur du conteneur. Vérifiez avant la mise à jour :

```bash
docker exec fonrex-db psql -U fonrex -d fonrex -tc "show data_directory"
docker inspect fonrex-db --format '{{range .Mounts}}{{.Destination}} {{end}}'
```

Si le répertoire de données n'est pas une destination montée, sauvegardez la base de données **avant** `docker compose up -d` avec le nouveau `docker-compose.yml`, puis restaurez-la.
