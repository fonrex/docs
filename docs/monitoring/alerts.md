---
id: "alerts"
title: "Provider Alerts & Resolution"
sidebar_label: "Alerts & Resolution"
description: "Alert classification, severity levels, auto-resolution, and manual resolution workflows"
---

# Provider Alerts & Resolution

Fonrex automatically creates alerts when provider metrics drop below acceptable health thresholds.

## Alert Typology

| Alert Type | Trigger Condition | Severity | Auto-Resolution |
|---|---|---|---|
| `canary_failed` | Provider fails 3 consecutive daily synthetic canary checks | `critical` | ✅ Yes (when next canary succeeds) |
| `low_success_rate` | Provider 24h success rate drops below 70% | `critical` | ✅ Yes (when success rate > 85%) |
| `high_outlier_rate` | Over 30% of returned values flagged as consensus outliers | `warning` | ❌ Manual |
| `latency_spike` | Average provider latency exceeds 3000ms | `warning` | ✅ Yes (when latency < 1500ms) |

## Resolving Alerts Manually

To resolve active warning or critical alerts manually via the REST API:

```bash
curl -X POST "http://localhost:5000/health/alerts/42/resolve" \
     -H "Content-Type: application/json" \
     -d '{"resolution_note": "Upstream HTML layout updated and parser fixed."}'
```
