---
id: "intro"
title: "Fonrex 简介"
sidebar_label: "简介"
description: "Fonrex 概述：开源、自托管的金融数据 API"
---

# Fonrex 简介

Fonrex 是一个开源、**自托管**的金融数据 API。只需一个 Docker Compose 栈（FastAPI、PostgreSQL/TimescaleDB 和 Redis），即可采集并提供日终价格、实时报价、基本面数据、技术指标、新闻和 DCF 估值，同时监控所采集数据的质量。

Fonrex 不是托管服务：不存在 Fonrex 云端 API。每个客户端（您的脚本、Google Sheets、OpenBB Workspace、Zipline）都与**您自己的实例**通信。数据由您的实例从公开来源抓取或获取，相关责任由您自行承担。

Fonrex 以 **AGPL-3.0** 许可证分发。

## 您将获得什么

| 领域 | Fonrex 提供的功能 |
|---|---|
| **价格** | 按上市品种（listing）保存的日终历史数据（Yahoo Finance，TradingView 作为回退）、日/周/月 K 线、通过 WebSocket 推送的实时报价 |
| **基本面** | 一份采用 EODHD 布局的文档，由 Yahoo Finance、已存储的深度基本面数据和 13 个抓取网站构建而成，并标注每个数字的来源 |
| **技术指标** | 使用 pandas-ta 在服务端计算的 18 个指标、多指标请求和筛选器 |
| **估值** | 包含三种模型（FCF、EPS、DDM）的 DCF、动态 WACC、模型对比和敏感性矩阵 |
| **新闻** | 7 个新闻数据提供方，按 URL 和标题相似度去重 |
| **数据质量** | 每次请求都进行范围检查和共识检查，每日针对已知资产运行 canary 检测，并提供告警 |
| **集成** | OpenBB Workspace 小组件、Google Sheets 模板、Zipline 数据包（bundle） |

## Fonrex 与商业数据 API 对比

| | Fonrex | 商业市场数据 API |
|---|---|---|
| **托管** | 您自己的机器（Docker） | 厂商云端 |
| **价格** | 免费、开源（AGPL-3.0） | 按月订阅 |
| **存储** | 您自己的 PostgreSQL + TimescaleDB | 由厂商管理 |
| **实时** | WebSocket 推送 + Redis Pub/Sub | 通常为 REST 轮询或付费套餐 |
| **欧洲市场** | 原生支持（Euronext、Xetra…），UCITS ETF 通过 JustETF 获取 | 通常需要更高级的套餐 |
| **数据来源** | 每个数字有多个数据提供方，并报告来源 | 单一厂商 |
| **速率限制** | 取决于您所查询的公开来源 | 厂商配额 |

## 快速开始

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
# The API rejects every request until a key is configured:
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
mkdir -p logs
docker compose up -d
```

`/health` 无需密钥即可响应：

```bash
curl http://localhost:5000/health
```

```json
{
  "status": "healthy",
  "service": "FonRex API",
  "timestamp": "2026-10-08T16:34:42.235390",
  "yfinance_available": true,
  "providers": { "loaded": 14, "unavailable": [] },
  "cache": { "enabled": true, "status": "connected", "ttl_seconds": { "eod": 86400, "...": "..." } }
}
```

其他所有路由都需要密钥，请参阅[安装](getting-started/installation.md)和[第一次 API 调用](getting-started/first-api-call.md)。
