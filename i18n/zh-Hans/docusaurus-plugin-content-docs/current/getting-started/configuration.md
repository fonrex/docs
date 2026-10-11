---
id: "configuration"
title: "系统配置"
sidebar_label: "配置"
description: "从 .env 读取的 Fonrex 设置参考"
---

# 系统配置

Fonrex 从环境变量读取设置。将 `.env.example` 复制为 `.env` 并进行编辑：Docker Compose 会将 `.env` 加载到 API 容器中，`make run` 在本地运行时也会加载它。

每行只写一个 `KEY=value`，注释单独成行：写在空值之后的注释会被读作值。

## 身份验证

| 变量 | 默认值 | 说明 |
|---|---|---|
| `FONREX_API_KEY` | *（空）* | 完全访问 API 密钥。可使用 `echo "frx_live_$(openssl rand -hex 24)"` 生成 |
| `FONREX_API_KEYS` | *（空）* | 额外的完全访问密钥，以逗号分隔 |
| `FONREX_READ_ONLY_API_KEYS` | *（空）* | 只读密钥，以逗号分隔：可以读取数据，但不能清除缓存、清理数据库、触发数据导入或修改订阅 |
| `FONREX_AUTH_REQUIRED` | `true` | 设为 `false` 时开放所有路由，**仅**在未配置任何密钥时生效。仅可用于任何网络都无法访问的实例 |

客户端通过 `Authorization: Bearer <key>` 或 `X-API-KEY: <key>` 发送密钥。请参阅[第一次 API 调用](first-api-call.md)。

## 数据库和缓存

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DATABASE_URL` | `postgresql://fonrex:fonrex_password@localhost:5432/fonrex` | 本地运行时使用的地址。使用 Docker Compose 时，会被替换为根据 `POSTGRES_PASSWORD` 构建的 `db` 服务地址 |
| `ASYNC_DATABASE_URL` | *（空）* | asyncpg 地址；为空时由 `DATABASE_URL` 推导（Docker Compose 会将其置空） |
| `POSTGRES_DB` / `POSTGRES_USER` | `fonrex` | 保留给本地工具使用；`docker-compose.yml` 使用固定值（用户 `fonrex`，数据库 `fonrex` 由 `postgres-init.sh` 创建） |
| `POSTGRES_PASSWORD` | `fonrex_password` | 请在首次启动前修改（字母、数字、`-`、`_`） |
| `REDIS_URL` | `redis://localhost:6379/0` | 使用 Docker Compose 时会被替换为 `redis` 服务地址 |
| `CACHE_TTL` | `300` | Redis 默认有效期，单位为秒（每个缓存类别都有各自的有效期，可通过 `GET /cache/stats` 查看） |
| `WEB_CONCURRENCY` | `1` | Gunicorn worker 数量（Docker Compose）。请保持为 `1`：实时 worker 和每日 canary 都运行在 API 进程中 |

## 历史数据采集

| 变量 | 默认值 | 说明 |
|---|---|---|
| `INGEST_CONCURRENCY` | `5` | 批量采集时并行执行的采集数量（调用方未指定 `concurrency` 时） |
| `INGEST_YF_DELAY` | `0.5` | 回退到 TradingView 之前的暂停时间，单位为秒 |
| `INGEST_TV_DELAY` | `2.0` | 会被读取，但当前代码未使用 |
| `INGEST_BATCH_SIZE` | `1000` | 每次数据库 upsert 的行数 |

## 实时流

| 变量 | 默认值 | 说明 |
|---|---|---|
| `TV_MAX_CONNECTIONS` | `10` | 同时存在的 TradingView WebSocket 连接数 |
| `TV_RECONNECT_DELAY` | `5` | 首次重连延迟，单位为秒，每次加倍，最多 60 秒 |
| `REALTIME_QUOTE_TTL` | `60` | 报价快照在 Redis 中的有效期，单位为秒 |

## 技术指标

| 变量 | 默认值 | 说明 |
|---|---|---|
| `TECHNICAL_CACHE_ENABLED` | `true` | 在 Redis 中缓存指标结果 |
| `TECHNICAL_DEFAULT_LIMIT` | `500` | 请求未指定 limit 时加载的 K 线数量（10 到 5000） |
| `TECHNICAL_MAX_BATCH_TICKERS` | `20` | `POST /technical/batch` 接受的 ticker 数量上限 |
| `TECHNICAL_MAX_BATCH_INDICATORS` | `10` | `POST /technical/batch` 接受的指标数量上限 |

## 新闻

| 变量 | 默认值 | 说明 |
|---|---|---|
| `NEWS_CACHE_TTL` | `1800` | 新闻响应在 Redis 中的有效期，单位为秒 |
| `NEWS_DEFAULT_LIMIT` | `20` | 请求未指定 limit 时，单个 ticker 返回的文章数 |
| `NEWS_MAX_LIMIT` | `100` | 请求可指定的最大 limit |
| `NEWS_DEDUP_SIMILARITY` | `0.85` | 标题相似度超过该值时，两篇文章视为同一篇 |

