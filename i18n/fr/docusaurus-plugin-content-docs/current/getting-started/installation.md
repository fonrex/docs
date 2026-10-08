---
id: "installation"
title: "Guide d'installation"
sidebar_label: "Installation"
description: "Installer et exécuter une instance Fonrex auto-hébergée avec Docker Compose"
---

# Guide d'installation

Ce guide met en place une instance Fonrex auto-hébergée avec Docker Compose.

## Prérequis

- Docker Engine et Docker Compose v2
- Linux, macOS, ou Windows avec WSL2
- 4 Go de RAM au minimum, 8 Go recommandés pour les ingestions volumineuses
- De l'espace disque pour l'historique de prix que vous ingérez (une première ingestion récupère environ dix ans par cotation)

## 1. Cloner le dépôt

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

## 2. Créer `.env`

```bash
cp .env.example .env
```

Docker Compose charge `.env` dans le conteneur de l'API. Deux paramètres doivent être définis **avant le premier démarrage** :

**Une clé d'API.** L'authentification est activée par défaut : tant qu'aucune clé n'est configurée, toutes les routes sauf `/health`, la documentation et les fichiers de découverte OpenBB répondent `401`.

```bash
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
```

**Le mot de passe de la base de données.** Changez `POSTGRES_PASSWORD` (lettres, chiffres, `-` et `_` uniquement, car il est intégré dans une URL). Il est enregistré dans le volume de la base de données lors de sa création ; le changer ensuite exige `ALTER USER fonrex PASSWORD '...'` ou un nouveau volume.

Gardez un seul `KEY=value` par ligne et placez les commentaires sur leur propre ligne : Docker Compose lit un commentaire placé après une valeur vide comme la valeur elle-même.

Voir [Configuration](configuration.md) pour tous les paramètres.

## 3. Démarrer la stack

```bash
mkdir -p logs
docker compose up -d
```

Cela démarre trois conteneurs :

| Conteneur | Rôle | Publié sur |
|---|---|---|
| `fonrex-api` | FastAPI servi par Gunicorn | `0.0.0.0:5000` |
| `fonrex-db` | PostgreSQL 16 + TimescaleDB (`timescale/timescaledb-ha:pg16`) | `127.0.0.1:5432` uniquement |
| `fonrex-redis` | Redis 7 (cache et Pub/Sub) | `127.0.0.1:6379` uniquement |

Le conteneur de l'API applique les migrations de la base de données (`alembic upgrade head`) avant de démarrer. Un quatrième service, `fonrex-migrate`, exécute les migrations seules ; il appartient au profil `migrate` et ne démarre pas par défaut.

## 4. Vérifier l'instance

```bash
curl http://localhost:5000/health
curl -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/listings?ticker=AIR.PA"
```

`/health` répond sans clé ; la seconde requête vérifie que votre clé est acceptée.

## 5. Importer des instruments

L'image contient deux catalogues, `data/etf.csv` et `data/stocks.csv` :

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv
```

Autres possibilités :

- `make db-seed` importe le catalogue par défaut et l'enrichit à partir de Yahoo Finance.
- `SEED_ON_FIRST_RUN=true` dans `.env` importe `data/etf.csv` au premier démarrage quand la base de données est vide.

Les prix sont ingérés la première fois qu'une cotation est demandée (`GET /eod/{ticker}`), ou pour tout le catalogue avec `scripts/ingest_all.py` : voir [Ingérer des données historiques](../guides/ingest-historical-data.md).

## Mise à jour

```bash
git pull
docker compose up -d --build
```

L'image contient le code, les migrations et les fichiers d'amorçage : reconstruisez-la après chaque mise à jour. Les migrations s'exécutent au démarrage suivant. Sauvegardez la base de données avant une mise à jour : voir [Migrations de base de données en production](../deployment/database-migrations.md).

Pour le développement, `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` exécute le code de votre dossier sans reconstruire l'image.
