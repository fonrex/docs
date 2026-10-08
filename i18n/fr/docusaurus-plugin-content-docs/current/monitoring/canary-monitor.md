---
id: "canary-monitor"
title: "Suite de surveillance canary"
sidebar_label: "Moniteur canary"
description: "Vérification quotidienne de chaque fournisseur de données fondamentales sur des actifs connus et des plages attendues"
---

# Suite de surveillance canary

Le `CanaryMonitor` (`monitoring/canary_monitor.py`) interroge chaque fournisseur de données fondamentales, une fois par jour, sur quelques actifs bien connus dont les valeurs sont attendues dans des plages connues. Un fournisseur dont la page a changé est détecté même si aucun utilisateur ne l'a sollicité.

## Planification

- APScheduler (`AsyncIOScheduler`) dans le processus de l'API, tous les jours à `CANARY_RUN_HOUR` UTC (6 par défaut).
- `POST /health/canary/run` lance immédiatement une exécution (tous les fournisseurs, ou `provider_name`).
- Les fournisseurs sont vérifiés `CANARY_PROVIDER_SEMAPHORE` à la fois (3) ; chaque appel est limité à 15 secondes et l'exécution complète à 120 secondes.

## Actifs du canary

| Ticker | Champs | Plages attendues |
|---|---|---|
| `AAPL` | PER, rendement du dividende, bêta, prix | PER 20–45, rendement 0,003–0,01, bêta 0,8–1,5, prix 100–500 |
| `AIR.PA` | PER, rendement du dividende, bêta, prix | PER 15–60, rendement 0,005–0,04, bêta 0,8–1,8, prix 80–300 |
| `BNP.PA` | PER, rendement du dividende, P/B, prix | PER 4–15, rendement 0,04–0,12, P/B 0,3–1,5, prix 30–100 |
| `MSFT` | PER, bêta, prix | PER 25–50, bêta 0,7–1,3, prix 200–600 |
| `TSLA` | PER, bêta, prix | PER 30–300, bêta 1,5–3,5, prix 100–600 |

Les plages de prix ci-dessus sont une solution de repli. Quand la base de données contient au moins dix clôtures quotidiennes des 90 derniers jours pour l'actif, la plage attendue est leur moyenne ± 3 écarts-types, conservée pendant `CANARY_PRICE_RANGE_TTL_SECONDS` (6 heures).

Les fournisseurs qui ne couvrent que l'Europe (Boursorama, Fortuneo, BourseDirect, InvestirLesEchos) ne sont vérifiés que sur `AIR.PA` et `BNP.PA`. Les pourcentages sont convertis en ratios comme dans la [couche de validation](validation-layer.md).

## Une exécution

```
06:00 UTC  ──►  CanaryMonitor.run_all()
                  ├─ for each provider (3 in parallel):
                  │     canary assets × expected fields → ok / out_of_range / null / timeout
                  │     results → provider_health_log
                  ├─ daily aggregate → provider_health_daily (counters, success rate, is_healthy)
                  ├─ alerts → provider_alerts (created, or canary_failed auto-resolved)
                  └─ summary → Redis provider:health:summary (1 hour) → GET /health/providers
```

## Lire les résultats

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/health/providers
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/providers/ZoneBourse?days=30"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/canary/history?provider_name=ZoneBourse"
```

## Paramètres

```env
CANARY_RUN_HOUR=6
CANARY_PROVIDER_SEMAPHORE=3
CANARY_PRICE_RANGE_TTL_SECONDS=21600
CANARY_PRICE_RANGE_NEGATIVE_TTL_SECONDS=300
```

Le canary s'exécute dans le processus de l'API : avec plusieurs workers Gunicorn, chacun l'exécuterait.
