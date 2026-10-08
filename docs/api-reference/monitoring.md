---
id: "monitoring"
title: "Provider Monitoring & Administration API Reference"
sidebar_label: "Monitoring & Admin"
description: "Provider health, canary runs, alerts, validation statistics, cache and database administration"
---

# Provider Monitoring & Administration API Reference

The monitoring routes report what the [validation layer](../monitoring/validation-layer.md) and the [daily canary](../monitoring/canary-monitor.md) observed about each fundamentals provider. The administration routes manage the cache and the database of your instance.

Routes that change something (`POST` here) need a **full-access** key.

---

## <span className="api-method get">GET</span> `/health`

Public (no key). Service status, providers loaded at start-up, cache status and lifetimes.

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

`providers.unavailable` names a provider that could not be imported (missing dependency): it is skipped by every request until fixed.

---

## <span className="api-method get">GET</span> `/health/providers`

Health summary of the providers, read from Redis (written by the canary, 1 hour) or from the database.

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

`status_label` is `OK` (success rate ≥ 85 %), `DEGRADED` (≥ 70 %) or `DOWN`. When the summary comes from Redis, `avg_latency_ms`, `last_check` and `canary_passed` are `null` and `active_alerts` is 0. On a new instance, before the first canary run, the list is empty.

## <span className="api-method get">GET</span> `/health/providers/{provider_name}`

Details of one provider over `days` days (default 7): `status`, `success_rate_7d`, `success_rate_30d`, `avg_latency_ms`, `daily_stats`, `recent_failures` and `active_alerts`.

---

## <span className="api-method get">GET</span> `/health/alerts`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `severity` | string | — | `warning` or `critical` |
| `provider_name` | string | — | One provider |
| `include_resolved` | boolean | `false` | Include resolved alerts |
| `limit` | integer | `50` | Maximum alerts |

Alert types raised by the canary: `canary_failed` (a value outside its expected range) and `high_outlier_rate` (success rate under `ALERT_SUCCESS_RATE_WARNING` / `ALERT_SUCCESS_RATE_CRITICAL`). See [Alerts](../monitoring/alerts.md).

## <span className="api-method post">POST</span> `/health/alerts/{alert_id}/resolve`

Resolve an alert by hand. The note is a **query parameter**:

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/health/alerts/42/resolve?resolution_note=Parser%20fixed"
```

```json
{ "status": "resolved", "alert_id": 42, "resolved_at": "2026-10-08T10:12:00+00:00" }
```

An alert already resolved answers `{"status": "already_resolved"}`, an unknown one `404`.

---

## <span className="api-method post">POST</span> `/health/canary/run`

Start a canary run in the background, for every provider or for `provider_name` only. Answers `{"status": "queued", "provider": "all", "message": "..."}`.

## <span className="api-method get">GET</span> `/health/canary/history`

Past canary checks. Parameters: `provider_name`, `ticker`, `days` (7), `limit` (100).

## <span className="api-method get">GET</span> `/health/stats`

Validation statistics of the last 7 days:

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

## Cache administration

| Method | Route | Description |
|---|---|---|
| `GET` | `/cache/stats` | Redis version and memory, lifetime of each cache category, cached tickers |
| `POST` | `/cache/clear` | Delete the cached end-of-day answers (`eod:*` keys only) |
| `POST` | `/cache/clear/{ticker}` | Delete the cached end-of-day answers of a ticker (`eod:{TICKER}:*`). The `period` parameter currently deletes nothing: the keys hold more segments than the pattern it builds |

The other categories (fundamentals, indicators, news, DCF…) expire on their own; an ingestion drops the price-derived answers of its ticker.

## Database administration

| Method | Route | Description |
|---|---|---|
| `GET` | `/database/stats` | Stored prices and tickers, API requests of the last 24 hours |
| `GET` | `/database/tickers` | Every ticker with prices: first and last date, number of bars |
| `GET` | `/database/ticker/{ticker}` | The same for one ticker, with its number of API requests |
| `POST` | `/database/cleanup` | Delete prices older than `days_to_keep` days and logs older than 30 days |

`POST /database/cleanup` takes a JSON body `{"days_to_keep": 730, "dry_run": false}`. `days_to_keep` must be 30 or more (730 by default). A first ingestion fetches ten years: count before deleting with `dry_run`, which deletes nothing and returns what a real run would delete.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"days_to_keep": 3650, "dry_run": true}' http://localhost:5000/database/cleanup
```

The usage log (`usage_logs`) has its own retention, `USAGE_LOG_RETENTION_DAYS`.
