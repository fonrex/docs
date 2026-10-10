---
id: "environment-variables"
title: "部署环境变量参考"
sidebar_label: "环境变量"
description: "部署 Fonrex 时需要关注的配置项，以及 .env 如何传递到容器中"
---

# 部署环境变量参考

所有配置项都在[配置](../getting-started/configuration.md)中说明。本页介绍部署时需要关注的内容。

## `.env` 如何传递到容器中

- `docker-compose.yml` 将 `.env` 加载到 API 容器中（`env_file`）。
- 随后它会**覆盖**为本地运行编写的服务地址：`DATABASE_URL`（根据 `POSTGRES_PASSWORD` 构建，主机为 `db`）、`REDIS_URL`（主机为 `redis`）和 `ASYNC_DATABASE_URL`（置空，以便从 `DATABASE_URL` 派生）。它还会设置 `WEB_CONCURRENCY`，并清除 `HTTP_PROXY` / `HTTPS_PROXY`。
- `.env` 从不会被复制到镜像中。
- 每行一个 `KEY=value`；空值后面的注释会被当作值读取。

`.env.example` 中的每个变量都会被代码读取（`tests/test_env_settings.py`）；无效值会回退到其默认值并给出警告，而不会导致 API 停止。

## 必须设置

| 变量 | 原因 |
|---|---|
| `FONREX_API_KEY` | 没有密钥时，所有受保护的路由都返回 `401` |
| `FONREX_READ_ONLY_API_KEYS` | 供本机以外的客户端（Sheets、仪表板）使用的密钥 |
| `POSTGRES_PASSWORD` | 须在首次启动前设置；初始化时会存储在卷中 |
| `SEC_EDGAR_EMAIL` | 你的联系地址：SEC 拒绝匿名的自动化客户端 |

## 生产环境中切勿使用

| 设置 | 原因 |
|---|---|
| `FONREX_AUTH_REQUIRED=false` | 开放所有路由，包括缓存和数据库管理（仅在未配置任何密钥时生效） |
| `WEB_CONCURRENCY` > 1 | 会重复运行实时数据流和每日金丝雀 |
| `USAGE_LOG_IP=full` | 在 `usage_logs` 中保留完整的调用方 IP 地址；建议使用 `none` 或 `truncated` |

## 常需调整

| 变量 | 默认值 | 适用场景 |
|---|---|---|
| `FRED_API_KEY` | *（空）* | DCF 使用的实时美国无风险利率（欧元利率来自 ECB，无需密钥） |
| `FONREX_PROXY_URL`, `FONREX_PROXY_PROVIDERS` | *（空）* | 网站拒绝你服务器的 IP |
| `FONREX_PROVIDER_MAX_CONCURRENCY` | `4` | 减少对每个网站的并发请求数 |
| `OPENBB_ALLOWED_ORIGIN` | `https://pro.openbb.co` | 使用其他 OpenBB 来源（CORS） |
| `USAGE_LOG_RETENTION_DAYS` | `90` | 使用日志的保留期 |
| `CANARY_RUN_HOUR` | `6` | 每日数据提供方检查的时间（UTC 小时） |
