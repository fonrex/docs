---
id: "production-checklist"
title: "生产部署检查清单"
sidebar_label: "生产检查清单"
description: "对外暴露实例之前的安全、配置、监控和备份检查"
---

# 生产部署检查清单

## 安全
- [ ] `FONREX_API_KEY` 已设置为随机密钥（`echo "frx_live_$(openssl rand -hex 24)"`）；`FONREX_AUTH_REQUIRED` 保持为 `true`。
- [ ] 为本机以外的每个客户端提供只读密钥（`FONREX_READ_ONLY_API_KEYS`）：Google Sheets、仪表板、OpenBB。
- [ ] 首次启动前已修改 `POSTGRES_PASSWORD`。
- [ ] PostgreSQL 和 Redis 仅发布在 `127.0.0.1` 上（默认）；API 只能通过反向代理访问。
- [ ] 反向代理启用 TLS，并为 `/ws/` 转发 WebSocket 升级。
- [ ] `USAGE_LOG_IP` 设置为 `none` 或 `truncated`。
- [ ] `.env` 和数据库转储文件从不提交。

## 配置
- [ ] `SEC_EDGAR_EMAIL` 已设置为你自己的联系地址。
- [ ] `WEB_CONCURRENCY=1`。
- [ ] 如果使用 DCF，已设置 `FRED_API_KEY`。
- [ ] 如有需要，为拒绝你服务器 IP 的网站配置代理（`FONREX_PROXY_URL`）。

## 数据
- [ ] 已导入金融工具（`import_assets.py`）并采集价格（`scripts/ingest_all.py`）。
- [ ] 除非你确实打算删除已采集的十年数据中的八年，否则切勿以默认的 `days_to_keep`（730）运行 `POST /database/cleanup`——请先用 `dry_run` 统计。
- [ ] 每日使用 `pg_dump` 备份整个数据库，并至少测试过一次恢复。

## 监控
- [ ] `/health` 正常响应，`providers.unavailable` 为空。
- [ ] 首次金丝雀运行（默认 UTC 06:00）之后，`/health/providers` 已有数据。
- [ ] 定期检查严重告警：`GET /health/alerts?severity=critical`。
- [ ] 容器健康检查为绿色：`docker compose ps`。
