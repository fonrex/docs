---
id: "installation"
title: "安装指南"
sidebar_label: "安装"
description: "使用 Docker Compose 安装并运行自托管的 Fonrex 实例"
---

# 安装指南

本指南介绍如何使用 Docker Compose 部署一个自托管的 Fonrex 实例。

## 环境要求

- Docker Engine 和 Docker Compose v2
- Linux、macOS，或带 WSL2 的 Windows
- 至少 4 GB 内存，大规模数据导入建议 8 GB
- 足够存放所采集价格历史的磁盘空间（首次采集每个上市品种会获取约十年的数据）

## 1. 克隆仓库

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

## 2. 创建 `.env`

```bash
cp .env.example .env
```

Docker Compose 会将 `.env` 加载到 API 容器中。有两项设置必须在**首次启动之前**完成：

**API 密钥。** 身份验证默认开启：在配置密钥之前，除 `/health`、文档和 OpenBB 发现文件之外，所有路由都会返回 `401`。

```bash
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
```

**数据库密码。** 修改 `POSTGRES_PASSWORD`（只能包含字母、数字、`-` 和 `_`，因为它会被嵌入 URL 中）。密码在创建数据库时写入数据库卷；之后若要修改，需要执行 `ALTER USER fonrex PASSWORD '...'` 或使用新的卷。

每行只写一个 `KEY=value`，注释单独成行：如果注释放在空值之后，Docker Compose 会把该注释读作值本身。

所有设置请参阅[配置](configuration.md)。

## 3. 启动服务栈

```bash
mkdir -p logs
docker compose up -d
```

这将启动三个容器：

| 容器 | 作用 | 发布地址 |
|---|---|---|
| `fonrex-api` | 由 Gunicorn 运行的 FastAPI | `0.0.0.0:5000` |
| `fonrex-db` | PostgreSQL 16 + TimescaleDB（`timescale/timescaledb-ha:pg16`） | 仅 `127.0.0.1:5432` |
| `fonrex-redis` | Redis 7（缓存和 Pub/Sub） | 仅 `127.0.0.1:6379` |

API 容器在启动前会执行数据库迁移（`alembic upgrade head`）。第四个服务 `fonrex-migrate` 只负责执行迁移；它属于 `migrate` profile，默认不会启动。

## 4. 检查实例

```bash
curl http://localhost:5000/health
curl -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/listings?ticker=AIR.PA"
```

`/health` 无需密钥即可响应；第二个请求用于确认您的密钥被接受。

## 5. 导入金融工具

镜像中包含两个目录文件：`data/etf.csv` 和 `data/stocks.csv`：

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv
```

其他方式：

- `make db-seed` 导入默认目录，并通过 Yahoo Finance 补充信息。
- 在 `.env` 中设置 `SEED_ON_FIRST_RUN=true`，在数据库为空时，首次启动会导入 `data/etf.csv`。

价格会在首次请求某个上市品种时采集（`GET /eod/{ticker}`），也可以使用 `scripts/ingest_all.py` 为整个目录采集，请参阅[采集历史数据](../guides/ingest-historical-data.md)。

## 更新

```bash
git pull
docker compose up -d --build
```

镜像包含代码、迁移脚本和种子文件：每次更新后都要重新构建镜像。迁移会在下次启动时执行。升级前请备份数据库，请参阅[生产环境中的数据库迁移](../deployment/database-migrations.md)。

开发时，`docker compose -f docker-compose.yml -f docker-compose.dev.yml up` 会直接运行您本地文件夹中的代码，无需重新构建镜像。
