---
id: "validation-layer"
title: "Architecture de la Couche de Validation"
sidebar_label: "Couche de Validation"
description: "Validation de consensus en temps réel, limites de plages numériques et algorithmes de rejet d'outliers"
---


# Architecture de la Couche de Validation

The `ValidationLayer` (`monitoring/validation_layer.py`) provides real-time data sanity checking on provider responses before metrics are exposed via the API.

## Contrôles de Plage (`FIELD_RANGES`)

Every incoming numerical metric is validated against absolute domain boundaries:

| Nom du Champ | Minimum Autorisé | Maximum Autorisé | Unité / Description |
|---|---|---|---|
| `pe_ratio` | `-500.0` | `2000.0` | Ratio PER (Price to Earnings) |
| `dividend_yield` | `0.0` | `0.40` | Rendement du dividende (0% à 40%) |
| `beta` | `-5.0` | `10.0` | Beta du marché |
| `roe` | `-5.0` | `5.0` | Rendement des capitaux propres (ROE -500% à +500%) |
| `roa` | `-5.0` | `5.0` | Rendement des actifs (ROA) |
| `market_cap` | `1,000,000` | `10,000,000,000,000` | Capitalisation boursière en devise locale |

Values falling outside these bounds are discarded and replaced with `None`.

## Vérification du Consensus Inter-Providers

When 2 or more providers supply a numerical value for the same field:

1. La valeur médiane entre tous les providers en accord est calculée : `M = median(V_1, V_2, ..., V_k)`.
2. Pour chaque valeur `V_i` d'un provider, la déviation en pourcentage absolu est calculée :
   `deviation = |V_i - M| / M`
3. If `deviation > VALIDATION_OUTLIER_THRESHOLD` (default `0.50` or 50%), `V_i` is flagged as an **outlier**, logged in `provider_health_log`, and set to `None`.
