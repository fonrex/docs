---
id: "changelog"
title: "Fonrex 版本更新日志"
sidebar_label: "更新日志"
description: "项目历史、功能新增、Schema 迁移和版本更新"
---

# Fonrex 版本更新日志

## 下一版本 {#next-release}

### 价格 {#prices}
- **`close` 重新成为成交收盘价**，仅针对拆股调整；**`adj_close`** 针对拆股和分红调整。此前两者保存的都是经分红调整的价格。
- **每个序列使用同一种调整。** 以前，上次采集之后发生的拆股或分红会在已存储 K 线与新 K 线的衔接处留下一个虚假的收益率（约为负的股息率，四拆一之后为 -75 %）。现在采集过程会将最后几根已存储的 K 线与来源进行比较，若不一致则重新获取整个序列。迁移 016 新增 `price_series_adjustments`；之前存储的序列会在下一次采集时被重新获取（使用 `scripts/ingest_all.py --force` 可一次性全部执行）。
- `GET /eod/{ticker}`、`GET /ticker/{symbol}/history` 和 `POST /historical/ingest` 新增 **`isin` 参数**：当多个金融工具共用同一 ticker 时用于指定金融工具。响应会给出实际读取的 `listing`。

### 欧元利率与估值货币 {#euro-rates-and-currency-of-the-valuation}
- **DCF 使用财务报表货币的无风险利率贴现**：USD 为 FRED，EUR 为欧洲央行的欧元区 AAA 利率，其他货币为 `DCF_RISK_FREE_RATE`。欧元公司不再使用美国利率贴现。响应提供 `price_currency`、`warnings` 和 `wacc.risk_free_rate_currency`。
- **价格为其他货币时不给出上涨空间**，而不是给出错误的值；以便士计价的价格会换算为英镑。每个模型现在都给出自己的 `upside_pct`（此前始终为 0）。
- **`GET /macro/rates?currency=`**：在 FRED 利率之外提供 ECB 利率（AAA 10 年期、存款便利利率、CISS）；每个利率注明其 `source`、`currency` 和 `freshness`。OpenBB 宏观组件为每个序列显示一张卡片。
- 补全会记录**财务报表货币**（迁移 018），并以秒读取 Yahoo 的日期（迁移 019：不再出现 1970-01-01）。
- **`AIR.PA` 是 Airbus，绝不是 AAR Corp**：去掉后缀查找的代码只指向后缀所代表交易所的上市品种。`/fundamental/deep` 的缓存按金融工具保存。

### Fama/French 因子 {#famafrench-factors}
- Kenneth French Data Library 的**因子收益**：美国、欧洲和发达市场，3 因子、5 因子和动量，月度和日度，以美元计（`GET /factors`、`GET /factors/{dataset}`、`POST /factors/refresh`、`scripts/load_factors.py`；迁移 020）。
- **上市品种的因子暴露**：`GET /factors/exposure/{ticker}` 将其超额收益对所在地区的因子进行回归（`ff3`、`ff5`、`carhart`）：贝塔、t 统计量、年化阿尔法、R²。
- 自 1999 年起按日的欧元**欧洲央行汇率**，用于以美元比较以其他货币计价的上市品种（`fx_rates`、`scripts/load_fx_rates.py`；迁移 021）。
- DCF 中**基于因子的股权成本**：在 `POST /dcf/{ticker}` 中设置 `wacc_params.cost_of_equity_model` = `ff3`、`ff5` 或 `carhart`。默认仍为 CAPM。
- 两个 **OpenBB 小组件**（共 21 个）：因子暴露和因子收益，位于 EU Markets 应用新的 *Factors* 标签页。

## 2026 年 10 月——默认安全、按上市品种存储价格、经过验证的数据提供方数据

于 2026 年 10 月 8 日合并到 `main`（pull request #15）。

### ⚠️ 破坏性变更
- **默认需要 API 密钥。** 在设置 `FONREX_API_KEY` 之前，除 `/health`、文档、`/widgets.json`、`/apps.json` 和 `/static` 之外的所有路由都返回 `401`。`FONREX_AUTH_REQUIRED=false` 仅在未配置任何密钥的实例上开放访问。新增**只读密钥**（`FONREX_READ_ONLY_API_KEYS`），供本机以外的客户端使用。
- **`GET /quote` 和 `GET /openbb/quote` 不再启动实时数据流。** 请使用 `POST /realtime/subscribe`；对于完全访问密钥，`/quote` 上仍保留 `subscribe_if_missing=true`。
- **价格按上市品种存储**（迁移 014）：`prices_eod` 的键为 `(asset_listing_id, resolution, time)`，并按交易日标注日期。该迁移会转换现有数据行；升级前请先备份。
- **股息率在所有地方都以比率表示**，包括已存储的值（迁移 015）。

