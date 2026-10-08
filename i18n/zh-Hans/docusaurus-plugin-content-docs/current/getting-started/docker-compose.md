---
id: "docker-compose"
title: "Docker Compose 拓扑"
sidebar_label: "Docker Compose"
description: "Fonrex 服务栈的容器、端口、卷、健康检查和日常运维"
---

# Docker Compose 拓扑

`docker-compose.yml` 运行 API（`fonrex-api`）、数据库（`db`）和缓存（`redis`）。第四个服务 `fonrex-migrate` 按需执行迁移。`docker compose exec` 等命令使用服务名；`docker exec` 使用容器名（`fonrex-db`、`fonrex-redis`）。

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

## 服务

### `fonrex-api`
- **镜像**：基于 `Dockerfile` 构建（Python 3.12，非 root 用户）。包含代码、Alembic 迁移脚本和种子文件（`data/*.csv`）。
- **端口**：主机所有网络接口上的 `5000`，由 API 密钥保护。
- **启动**（`entrypoint.sh`）：等待 PostgreSQL 和 Redis 就绪，执行 `alembic upgrade head`，可选地导入 `data/etf.csv`（`SEED_ON_FIRST_RUN=true`），然后以 Uvicorn worker 启动 Gunicorn（`WEB_CONCURRENCY`，默认为 1）。
- **配置**：`.env`（`env_file`）。`DATABASE_URL`、`REDIS_URL` 和 `ASYNC_DATABASE_URL` 会被覆盖，使容器连接到 `db` 和 `redis` 服务，而不是 `localhost`。
- **挂载**：仅挂载应用需要写入的内容：`./logs` 和 `./static/logos`。
- **健康检查**：`curl -f http://localhost:5000/health`。

### `db`（容器 `fonrex-db`）
- **镜像**：`timescale/timescaledb-ha:pg16`（PostgreSQL 16 + TimescaleDB）。
- **端口**：`127.0.0.1:5432`，可从主机访问（psql、Zipline bundle），绝不对网络开放。
- **卷**：`timescale_data`，挂载到该镜像的数据目录 `/home/postgres/pgdata/data`（`PGDATA`）。数据在 `docker compose down` 和重新构建后依然保留。
- **初始化**：`postgres-init.sh` 创建 `fonrex` 数据库。

### `redis`（容器 `fonrex-redis`）
- **镜像**：`redis:7-alpine`，`--appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru`。
- **端口**：`127.0.0.1:6379`（Redis 没有设置密码）。
- **作用**：响应缓存、实时报价、WebSocket 流的 Pub/Sub 频道。

### `fonrex-migrate`
- **Profile**：`migrate`，不会随 `docker compose up` 启动。
- **命令**：`alembic upgrade head`。可用于在不启动 API 的情况下执行迁移。

## 常用操作

```bash
docker compose up -d                       # start
docker compose up -d --build               # rebuild after a code update
docker compose logs -f fonrex-api          # API logs
docker compose --profile migrate run --rm fonrex-migrate   # migrations alone
docker compose down                        # stop, keep the data
docker compose down -v                     # stop and DELETE the database and cache volumes
```

开发：`docker compose -f docker-compose.yml -f docker-compose.dev.yml up` 会将项目文件夹挂载到 `/app`，因此修改代码后只需重启。

## 备份数据库 {#backing-up-the-database}

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

请使用与生成备份时相同的 TimescaleDB 版本进行恢复。切勿将备份文件提交到 Git：其中包含您实例的数据。

## 故障排查

### 每个请求都返回 `401 Missing API key` 或 `403`
在 `.env` 中设置 `FONREX_API_KEY`，运行 `docker compose up -d`，并在每个请求中发送密钥。启动日志会说明身份验证模式：`docker compose logs fonrex-api | grep -i auth`。

### `logs` 权限被拒绝
```bash
mkdir -p logs
chmod 777 logs
docker compose up -d
```

### 容器名已被占用
```bash
docker rm -f fonrex-db fonrex-redis fonrex-api
docker compose up -d
```

### 数据库未存放在卷上的旧安装
旧版本将卷挂载到 `/var/lib/postgresql/data`，而该镜像并不使用这个路径：数据库实际存放在容器内部。升级前请检查：

```bash
docker exec fonrex-db psql -U fonrex -d fonrex -tc "show data_directory"
docker inspect fonrex-db --format '{{range .Mounts}}{{.Destination}} {{end}}'
```

如果数据目录不是一个挂载目标，请在使用新的 `docker-compose.yml` 执行 `docker compose up -d` **之前**备份数据库，然后再恢复。
