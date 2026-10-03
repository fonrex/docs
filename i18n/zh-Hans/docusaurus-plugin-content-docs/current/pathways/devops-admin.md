---
id: "devops-admin"
title: "DevOps & 运维管理员使用路径"
sidebar_label: "DevOps & 运维"
description: "DevOps 与系统管理员基础设施部署指南：TimescaleDB、Redis 缓存与 Canary 探针监控"
---

# DevOps & 运维管理员使用路径

本路径为负责维护 Fonrex 实例、TimescaleDB 超表、Redis 缓存集群以及数据源 Canary 探针的 **DevOps 工程师、SRE 与系统管理员**提供基础设施部署指南。

| 架构层级 / 组件 | 技术栈 | 运维用途 |
|---|---|---|
| **应用服务器** | FastAPI / Uvicorn (Python 3.12) | 异步 API 路由与 Provider 管理器 |
| **时序数据库** | PostgreSQL 16 + TimescaleDB | 关系型 Schema 与 OHLCV K 线超表 |
| **缓存与消息代理** | Redis 7 | 响应缓存与 WebSocket Pub/Sub 代理 |
| **合成监控** | Canary 健康探针 | 自动化多 Provider SLA 与共识检查 |

---

## 1. 系统拓扑与环境变量配置

复制并配置环境变量：

```bash
cp .env.example .env
```

`.env` 文件中的核心配置参数：

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

## 2. Docker Compose 部署与数据库迁移

启动多容器基础设施并运行 Alembic 数据库迁移：

```bash
docker compose -f docker-compose.yml up -d --build
```

验证容器运行状态：

```bash
docker compose ps
```

---

## 3. Provider 健康检查与 Canary 探针诊断

查询健康监控端点以跟踪数据源的可用性、延迟和错误率：

```http
GET /api/v1/monitoring/canary
```

诊断响应 JSON 格式：

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

## 后续步骤

- 参考 [生产环境上线检查清单](/docs/deployment/production-checklist)
- 参考 [Canary 监控与告警指南](/docs/monitoring/canary-monitor)
- 参考 [数据库迁移部署指南](/docs/deployment/database-migrations)
