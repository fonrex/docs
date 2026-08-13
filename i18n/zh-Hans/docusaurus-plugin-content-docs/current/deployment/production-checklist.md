---
id: "production-checklist"
title: "生产部署检查清单"
sidebar_label: "生产检查清单"
description: "上线前强制性安全、性能、监控及数据库备份检查清单"
---


# 生产部署检查清单

Before going live with a production Fonrex instance, verify every item on this checklist:

## 🔒 Security & Environment
- [ ] Changed default PostgreSQL password in `.env` (`POSTGRES_PASSWORD`).
- [ ] Changed `SECRET_KEY` in `.env` to a cryptographically random 64-character string.
- [ ] Ensured `SEC_EDGAR_EMAIL` contains a valid corporate contact email.
- [ ] Restricted access to PostgreSQL port `5432` and Redis port `6379` via firewall rules (only accessible internally to `fonrex-api`).
- [ ] Configured TLS 1.3 / SSL certificates on NGINX / reverse proxy.

## ⚡ Performance & Caching
- [ ] Verified Redis memory policy is set to `maxmemory-policy allkeys-lru`.
- [ ] Configured PostgreSQL `shared_buffers` and `work_mem` for TimescaleDB workloads.
- [ ] Verified TimescaleDB intraday automatic retention chunk purges are operational.

## Health Monitoring & Backups
- [ ] Tested `/health` and `/health/providers` API endpoints.
- [ ] Configured daily `pg_dump` backups for `assets`, `asset_listings`, and `fundamentals` tables.
- [ ] Verified daily Canary checks run automatically at 06:00 UTC.