### 安全与运维
- Docker Compose 加载 `.env` 并覆盖服务地址；PostgreSQL 和 Redis 仅发布在 `127.0.0.1` 上；数据库卷挂载到正确的数据目录。
- 使用日志由后台批量写入，默认不记录调用方 IP（`USAGE_LOG_IP`），在 `USAGE_LOG_RETENTION_DAYS` 之后清除。
- `POST /database/cleanup` 设有边界（`days_to_keep` ≥ 30），并支持 `dry_run`。
- Redis 缓存条目仅使用 JSON。

### 数据质量
- 上市品种的价格和基本面数据使用根据 ISIN 和上市品种货币**验证过的 Yahoo 代码**获取；没有已验证代码的上市品种不会被采集，并在响应中说明原因。
- 数据提供方读取其页面上实际显示的数字（`financials/numbers.py`）；百分比在校验前进行规范化；关于另一个 ISIN 的响应会被拒绝。
- `/fundamental` 依次从 Yahoo、已存储的数据、抓取类数据提供方构建每项数据，并在 `Sources` 部分注明来源。
- 财务报表按财年读取（DCF、偿债能力比率）。
- 每个请求参数都纳入其缓存键（基本面、新闻、内部人交易、按上市品种计算的技术指标）。
- 已存储的无风险利率会从 FRED 刷新；每个实时 tick 只会送达每个 WebSocket 客户端一次。
- 迁移 014 会等待正在运行的 TimescaleDB 作业，而不是与之发生死锁。

### 质量
- 依赖锁定并带哈希校验；每个模块设有覆盖率下限（全局 70 %）；CI 中在 TimescaleDB 上运行数据库测试；设有守护测试，确保 `ARCHITECTURE.md` 和 `AGENTS.md` 与代码保持同步。


## v1.6.0 (2026-09)

### 主要功能
- **OpenBB Workspace 集成**：原生后端适配路由器（`/openbb`），支持 19 个交互式组件和 2 个预先组装好的应用仪表板（`Fonrex — EU Markets` 和 `Fonrex — Screener & Macro`）。
- **双请求头认证**：在标准的 `Authorization: Bearer` 令牌校验之外，新增对 OpenBB 原生 `X-API-KEY` 自定义请求头的支持（`auth/dependencies.py`）。
- **Plotly 与 AgGrid 适配器**：标准化了面向 Plotly 图形（K 线图、技术指标叠加）和 AgGrid 表格（深度基本面、DCF 敏感性矩阵、新闻、指数成分股）的数据转换。

### 🐛 Bug 修复与改进
- **Docker 卷日志**：通过确保执行 `mkdir -p logs` 设置步骤，解决了宿主机环境中的卷权限问题，并新增了权限问题排查指南。
- **DCF 与数据提供方更新**：改进了 DCF 估值模型和指数成分股数据提供方的缓存与数据规范化。

## v2.0.0 (2026-08)


### 主要功能
- **Docusaurus v3 文档套件**：在 `documentation/` 下生成了完整的技术文档结构。
- **数据提供方健康监控（Phase 12）**：实现了 `ValidationLayer`、`CanaryMonitor`、`provider_health_log` TimescaleDB 超表、每日一致性聚合，以及 7 个 REST 健康检查端点（`/health/*`）。
- **估值与 DCF 引擎（Phase 11）**：集成了 FCF、EPS 和 DDM 内在价值模型，支持动态 WACC 计算和敏感性矩阵（`/dcf/*`）。
- **新闻聚合器（Phase 10）**：覆盖 7 个来源的多数据提供方抓取引擎（`NewsService`），使用 `ON CONFLICT (url)` 去重并通过 Redis 缓存（`/news/*`）。
- **ISIN 资产架构（Phase 9）**：将资产数据库 Schema 重构为 `assets`、`asset_listings` 和 `asset_mappings`，并添加 ISIN 部分唯一索引。

### 🐛 Bug 修复与重构
- 清理旧版代码库（移除 `eod/`、`record/`、`seed_assets.py`）。
- 独立的 ISIN 去重工具 `scripts/clean_isin_duplicates.py`。
- 通过 `concurrency.py` 设定线程池执行器的并发边界。
