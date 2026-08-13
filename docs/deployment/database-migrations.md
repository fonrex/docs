---
id: "database-migrations"
title: "Database Migrations in Production"
sidebar_label: "Database Migrations"
description: "How to safely apply Alembic database schema migrations in zero-downtime production environments"
---

# Database Migrations in Production

Running database schema migrations safely in production requires isolating schema DDL operations from the application container lifecycle.

## Safe Migration Workflow

1. **Pre-Deployment Check**: Test migration scripts in a staging environment matching production TimescaleDB versions:
   ```bash
   alembic current
   alembic heads
   ```
2. **Execute Migrations Before Code Rollout**:
   Trigger the one-shot migration profile container:
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
