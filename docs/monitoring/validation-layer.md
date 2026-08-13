---
id: "validation-layer"
title: "Validation Layer Architecture"
sidebar_label: "Validation Layer"
description: "Real-time consensus validation, numerical range boundaries, and outlier rejection algorithms"
---

# Validation Layer Architecture

The `ValidationLayer` (`monitoring/validation_layer.py`) provides real-time data sanity checking on provider responses before metrics are exposed via the API.

## Range Checks (`FIELD_RANGES`)

Every incoming numerical metric is validated against absolute domain boundaries:

| Field Name | Minimum Allowed | Maximum Allowed | Unit / Description |
|---|---|---|---|
| `pe_ratio` | `-500.0` | `2000.0` | Price to Earnings ratio |
| `dividend_yield` | `0.0` | `0.40` | Dividend yield (0% to 40%) |
| `beta` | `-5.0` | `10.0` | Market Beta |
| `roe` | `-5.0` | `5.0` | Return on Equity (-500% to +500%) |
| `roa` | `-5.0` | `5.0` | Return on Assets |
| `market_cap` | `1,000,000` | `10,000,000,000,000` | Market Capitalization in local currency |

Values falling outside these bounds are discarded and replaced with `None`.

## Inter-Provider Consensus Check

When 2 or more providers supply a numerical value for the same field:

1. The median value across all agreeing providers is computed: `M = median(V_1, V_2, ..., V_k)`.
2. For each provider value `V_i`, the absolute percentage deviation is calculated:
   `deviation = |V_i - M| / M`
3. If `deviation > VALIDATION_OUTLIER_THRESHOLD` (default `0.50` or 50%), `V_i` is flagged as an **outlier**, logged in `provider_health_log`, and set to `None`.
