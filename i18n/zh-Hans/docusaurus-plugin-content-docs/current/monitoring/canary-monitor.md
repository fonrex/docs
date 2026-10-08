---
id: "canary-monitor"
title: "Canary 监控套件"
sidebar_label: "Canary 监控"
description: "每日根据已知资产和预期范围检查每个基本面数据提供方"
---

# Canary 监控套件

`CanaryMonitor`（`monitoring/canary_monitor.py`）每天向每个基本面数据提供方查询一次若干知名资产，这些资产的数值预期落在已知范围内。即使没有用户请求，也能发现页面已发生变化的数据提供方。

## 调度

- 在 API 进程内运行 APScheduler（`AsyncIOScheduler`），每天在 UTC 时间 `CANARY_RUN_HOUR` 点运行（默认为 6）。
- `POST /health/canary/run` 立即启动一次运行（所有数据提供方，或指定 `provider_name`）。
- 每次同时检查 `CANARY_PROVIDER_SEMAPHORE` 个数据提供方（3）；每次调用限时 15 秒，整个运行限时 120 秒。

## Canary 资产

| Ticker | 字段 | 预期范围 |
|---|---|---|
| `AAPL` | 市盈率、股息收益率、beta、价格 | 市盈率 20–45，收益率 0.003–0.01，beta 0.8–1.5，价格 100–500 |
| `AIR.PA` | 市盈率、股息收益率、beta、价格 | 市盈率 15–60，收益率 0.005–0.04，beta 0.8–1.8，价格 80–300 |
| `BNP.PA` | 市盈率、股息收益率、市净率、价格 | 市盈率 4–15，收益率 0.04–0.12，市净率 0.3–1.5，价格 30–100 |
| `MSFT` | 市盈率、beta、价格 | 市盈率 25–50，beta 0.7–1.3，价格 200–600 |
| `TSLA` | 市盈率、beta、价格 | 市盈率 30–300，beta 1.5–3.5，价格 100–600 |

上面的价格范围只是回退值。当数据库中保存有该资产最近 90 天内至少十个日收盘价时，预期范围为这些收盘价的均值 ± 3 个标准差，有效期为 `CANARY_PRICE_RANGE_TTL_SECONDS`（6 小时）。

仅覆盖欧洲的数据提供方（Boursorama、Fortuneo、BourseDirect、InvestirLesEchos）只在 `AIR.PA` 和 `BNP.PA` 上检查。百分数会像[验证层](validation-layer.md)中那样转换为比率。

## 一次运行

```
06:00 UTC  ──►  CanaryMonitor.run_all()
                  ├─ for each provider (3 in parallel):
                  │     canary assets × expected fields → ok / out_of_range / null / timeout
                  │     results → provider_health_log
                  ├─ daily aggregate → provider_health_daily (counters, success rate, is_healthy)
                  ├─ alerts → provider_alerts (created, or canary_failed auto-resolved)
                  └─ summary → Redis provider:health:summary (1 hour) → GET /health/providers
```

## 查看结果

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/health/providers
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/providers/ZoneBourse?days=30"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/canary/history?provider_name=ZoneBourse"
```

## 设置

```env
CANARY_RUN_HOUR=6
CANARY_PROVIDER_SEMAPHORE=3
CANARY_PRICE_RANGE_TTL_SECONDS=21600
CANARY_PRICE_RANGE_NEGATIVE_TTL_SECONDS=300
```

canary 运行在 API 进程中：如果有多个 Gunicorn worker，每个 worker 都会各自运行一次。
