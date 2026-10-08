---
id: "monitoring"
title: "数据提供方监控与管理 API 参考"
sidebar_label: "监控与管理"
description: "数据提供方健康状态、金丝雀运行、告警、校验统计、缓存与数据库管理"
---

# 数据提供方监控与管理 API 参考

监控路由报告[校验层](../monitoring/validation-layer.md)和[每日金丝雀检测](../monitoring/canary-monitor.md)对每个基本面数据提供方的观测结果。管理路由用于管理实例的缓存和数据库。

会修改内容的路由（此处为 `POST`）需要**完全访问密钥**。

---

## <span className="api-method get">GET</span> `/health`

公开（无需密钥）。返回服务状态、启动时加载的数据提供方、缓存状态及各类缓存的有效期。

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

`providers.unavailable` 列出无法导入的数据提供方（缺少依赖）：在修复之前，所有请求都会跳过它。

---

## <span className="api-method get">GET</span> `/health/providers`

数据提供方的健康摘要，从 Redis（由金丝雀写入，有效期 1 小时）或数据库中读取。

```json
{
  "checked_at": "2026-10-08T06:02:10Z",
  "total_providers": 14,
  "healthy": 13,
  "degraded": 1,
  "down": 0,
  "providers": [
    {
      "name": "ZoneBourse",
      "is_healthy": true,
      "success_rate_7d": 0.98,
      "avg_latency_ms": null,
      "last_check": null,
      "canary_passed": null,
      "active_alerts": 0,
      "status_label": "OK"
    }
  ]
}
```

`status_label` 为 `OK`（成功率 ≥ 85 %）、`DEGRADED`（≥ 70 %）或 `DOWN`。当摘要来自 Redis 时，`avg_latency_ms`、`last_check` 和 `canary_passed` 为 `null`，`active_alerts` 为 0。在新实例上，首次金丝雀运行之前，该列表为空。

## <span className="api-method get">GET</span> `/health/providers/{provider_name}`

某个数据提供方在 `days` 天内（默认 7 天）的详细信息：`status`、`success_rate_7d`、`success_rate_30d`、`avg_latency_ms`、`daily_stats`、`recent_failures` 和 `active_alerts`。

---

## <span className="api-method get">GET</span> `/health/alerts`

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `severity` | string | — | `warning` 或 `critical` |
| `provider_name` | string | — | 指定一个数据提供方 |
| `include_resolved` | boolean | `false` | 包含已解决的告警 |
| `limit` | integer | `50` | 告警数量上限 |

金丝雀触发的告警类型：`canary_failed`（某个值超出预期范围）和 `high_outlier_rate`（成功率低于 `ALERT_SUCCESS_RATE_WARNING` / `ALERT_SUCCESS_RATE_CRITICAL`）。参见[告警](../monitoring/alerts.md)。

## <span className="api-method post">POST</span> `/health/alerts/{alert_id}/resolve`

手动解决告警。备注是一个**查询参数**：

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/health/alerts/42/resolve?resolution_note=Parser%20fixed"
```

```json
{ "status": "resolved", "alert_id": 42, "resolved_at": "2026-10-08T10:12:00+00:00" }
```

已解决的告警返回 `{"status": "already_resolved"}`，未知告警返回 `404`。

---

## <span className="api-method post">POST</span> `/health/canary/run`

在后台启动一次金丝雀运行，针对所有数据提供方，或仅针对 `provider_name`。返回 `{"status": "queued", "provider": "all", "message": "..."}`。

## <span className="api-method get">GET</span> `/health/canary/history`

历史金丝雀检查记录。参数：`provider_name`、`ticker`、`days`（7）、`limit`（100）。

## <span className="api-method get">GET</span> `/health/stats`

最近 7 天的校验统计：

```json
{
  "period": "last_7_days",
  "total_values_validated": 0,
  "total_valid": 0,
  "total_outliers": 0,
  "total_out_of_range": 0,
  "total_nulls": 0,
  "overall_quality_score": null,
  "most_reliable_providers": [],
  "least_reliable_providers": [],
  "fields_most_often_invalid": []
}
```

---

## 缓存管理

| 方法 | 路由 | 说明 |
|---|---|---|
| `GET` | `/cache/stats` | Redis 版本与内存、各缓存类别的有效期、已缓存的代码 |
| `POST` | `/cache/clear` | 删除已缓存的日终价格响应（仅 `eod:*` 键） |
| `POST` | `/cache/clear/{ticker}` | 删除某个代码的已缓存日终价格响应（`eod:{TICKER}:*`）。`period` 参数目前不会删除任何内容：键所含的段数多于它构造的匹配模式 |

其他类别（基本面、指标、新闻、DCF……）会自行过期；一次采集会清除其代码下由价格派生的响应。

## 数据库管理

| 方法 | 路由 | 说明 |
|---|---|---|
| `GET` | `/database/stats` | 已存储的价格和代码、最近 24 小时的 API 请求 |
| `GET` | `/database/tickers` | 所有有价格的代码：首个与最后日期、K 线数量 |
| `GET` | `/database/ticker/{ticker}` | 单个代码的相同信息，以及其 API 请求数 |
| `POST` | `/database/cleanup` | 删除早于 `days_to_keep` 天的价格以及早于 30 天的日志 |

`POST /database/cleanup` 接受 JSON 请求体 `{"days_to_keep": 730, "dry_run": false}`。`days_to_keep` 必须大于或等于 30（默认 730）。首次采集会获取十年数据：删除前请先用 `dry_run` 统计，它不会删除任何内容，而是返回实际运行时将要删除的内容。

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"days_to_keep": 3650, "dry_run": true}' http://localhost:5000/database/cleanup
```

使用日志（`usage_logs`）有其独立的保留期，由 `USAGE_LOG_RETENTION_DAYS` 设置。
