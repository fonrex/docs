---
id: "devops-admin"
title: "🛡️ 使用路径：DevOps & 运维管理员"
sidebar_label: "🛡️ DevOps & 运维"
description: "DevOps 与系统管理员安装部署、高可用架构、监控及多数据源配置指南。"
---

# 🛡️ 使用路径：DevOps & 运维管理员

本路径适用于负责 Fonrex 实例部署、维护与监控的 **DevOps 工程师与系统管理员**。

> [!TIP]
> **目标：** 部署基于 TimescaleDB 和 Redis 的高可用架构，配置数据源 API 密钥并开启探针监控。

---

### ⏱️ 预计耗时：15 分钟

---

## 📌 步骤 1：系统架构

Fonrex 采用三层容器化架构：
- **FastAPI / Uvicorn**：异步 Python 3.12 应用服务器。
- **PostgreSQL + TimescaleDB**：关系型数据库 + K 线超表 (Hypertables)。
- **Redis**：高性能缓存与 WebSocket 消息代理。

---

## 📌 步骤 2：环境变量配置

```bash
cp .env.example .env
docker compose up -d --build
```

---

## 📌 步骤 3：健康检查与 Canary 探针监控

```bash
curl http://localhost:5000/api/v1/monitoring/canary
```

---

## 🎯 建议的后续步骤

- 🚀 [生产环境上线检查清单](/docs/deployment/production-checklist)
- 📊 [Canary 监控与告警指南](/docs/monitoring/canary-monitor)
