---
id: "installation"
title: "安装指南"
sidebar_label: "Installation"
description: "如何使用 Docker 和 Docker Compose 安装并运行 Fonrex"
---


# 安装指南

本指南将引导您使用 Docker Compose 设置自托管的 Fonrex 实例。

## 系统要求

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Container Runtime**: Docker Engine 24.0+ and Docker Compose v2.20+
- **Minimum System Resources**:
  - CPU: 2 Cores
  - RAM: 4 GB RAM (8 GB recommended for heavy ingestion workloads)
  - Storage: 10 GB SSD space (dependent on historical tick data volume)

## 一步步安装步骤

### 1. 克隆代码仓库

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

### 2. 配置环境变量

从模板创建本地 `.env` 配置文件：

```bash
cp .env.example .env
```

默认设置已针对本地开发优化。对于生产部署，请更新数据库密码和密钥。

### 3. 通过 Docker Compose 启动服务

在后台模式下运行多容器堆栈：

```bash
docker compose up -d
```

这将启动四个服务：
- `fonrex-api`: FastAPI backend running on port `5000`
- `fonrex-db`: PostgreSQL 16 with TimescaleDB HA extension on port `5432`
- `fonrex-redis`: Redis 7 in-memory cache on port `6379`
- `fonrex-migrate`: One-shot migration container running `alembic upgrade head`

### 4. 验证系统健康状态

检查 API 及后端服务是否已完全恢复正常运行：

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

### 5. 导入初始资产库

使用 CSV 数据向本地数据库填充金融工具和上市信息：

```bash
docker compose exec fonrex-api python import_assets.py --file etf.csv
```

您的 API 现在已准备好提供金融数据服务！
