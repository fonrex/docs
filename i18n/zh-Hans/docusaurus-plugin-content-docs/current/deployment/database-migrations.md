---
id: "database-migrations"
title: "生产环境中的数据库迁移"
sidebar_label: "数据库迁移"
description: "如何在零停机生产环境中安全应用 Alembic 数据库 Schema 迁移"
---


# 生产环境中的数据库迁移

Running database schema migrations safely in production requires isolating schema DDL operations from the application container lifecycle.

## Safe Migration Workflow

1. **Pre-Deployment Check**: Test migration scripts in a staging environment matching production TimescaleDB versions:
   ```bash
   alembic current
   alembic heads
   ```
2. **Execute Migrations Before 状态码 Rollout**:
   触发一次性迁移 Profile 容器：
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
