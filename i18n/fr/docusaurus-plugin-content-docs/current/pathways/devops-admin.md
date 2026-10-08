---
id: "devops-admin"
title: "Parcours DevOps & Infra Admin"
sidebar_label: "DevOps & Infra Admin"
description: "Installer, sécuriser, mettre à jour, sauvegarder et surveiller une instance Fonrex"
---

# Parcours DevOps & Infra Admin

Ce parcours s'adresse à la personne qui exploite l'instance : la stack, sa sécurité, ses mises à jour et la santé de ses sources de données.

| Composant | Technologie | Remarques |
|---|---|---|
| API | FastAPI, Gunicorn + Uvicorn (Python 3.12) | Un seul worker : le temps réel et le canary vivent dans le processus |
| Base de données | PostgreSQL 16 + TimescaleDB (`timescaledb-ha:pg16`) | Volume `timescale_data`, `127.0.0.1:5432` |
| Cache | Redis 7, 256 Mo, `allkeys-lru` | `127.0.0.1:6379`, sans mot de passe |
| Surveillance | Couche de validation + canary quotidien | Routes `/health/*` |

## 1. Installer et sécuriser

```bash
cp .env.example .env
# FONREX_API_KEY, FONREX_READ_ONLY_API_KEYS, POSTGRES_PASSWORD, SEC_EDGAR_EMAIL
mkdir -p logs
docker compose up -d
docker compose ps
```

Gardez l'API derrière un reverse proxy TLS qui transmet l'upgrade WebSocket. Voir [Déploiement Docker en production](../deployment/docker.md) et la [checklist de production](../deployment/production-checklist.md).

## 2. Mettre à jour

```bash
docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex-$(date +%F).dump
git pull
docker compose up -d --build        # migrations run at start
```

Pour revenir en arrière, restaurez le dump avec le code précédent. Voir [Migrations de base de données en production](../deployment/database-migrations.md).

## 3. Surveiller l'instance

```bash
curl -s http://localhost:5000/health                                        # no key
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/health/providers
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/health/alerts?severity=critical"
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/realtime/status
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/database/stats
```

- `/health` : `providers.unavailable` nomme un fournisseur qui n'a pas pu être chargé.
- `/health/providers` : résultat du canary quotidien (06:00 UTC), par fournisseur.
- Journaux : `docker compose logs -f fonrex-api`.

## 4. Sources de données qui refusent votre IP

Les sites web protégés par des services anti-bot peuvent refuser l'IP d'un serveur. Faites passer ces fournisseurs par un proxy :

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
FONREX_PROVIDER_MAX_CONCURRENCY=4
```

## 5. Stockage

- Prix : environ dix ans par cotation lors de la première ingestion, compressés au bout de 14 jours.
- `POST /database/cleanup` supprime les prix plus anciens que `days_to_keep` (730 par défaut !) : lancez-le toujours d'abord avec `dry_run`.
- Les bougies intrajournalières et les journaux de validation expirent au bout de 30 jours ; le journal d'utilisation après `USAGE_LOG_RETENTION_DAYS` ; les articles d'actualité sont conservés.

## Étapes suivantes

- [Topologie Docker Compose](../getting-started/docker-compose.md)
- [Moniteur canary](../monitoring/canary-monitor.md) et [alertes](../monitoring/alerts.md)
- [Variables d'environnement](../deployment/environment-variables.md)
