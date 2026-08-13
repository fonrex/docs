---
id: "canary-monitor"
title: "Canary Monitor Suite"
sidebar_label: "Canary Monitor"
description: "Daily automated synthetic provider testing, execution scheduling, and metrics aggregation"
---

# Canary Monitor Suite

The `CanaryMonitor` (`monitoring/canary_monitor.py`) executes automated synthetic queries against all registered providers to monitor provider health, detect upstream DOM/API changes, and generate quality metrics.

## Scheduling

The Canary suite is scheduled daily using `AsyncIOScheduler` (APScheduler):

- **Default Execution Time**: `06:00 UTC` (configurable via `CANARY_RUN_HOUR`).
- **Concurrency Control**: Semaphore limited to `CANARY_PROVIDER_SEMAPHORE` (default 3 concurrent checks).

## Synthetic Check Workflow

```
06:00 UTC APScheduler Trigger
           │
           ▼
CanaryMonitor.run_all()
           │
           ├─► For each provider in Canary Catalog (monitoring/canary_catalog.py):
           │    ├── Executes synthetic fetch against benchmark assets (e.g. AAPL, AIR.PA)
           │    ├── Verifies response latency and HTTP status code
           │    └── Logs result into TimescaleDB `provider_health_log`
           │
           ▼
CanaryMonitor.aggregate_daily()
           │ Calculates 24h success rate, avg latency, and canary_passed flag
           ▼
Upsert into `provider_health_daily`
           │
           ▼
Check Alert Thresholds ──► Trigger `provider_alerts` if critical
```
