---
id: "alerts"
title: "提供商警报与解决"
sidebar_label: "警报与解决"
description: "警报分类、严重级别、自动解决及手动解决工作流"
---


# 提供商警报与解决

Fonrex automatically creates alerts when provider metrics drop below acceptable health thresholds.

## Alert Typology

| 警报类型 | 触发条件 | 严重程度 | 自动解决 |
|---|---|---|---|
| `canary_failed` | Provider fails 3 consecutive daily synthetic canary checks | `critical` | ✅ Yes (when next canary succeeds) |
| `low_success_rate` | Provider 24h success rate drops below 70% | `critical` | ✅ Yes (when success rate > 85%) |
| `high_outlier_rate` | Over 30% of returned values flagged as consensus outliers | `warning` | ❌ Manual |
| `latency_spike` | Average provider latency exceeds 3000ms | `warning` | ✅ Yes (when latency < 1500ms) |

## Resolving Alerts Manually

要通过 REST API 手动解决活跃的警告或严重警报：

```bash
curl -X POST "http://localhost:5000/health/alerts/42/resolve" \
     -H "Content-类型: application/json" \
     -d '{"resolution_note": "Upstream HTML layout updated and parser fixed."}'
```