## 估值（DCF）和宏观利率

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DCF_CACHE_TTL` | `21600` | DCF 响应在 Redis 中的有效期（6 小时） |
| `DCF_DEFAULT_PROJECTION_YEARS` | `5` | 预测年数（3 到 10） |
| `DCF_RISK_FREE_RATE` | `0.04` | 无风险利率（比率）：当财务报表货币的来源（USD 为 FRED，EUR 为 ECB）未给出利率时使用，其他货币也使用此值 |
| `DCF_EQUITY_RISK_PREMIUM` | `0.055` | 股权风险溢价，以比率表示 |
| `DCF_TERMINAL_GROWTH_RATE` | `0.025` | 永续增长率，以比率表示 |
| `FRED_API_KEY` | *（空）* | 来自 fred.stlouisfed.org 的免费密钥，用于美国利率；没有密钥时使用已存储的利率或 `DCF_RISK_FREE_RATE` |
| `MACRO_RATES_CACHE_TTL` | `21600` | 宏观利率（FRED 和 ECB）在 Redis 中的有效期（6 小时） |
| `ECB_API_URL` | `https://data-api.ecb.europa.eu/service/data` | 欧洲央行数据门户（欧元利率，免费，无需密钥）；仅在使用镜像时设置 |

## 因子与汇率 {#factors-and-exchange-rates}

| 变量 | 默认值 | 说明 |
|---|---|---|
| `FACTORS_REFRESH_DAYS` | `7` | Fama/French 因子文件重新下载前的天数（1 到 90） |
| `FRENCH_LIBRARY_URL` | `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp` | Kenneth French Data Library（免费，无需密钥）；仅在使用镜像时设置 |
| `FX_RATES_REFRESH_HOURS` | `12` | 再次请求某货币欧洲央行汇率前的小时数（1 到 720） |

## 数据提供方监控

| 变量 | 默认值 | 说明 |
|---|---|---|
| `VALIDATION_OUTLIER_THRESHOLD` | `0.50` | 与中位数的偏差超过该值时，该值被视为异常值 |
| `VALIDATION_MIN_PROVIDERS` | `2` | 进行共识检查所需的数据提供方数量 |
| `CANARY_RUN_HOUR` | `6` | 每日 canary 运行的 UTC 小时 |
| `CANARY_PROVIDER_SEMAPHORE` | `3` | canary 并行检查的数据提供方数量 |
| `CANARY_PRICE_RANGE_TTL_SECONDS` | `21600` | 动态价格范围的有效期（6 小时） |
| `CANARY_PRICE_RANGE_NEGATIVE_TTL_SECONDS` | `300` | 无法计算价格范围后的重试延迟 |
| `ALERT_CANARY_CRITICAL` | `3` | 触发严重告警的 canary 失败次数 |
| `ALERT_SUCCESS_RATE_CRITICAL` | `0.70` | 成功率低于该值时告警为严重级别 |
| `ALERT_SUCCESS_RATE_WARNING` | `0.85` | 成功率低于该值时告警为警告级别 |

## 数据提供方和出站请求

| 变量 | 默认值 | 说明 |
|---|---|---|
| `SEC_EDGAR_EMAIL` | `contact@fonrex.io` | 发送给 SEC EDGAR 的联系地址（SEC 政策要求）：请填写您自己的地址 |
| `OPENFIGI_API_KEY` | *（空）* | 可选的 OpenFIGI 密钥（更高的速率限制） |
| `BARRONS_TOKEN`、`MARKETWATCH_TOKEN`、`WSJ_TOKEN` | *（空）* | 这些网站的可选 token |
| `FONREX_PROVIDER_MAX_CONCURRENCY` | `4` | 单个数据提供方可同时执行的请求数（1 到 64） |
| `FONREX_PROXY_URL` | *（空）* | 用于抓取网站的可选出站 HTTP 代理（不用于 yfinance 或 TradingView） |
| `FONREX_PROXY_PROVIDERS` | *（空）* | 使用代理的数据提供方，以逗号分隔；为空表示全部 |
| `LOGO_TOKEN` | *（空）* | 从 img.logo.dev 下载 logo 所用的 token |

## 使用日志和启动

| 变量 | 默认值 | 说明 |
|---|---|---|
| `USAGE_LOG_IP` | `none` | 在 `usage_logs` 中保留的调用方 IP 部分：`none`、`truncated`（仅网络部分）或 `full` |
| `USAGE_LOG_RETENTION_DAYS` | `90` | 使用日志的保留天数；`0` 表示全部保留 |
| `SEED_ON_FIRST_RUN` | `false` | 数据库为空时，在首次启动时导入 `data/etf.csv` |
| `OPENBB_ALLOWED_ORIGIN` | `https://pro.openbb.co` | CORS 允许的来源，以逗号分隔 |
