---
id: "monitoring"
title: "Provider Monitoring API Reference"
sidebar_label: "Provider Monitoring"
description: "Endpoints for provider health check statuses, canary inspection logs, and automated alerts"
---

# Provider Monitoring API Reference

The Provider Monitoring API exposes endpoints to query provider health, inspect daily synthetic canary check executions, view outlier alerts, and resolve system incidents.

---

## <span className="api-method get">GET</span> `/health/providers`

Retrieve current health and availability summary across all financial data providers.

### Response Example

```json
{
  "total_providers": 14,
  "healthy_count": 13,
  "degraded_count": 1,
  "providers": [
    {
      "name": "ZoneBourse",
      "is_healthy": true,
      "success_rate": 0.98,
      "avg_latency_ms": 320,
      "last_check_at": "2026-08-11T06:00:00Z"
    },
    {
      "name": "Investing",
      "is_healthy": false,
      "success_rate": 0.65,
      "avg_latency_ms": 1450,
      "last_check_at": "2026-08-11T06:00:00Z"
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/health/providers/{name}`

Detailed health statistics, historical latency metrics, and recent outlier events for a single provider.

---

## <span className="api-method get">GET</span> `/health/alerts`

Retrieve active or resolved provider quality alerts.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `severity` | `string` | ❌ | — | Filter by severity (`critical`, `warning`, `info`) |
| `provider` | `string` | ❌ | — | Provider name |
| `include_resolved` | `boolean` | ❌ | `false` | Include historical resolved alerts |

---

## <span className="api-method post">POST</span> `/health/alerts/{id}/resolve`

Manually mark an alert as resolved with an optional resolution note.

### Request Body

```json
{
  "resolution_note": "Upstream rate limit cleared by provider support."
}
```

---

## <span className="api-method post">POST</span> `/health/canary/run`

Trigger an immediate background Canary health check across all registered providers or a single target provider.

---

## <span className="api-method get">GET</span> `/health/canary/history`

Historical execution log of daily synthetic canary checks.

---

## <span className="api-method get">GET</span> `/health/stats`

Global data quality statistics over a 7-day rolling window.
