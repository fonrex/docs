---
id: "validation-layer"
title: "验证层架构"
sidebar_label: "验证层"
description: "实时共识验证、数值范围边界及异常值剔除算法"
---


# 验证层架构

The `ValidationLayer` (`monitoring/validation_layer.py`) provides real-time data sanity checking on provider responses before metrics are exposed via the API.

## Range Checks (`FIELD_RANGES`)

Every incoming numerical metric is validated against absolute domain boundaries:

| Field Name | Minimum Allowed | Maximum Allowed | Unit / 说明描述 |
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

1. 计算所有达成一致的提供商的中位数值：`M = median(V_1, V_2, ..., V_k)`。
2. 对于每个提供商数值 `V_i`，计算绝对百分比偏差：
   `deviation = |V_i - M| / M`
3. If `deviation > VALIDATION_OUTLIER_THRESHOLD` (default `0.50` or 50%), `V_i` is flagged as an **outlier**, logged in `provider_health_log`, and set to `None`.
