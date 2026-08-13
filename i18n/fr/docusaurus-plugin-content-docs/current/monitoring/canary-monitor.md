---
id: "canary-monitor"
title: "Suite Canary Monitor"
sidebar_label: "Canary Monitor"
description: "Tests synthétiques quotidiens automatisés des providers, planification et agrégation des métriques"
---


# Suite Canary Monitor

The `CanaryMonitor` (`monitoring/canary_monitor.py`) executes automated synthetic queries against all registered providers to monitor provider health, detect upstream DOM/API changes, and generate quality metrics.

## Planification

The Canary suite is scheduled daily using `AsyncIOScheduler` (APScheduler):

- **Défaut Execution Time**: `06:00 UTC` (configurable via `CANARY_RUN_HOUR`).
- **Concurrency Control**: Semaphore limited to `CANARY_PROVIDER_SEMAPHORE` (default 3 concurrent checks).

## Workflow de Contrôle Synthétique

```
06:00 UTC APScheduler Trigger
           │
           ▼
CanaryMonitor.run_all()
           │
           ├─► For each provider in Canary Catalog (monitoring/canary_catalog.py):
           │    ├── Exécute des requêtes synthétiques sur des actifs de référence (ex. AAPL, AIR.PA)
           │    ├── Verifies response latency and HTTP status code
           │    └── Logs result into TimescaleDB `provider_health_log`
           │
           ▼
CanaryMonitor.aggregate_daily()
           │ Calcule le taux de succès sur 24h, la latence moyenne et le drapeau canary_passed
           ▼
Upsert into `provider_health_daily`
           │
           ▼
Vérification des seuils d'alerte ──► Déclenche `provider_alerts` si critique
```
