---
id: "canary-monitor"
title: "Canary Monitor Suite"
sidebar_label: "Canary Monitor"
description: "Daily check of every fundamentals provider against known assets and expected ranges"
---

# Canary Monitor Suite

The `CanaryMonitor` (`monitoring/canary_monitor.py`) asks every fundamentals provider, once a day, for a few well-known assets whose values are expected in known ranges. A provider whose page changed is detected even when no user asked for it.

## Schedule

- APScheduler (`AsyncIOScheduler`) inside the API process, every day at `CANARY_RUN_HOUR` UTC (6 by default).
- `POST /health/canary/run` starts a run at once (all providers, or `provider_name`).
- Providers are checked `CANARY_PROVIDER_SEMAPHORE` at a time (3); each call is limited to 15 seconds and the whole run to 120 seconds.

## Canary assets

| Ticker | Fields | Expected ranges |
|---|---|---|
| `AAPL` | P/E, dividend yield, beta, price | P/E 20–45, yield 0.003–0.01, beta 0.8–1.5, price 100–500 |
| `AIR.PA` | P/E, dividend yield, beta, price | P/E 15–60, yield 0.005–0.04, beta 0.8–1.8, price 80–300 |
| `BNP.PA` | P/E, dividend yield, P/B, price | P/E 4–15, yield 0.04–0.12, P/B 0.3–1.5, price 30–100 |
| `MSFT` | P/E, beta, price | P/E 25–50, beta 0.7–1.3, price 200–600 |
| `TSLA` | P/E, beta, price | P/E 30–300, beta 1.5–3.5, price 100–600 |

The price ranges above are a fallback. When the database holds at least ten daily closes of the last 90 days for the asset, the expected range is their mean ± 3 standard deviations, kept for `CANARY_PRICE_RANGE_TTL_SECONDS` (6 hours).

Providers that only cover Europe (Boursorama, Fortuneo, BourseDirect, InvestirLesEchos) are only checked on `AIR.PA` and `BNP.PA`. Percentages are converted to ratios as in the [validation layer](validation-layer.md).

## A run

```
06:00 UTC  ──►  CanaryMonitor.run_all()
                  ├─ for each provider (3 in parallel):
                  │     canary assets × expected fields → ok / out_of_range / null / timeout
                  │     results → provider_health_log
                  ├─ daily aggregate → provider_health_daily (counters, success rate, is_healthy)
                  ├─ alerts → provider_alerts (created, or canary_failed auto-resolved)
                  └─ summary → Redis provider:health:summary (1 hour) → GET /health/providers
```

## Reading the results

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/health/providers
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/providers/ZoneBourse?days=30"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/canary/history?provider_name=ZoneBourse"
```

## Settings

```env
CANARY_RUN_HOUR=6
CANARY_PROVIDER_SEMAPHORE=3
CANARY_PRICE_RANGE_TTL_SECONDS=21600
CANARY_PRICE_RANGE_NEGATIVE_TTL_SECONDS=300
```

The canary runs in the API process: with several Gunicorn workers, each one would run it.
