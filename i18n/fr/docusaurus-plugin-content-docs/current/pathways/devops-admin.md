---
id: "devops-admin"
title: "🛡️ Parcours : DevOps & Infra Admin"
sidebar_label: "🛡️ DevOps & Infra"
description: "Guide d'installation, déploiement haute disponibilité, monitoring et configuration multi-providers pour les administrateurs infrastructure."
---

# 🛡️ Parcours : DevOps & Infra Admin

Ce parcours est destiné aux **Ingénieurs DevOps, SRE et Administrateurs Système** responsables du déploiement, de la maintenance, de la résilience et de la sécurité des instances Fonrex.

> [!TIP]
> **Objectif du parcours :** Déployer une architecture de données résiliente avec TimescaleDB (Hypertables), Redis (Caching & Pub/Sub), configurer les clés API providers et activer la surveillance de consensus en direct.

---

### ⏱️ Durée estimée : 15 minutes

---

## 📌 Étape 1 : Topologie de l'architecture

L'infrastructure Fonrex s'appuie sur une architecture conteneurisée à 3 niveaux :
- **FastAPI / Uvicorn** : Serveur d'application Asynchrone Python 3.12.
- **PostgreSQL + TimescaleDB** : Base de données relationnelle + hypertables pour les séries temporelles OHLCV.
- **Redis** : Cache haute performance et courtier de messages WebSocket Pub/Sub.

---

## 📌 Étape 2 : Configuration des variables d'environnement

Copiez et éditez le fichier `.env` pour renseigner vos clés de providers financiers et configurations de base de données :

```bash
cp .env.example .env
```

Principales variables à vérifier :
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

*(Consultez la [Référence des Variables d'Environnement](/docs/deployment/environment-variables) pour la liste exhaustive).*

---

## 📌 Étape 3 : Déploiement Docker Compose & Migrations

Déployez la pile de conteneurs et exécutez les migrations Alembic automatiquement au démarrage :

```bash
docker compose -f docker-compose.yml up -d --build
```

Vérifiez le statut des conteneurs :
```bash
docker compose ps
```

---

## 📌 Étape 4 : Monitoring de Santé & Consensus Canary

Accédez à l'endpoint de diagnostic de santé des providers pour surveiller la disponibilité et le temps de réponse de chaque source de données :

```bash
curl http://localhost:5000/api/v1/monitoring/canary
```

Exemple de retour :
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

## 🎯 Prochaines étapes suggérées

- 🚀 [Checklist pour la mise en production](/docs/deployment/production-checklist)
- 📊 [Guide du Canary Monitor & Alertes](/docs/monitoring/canary-monitor)
- 🔄 [Gestion des migrations de base de données](/docs/deployment/database-migrations)
