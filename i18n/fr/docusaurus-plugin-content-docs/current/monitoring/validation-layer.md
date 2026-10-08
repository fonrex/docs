---
id: "validation-layer"
title: "Architecture de la couche de validation"
sidebar_label: "Couche de validation"
description: "Vérifications de plage et de consensus appliquées à chaque valeur d'un fournisseur avant qu'elle n'atteigne une réponse"
---

# Architecture de la couche de validation

Treize des fournisseurs de données fondamentales lisent des pages web. Quand une page change, un fournisseur peut continuer à répondre, mais avec un nombre faux (`0.8` au lieu de `24.0` pour un PER). La `ValidationLayer` (`monitoring/validation_layer.py`) intercepte ces valeurs à chaque requête `/fundamental`, après la réponse des fournisseurs et avant la construction du document. Une valeur rejetée devient `None`, et le document prend le chiffre d'une autre source.

## 1. Normalisation des unités

Les plages sont des ratios : un rendement du dividende de 3,45 % vaut `0.0345`. Les fournisseurs scrapés renvoient souvent des pourcentages affichés (`3.45`). `monitoring/units.py` déclare, par fournisseur, les champs renvoyés en pourcentage (`PROVIDER_PERCENT_FIELDS`) ; ils sont convertis avant toute vérification. La réponse du fournisseur garde sa propre unité ; les journaux contiennent le ratio converti.

## 2. Vérifications de plage

| Champ | Min | Max |
|---|---|---|
| `pe_ratio` | 0,5 | 1000 |
| `pe_forward` | 0,5 | 500 |
| `pb_ratio` | 0 | 100 |
| `ps_ratio` | 0 | 200 |
| `peg_ratio` | −10 | 50 |
| `ev_ebitda` | 0 | 500 |
| `price`, `target_price`, `week_52_high`, `week_52_low` | 0,001 | 1 000 000 |
| `dividend_yield` | 0 | 0,50 |
| `dividend_rate` | 0 | 1000 |
| `payout_ratio` | 0 | 10 |
| `roe` | −5 | 10 |
| `roa` | −2 | 2 |
| `net_margin`, `operating_margin` | −5 | 1 |
| `gross_margin` | −1 | 1 |
| `quarterly_revenue_growth_yoy` | −0,99 | 10 |
| `quarterly_earnings_growth_yoy` | −0,99 | 20 |
| `eps`, `eps_trailing`, `eps_forward` | −1000 | 10 000 |
| `beta` | −3 | 5 |
| `short_percent_float` | 0 | 1 |

Une valeur hors de sa plage est `out_of_range` et mise à `None`.

## 3. Vérification par consensus

Quand au moins `VALIDATION_MIN_PROVIDERS` (2) fournisseurs donnent une valeur dans la plage pour le même champ :

1. la médiane `M` de ces valeurs est calculée ;
2. chaque valeur `V` s'en écarte de `|V − M| / M` ;
3. au-delà de `VALIDATION_OUTLIER_THRESHOLD` (0,50), la valeur est un `outlier` et mise à `None`.

## 4. Journalisation

Chaque valeur vérifiée est écrite dans l'hypertable `provider_health_log` (rétention de 30 jours) avec son statut : `ok`, `out_of_range`, `outlier` ou null. `GET /health/stats` résume les 7 derniers jours.

La couche de validation ne lève jamais d'exception : une erreur interne est journalisée et la réponse continue sans validation plutôt que d'échouer.

## Paramètres

```env
VALIDATION_OUTLIER_THRESHOLD=0.50
VALIDATION_MIN_PROVIDERS=2
```
