---
id: "validation-layer"
title: "Validation Layer Architecture"
sidebar_label: "Validation Layer"
description: "Range and consensus checks applied to every provider value before it reaches an answer"
---

# Validation Layer Architecture

Thirteen of the fundamentals providers read web pages. When a page changes, a provider may keep answering — with a wrong number (`0.8` instead of `24.0` for a P/E). The `ValidationLayer` (`monitoring/validation_layer.py`) catches such values on every `/fundamental` request, after the providers answered and before the document is built. A rejected value becomes `None`, and the document takes the figure from another source.

## 1. Unit normalisation

Ranges are ratios: a 3.45 % dividend yield is `0.0345`. Scraped providers often return displayed percentages (`3.45`). `monitoring/units.py` declares, per provider, the fields returned as percentages (`PROVIDER_PERCENT_FIELDS`); they are converted before any check. The answer of the provider keeps its own unit; the logs hold the converted ratio.

## 2. Range checks

| Field | Min | Max |
|---|---|---|
| `pe_ratio` | 0.5 | 1000 |
| `pe_forward` | 0.5 | 500 |
| `pb_ratio` | 0 | 100 |
| `ps_ratio` | 0 | 200 |
| `peg_ratio` | −10 | 50 |
| `ev_ebitda` | 0 | 500 |
| `price`, `target_price`, `week_52_high`, `week_52_low` | 0.001 | 1,000,000 |
| `dividend_yield` | 0 | 0.50 |
| `dividend_rate` | 0 | 1000 |
| `payout_ratio` | 0 | 10 |
| `roe` | −5 | 10 |
| `roa` | −2 | 2 |
| `net_margin`, `operating_margin` | −5 | 1 |
| `gross_margin` | −1 | 1 |
| `quarterly_revenue_growth_yoy` | −0.99 | 10 |
| `quarterly_earnings_growth_yoy` | −0.99 | 20 |
| `eps`, `eps_trailing`, `eps_forward` | −1000 | 10,000 |
| `beta` | −3 | 5 |
| `short_percent_float` | 0 | 1 |

A value outside its range is `out_of_range` and set to `None`.

## 3. Consensus check

When at least `VALIDATION_MIN_PROVIDERS` (2) providers give a value in range for the same field:

1. the median `M` of those values is computed;
2. each value `V` deviates by `|V − M| / M`;
3. above `VALIDATION_OUTLIER_THRESHOLD` (0.50), the value is an `outlier` and set to `None`.

## 4. Logging

Every checked value is written to the `provider_health_log` hypertable (30-day retention) with its status: `ok`, `out_of_range`, `outlier` or null. `GET /health/stats` summarises the last 7 days.

The validation layer never raises: an internal error is logged and the answer goes on unvalidated rather than failing.

## Settings

```env
VALIDATION_OUTLIER_THRESHOLD=0.50
VALIDATION_MIN_PROVIDERS=2
```
