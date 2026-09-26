---
id: "changelog"
title: "Fonrex 版本变更日志"
sidebar_label: "变更日志"
description: "项目历史、功能添加、Schema 迁移及版本更新"
---


# Fonrex 版本变更日志

## v1.6.0 (2026-09)

### 核心特性 (Major Features)
- **OpenBB Workspace 原生集成**：新增原生后端适配器路由 (`/openbb`)，提供 19 个交互式 Widget 与 2 款预置仪表盘应用 (`Fonrex — EU Markets` 和 `Fonrex — Screener & Macro`)。
- **双重请求头身份验证**：新增对 OpenBB 原生 `X-API-KEY` 请求头的支持，同时保留标准 `Authorization: Bearer` 令牌验证 (`auth/dependencies.py`)。
- **Plotly & AgGrid 数据适配**：标准化转换 Plotly 图表（K线图、技术指标叠加图）及 AgGrid 表格数据（深度基本面、DCF 敏感性矩阵、新闻流、指数成分股）。

### 🐛 缺陷修复与改进 (Bug Fixes & Improvements)
- **Docker 日志卷权限处理**：通过补充 `mkdir -p logs` 步骤解决了 Docker 挂载日志目录时的权限缺失问题，并更新了故障排查文档。
- **DCF 与数据源优化**：优化了 DCF 估值模型与指数成分股数据源的缓存与数据规格化。

## v2.0.0 (2026-08)


### Major 特性s
- **Docusaurus v3 Documentation Suite**: Complete technical documentation structure generated under `documentation/`.
- **Provider Health Monitoring (Phase 12)**: Implemented `ValidationLayer`, `CanaryMonitor`, `provider_health_log` TimescaleDB hypertable, daily consensus aggregation, and 7 REST health endpoints (`/health/*`).
- **Valuation & DCF Engine (Phase 11)**: Integrated FCF, EPS, and DDM intrinsic value models with dynamic WACC calculation and sensitivity matrices (`/dcf/*`).
- **新闻聚合器 (Phase 10)**: Multi-provider scraping engine (`NewsService`) across 7 sources with `ON CONFLICT (url)` deduplication and Redis caching (`/news/*`).
- **ISIN Asset Architecture (Phase 9)**: Refactored asset database schema into `assets`, `asset_listings`, and `asset_mappings` with partial unique ISIN index.

### 🐛 Bug Fixes & Refactoring
- Legacy codebase cleanup (`eod/`, `record/`, `seed_assets.py` purged).
- Standalone ISIN deduplication tool `scripts/clean_isin_duplicates.py`.
- Thread pool executor concurrency boundaries via `concurrency.py`.
