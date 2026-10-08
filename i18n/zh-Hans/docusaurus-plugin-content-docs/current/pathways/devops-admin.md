---
id: "devops-admin"
title: "DevOps 与基础设施管理员路径"
sidebar_label: "DevOps 与基础设施管理员"
description: "安装、加固、升级、备份和监控 Fonrex 实例"
---

# DevOps 与基础设施管理员路径

本路径面向运行实例的人员：负责服务栈、其安全性、升级以及数据来源的健康状况。

| 组件 | 技术 | 说明 |
|---|---|---|
| API | FastAPI、Gunicorn + Uvicorn（Python 3.12） | 单个 worker：实时数据和 canary 运行在该进程中 |
| 数据库 | PostgreSQL 16 + TimescaleDB（`timescaledb-ha:pg16`） | 卷 `timescale_data`，`127.0.0.1:5432` |
| 缓存 | Redis 7，256 MB，`allkeys-lru` | `127.0.0.1:6379`，无密码 |
| 监控 | 验证层 + 每日 canary | `/health/*` 路由 |

## 1. 安装与加固

```bash
cp .env.example .env
# FONREX_API_KEY, FONREX_READ_ONLY_API_KEYS, POSTGRES_PASSWORD, SEC_EDGAR_EMAIL
mkdir -p logs
docker compose up -d
docker compose ps
```

请将 API 置于转发 WebSocket 升级请求的 TLS 反向代理之后。请参阅 [Docker 生产部署](../deployment/docker.md)和[生产环境检查清单](../deployment/production-checklist.md)。

## 2. 升级

```bash
docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex-$(date +%F).dump
git pull
docker compose up -d --build        # migrations run at start
```

如需回滚，请使用之前的代码恢复备份。请参阅[生产环境中的数据库迁移](../deployment/database-migrations.md)。

## 3. 监控实例

```bash
curl -s http://localhost:5000/health                                        # no key
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/health/providers
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/health/alerts?severity=critical"
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/realtime/status
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/database/stats
```

- `/health`：`providers.unavailable` 列出加载失败的数据提供方。
- `/health/providers`：每日 canary（UTC 06:00）按数据提供方给出的结果。
- 日志：`docker compose logs -f fonrex-api`。

## 4. 拒绝您 IP 的数据来源

受反爬虫服务保护的网站可能会拒绝服务器 IP。让这些数据提供方通过代理访问：

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
FONREX_PROVIDER_MAX_CONCURRENCY=4
```

## 5. 存储

- 价格：首次采集时每个上市品种约十年数据，14 天后压缩。
- `POST /database/cleanup` 会删除早于 `days_to_keep` 的价格（默认 730！），请务必先使用 `dry_run` 运行。
- 日内 K 线和验证日志在 30 天后过期；使用日志在 `USAGE_LOG_RETENTION_DAYS` 后过期；新闻文章会被保留。

## 后续步骤

- [Docker Compose 拓扑](../getting-started/docker-compose.md)
- [Canary 监控](../monitoring/canary-monitor.md)和[告警](../monitoring/alerts.md)
- [环境变量](../deployment/environment-variables.md)
