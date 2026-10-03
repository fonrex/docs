---
id: "devops-admin"
title: "Parcours DevOps & Infra Admin"
sidebar_label: "DevOps & Infra Admin"
description: "Guide d'installation, déploiement haute disponibilité, monitoring et configuration multi-providers pour les administrateurs infrastructure"
---

# Parcours DevOps & Infra Admin

Ce parcours fournit un guide d'ingénierie d'infrastructure pour les **Ingénieurs DevOps, SRE et Administrateurs Système** responsables du déploiement des instances Fonrex, des hypertables TimescaleDB, du cache Redis et des sondes Canary.

| Composant d'infrastructure | Technologie | Rôle opérationnel |
|---|---|---|
| **Serveur d'application** | FastAPI / Uvicorn (Python 3.12) | Router API asynchrone et gestionnaire de providers |
| **Base séries temporelles** | PostgreSQL 16 + TimescaleDB | Schémas relationnels et hypertables OHLCV |
| **Cache & Message Broker** | Redis 7 | Cache de réponse et broker Pub/Sub WebSockets |
| **Monitoring synthétique** | Sondes de santé Canary | Contrôles automatisés du SLA et du consensus |

---

## 1. Topologie système et variables d'environnement

Copiez et configurez le fichier d'environnement :

```bash
cp .env.example .env
```

Paramètres principaux dans le fichier `.env` :

```env
POSTGRES_USER=fonrex
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=fonrex_db
REDIS_URL=redis://redis:6379/0

FMP_API_KEY=your_financial_modeling_prep_key
POLYGON_API_KEY=your_polygon_io_key

PROVIDER_CONSENSUS_THRESHOLD=0.95
CANARY_CHECK_INTERVAL_SECONDS=300
```

---

## 2. Déploiement Docker Compose et migrations

Déployez la pile de conteneurs et exécutez les migrations de base de données Alembic :

```bash
docker compose -f docker-compose.yml up -d --build
```

Vérifiez le statut des conteneurs :

```bash
docker compose ps
```

---

## 3. Diagnostic des sondes Canary et santé des providers

Interrogez l'endpoint de monitoring pour suivre la disponibilité, la latence et les taux d'erreur de chaque provider :

```http
GET /api/v1/monitoring/canary
```

Schéma de réponse :

```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": "healthy",
  "providers": {
    "yfinance": { "status": "up", "latency_ms": 120, "error_rate_24h": 0.00 },
    "fmp": { "status": "up", "latency_ms": 85, "error_rate_24h": 0.01 }
  }
}
```

---

## Prochaines étapes

- Consulter la [Checklist de mise en production](/docs/deployment/production-checklist)
- Consulter le [Guide Canary Monitor & Alertes](/docs/monitoring/canary-monitor)
- Consulter le [Guide de gestion des migrations de base de données](/docs/deployment/database-migrations)
