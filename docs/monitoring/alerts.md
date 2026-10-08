---
id: "alerts"
title: "Provider Alerts & Resolution"
sidebar_label: "Alerts & Resolution"
description: "The alerts raised by the canary, their severity, automatic and manual resolution"
---

# Provider Alerts & Resolution

The canary run creates alerts in `provider_alerts`. An alert of a given type is not duplicated while one is active for the same provider.

## Alert types

| Type | Raised when | Severity | Resolution |
|---|---|---|---|
| `canary_failed` | A canary value is out of its expected range (or an outlier) | `critical` from `ALERT_CANARY_CRITICAL` failures in the run (3), `warning` below | Automatic when every check of a later run passes |
| `high_outlier_rate` | The success rate of the provider in the run is below `ALERT_SUCCESS_RATE_WARNING` (0.85) | `critical` below `ALERT_SUCCESS_RATE_CRITICAL` (0.70), `warning` otherwise | Manual |

`consecutive_nulls` and `latency_spike` exist in the schema, but no code raises them today.

An alert records the provider, the ticker and field of the first failure, the value received and the expected range.

## Listing alerts

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/alerts?severity=critical"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/alerts?provider_name=Investing&include_resolved=true"
```

## Resolving an alert by hand

The note is a query parameter; a full-access key is required.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/health/alerts/42/resolve?resolution_note=Parser%20updated"
```

## What to do with an alert

1. Look at the failing values: `GET /health/canary/history?provider_name=<name>`.
2. Ask the provider directly: `GET /fundamental?ticker=AIR.PA&provider=<name>&fmt=raw&nocache=true`.
3. A `403` or an empty answer usually means the website refuses your connection: route the provider through a proxy (`FONREX_PROXY_URL`, `FONREX_PROXY_PROVIDERS`).
4. A wrong number usually means the page changed: the parser of the provider needs an update ([adding providers](../guides/adding-providers.md) describes the tests with saved pages).
5. Meanwhile, the validation layer keeps the provider's suspicious values out of the answers.

## Settings

```env
ALERT_CANARY_CRITICAL=3
ALERT_SUCCESS_RATE_WARNING=0.85
ALERT_SUCCESS_RATE_CRITICAL=0.70
```
