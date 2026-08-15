---
id: "installation"
title: "Guide d'installation"
sidebar_label: "Installation"
description: "Comment installer et exécuter Fonrex avec Docker et Docker Compose"
---


# Guide d'installation

Ce guide vous accompagne dans la configuration d'une instance auto-hébergée de Fonrex à l'aide de Docker Compose.

## Prérequis Système

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Container Runtime**: Docker Engine 24.0+ and Docker Compose v2.20+
- **Minimum System Resources**:
  - CPU: 2 Cores
  - RAM: 4 GB RAM (8 GB recommended for heavy ingestion workloads)
  - Storage: 10 GB SSD space (dependent on historical tick data volume)

## Installation Étape par Étape

### 1. Cloner le Dépôt

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

### 2. Configurer les Variables d'Environnement

Créez votre fichier de configuration local `.env` à partir du modèle :

```bash
cp .env.example .env
```

Les paramètres par défaut sont optimisés pour le développement local. Pour les déploiements en production, mettez à jour les mots de passe et clés secrètes.

### 3. Lancer les Services via Docker Compose

Exécutez la pile multi-conteneurs en mode détaché :

```bash
docker compose up -d
```

Cela démarre quatre services :
- `fonrex-api`: FastAPI backend running on port `5000`
- `fonrex-db`: PostgreSQL 16 with TimescaleDB HA extension on port `5432`
- `fonrex-redis`: Redis 7 in-memory cache on port `6379`
- `fonrex-migrate`: One-shot migration container running `alembic upgrade head`

### 4. Vérifier la Santé du Système

Vérifiez que l'API et les services sous-jacents sont pleinement opérationnels :

```bash
curl "http://localhost:5000/health"
```

Expected JSON response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### 5. Importer l'Univers d'Actifs Initial

Alimentez votre base de données locale avec des instruments financiers et des cotations depuis des données CSV :

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv
```

Votre API est maintenant prête à servir des données financières !
