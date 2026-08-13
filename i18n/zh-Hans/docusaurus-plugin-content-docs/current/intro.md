---
id: "intro"
title: "Fonrex 简介"
sidebar_label: "Introduction"
description: "Fonrex 开源自托管金融数据基础设施 API 概述"
---


# Fonrex 简介

Fonrex 是一个开源、自托管的 FastAPI 基础设施，用于市场数据、基本面财务、技术指标、新闻聚合、DCF 估值以及实时提供商健康监控。Fonrex 基于 Python 3.12、PostgreSQL/TimescaleDB 和 Redis 构建，填补了机构级金融数据源与自托管开发者工作流之间的空白。

Fonrex 基于六边形架构原则设计，为量化分析师、算法交易者和金融应用程序提供强大的 API。它将分散的数据提供商统一为标准的 REST 和 WebSocket 接口，同时确保持续的提供商验证和回退逻辑。

Fonrex 在 **AGPL-3.0** 开源许可证下分发，让您完全控制金融数据流水线，无需遭受 API 速率限制锁死或昂贵的按请求计费模式。

## Fonrex 与商业市场数据提供商对比

| 特性 | Fonrex Pro | FMP Premium / Commercial APIs |
|---|---|---|
| **托管方式** | 自托管 (Docker) | Cloud SaaS |
| **价格模式** | 免费与开源 (AGPL-3.0) | $50 – $500+ / month |
| **数据存储** | PostgreSQL + TimescaleDB 超级表 | 厂商托管 |
| **实时流传输** | 原生 WebSocket + Redis 发布/订阅 | 受限 / 额外收费 |
| **多提供商回退** | 自动化 (14+ 基本面, 7+ 新源) | 单厂商依赖 |
| **自定义指标** | 18+ 内置 + 自定义 Pandas-TA 引擎 | 有限的 API 参数 |
| **DCF 与估值** | 自定义 WACC、FCF、EPS 和 DDM 模型 | 黑盒 / 静态指标 |
| **数据质量检查** | 实时共识与每日金丝雀监控 | 专有 SLA |

## 快速开始（4 条命令）

仅需 4 条简单命令即可部署包含历史存储、Redis 缓存和实时 API Endpoint 的完整 Fonrex 实例：

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

验证您的本地实例是否已正常运行：

```bash
curl http://localhost:5000/health
```

Output:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "alembic_version": "011_provider_monitoring"
}
```
