---
id: "database-migrations"
title: "Migrations de Base de Données en Production"
sidebar_label: "Migrations de Base de Données"
description: "Comment appliquer en toute sécurité les migrations d'Alembic en environnement de production sans interruption"
---


# Migrations de Base de Données en Production

Running database schema migrations safely in production requires isolating schema DDL operations from the application container lifecycle.

## Workflow de Migration Sécurisé

1. **Pre-Deployment Check**: Test migration scripts in a staging environment matching production TimescaleDB versions:
   ```bash
   alembic current
   alembic heads
   ```
2. **Execute Migrations Before Code Rollout**:
   Déclencher le conteneur de profil de migration à exécution unique :
   ```bash
   docker compose --profile migrate run --rm fonrex-migrate
   ```
3. **Deploy New API Containers**:
   Once `alembic upgrade head` finishes successfully, update your API application image:
   ```bash
   docker compose up -d fonrex-api
   ```
4. **Rollback Strategy**:
   If a migration fails, revert to the previous migration revision:
   ```bash
   docker compose --profile migrate run --rm fonrex-migrate alembic downgrade -1
   ```
