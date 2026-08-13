---
id: "alerts"
title: "Alertes de Providers & Résolution"
sidebar_label: "Alertes & Résolution"
description: "Classification des alertes, niveaux de sévérité, auto-résolution et workflows de résolution manuelle"
---


# Alertes de Providers & Résolution

Fonrex automatically creates alerts when provider metrics drop below acceptable health thresholds.

## Typologie des Alertes

| Type d'Alerte | Condition de Déclenchement | Sévérité | Auto-Résolution |
|---|---|---|---|
| `canary_failed` | Le provider échoue à 3 contrôles canary synthétiques quotidiens consécutifs | `critical` | ✅ Oui (au prochain succès canary) |
| `low_success_rate` | Le taux de succès sur 24h du provider chute en dessous de 70% | `critical` | ✅ Oui (quand le taux de succès > 85%) |
| `high_outlier_rate` | Plus de 30% des valeurs retournées sont marquées comme outliers par le consensus | `warning` | ❌ Manuelle |
| `latency_spike` | La latence moyenne du provider dépasse 3 000 ms | `warning` | ✅ Oui (quand la latence < 1 500 ms) |

## Résoudre les Alertes Manuellement

Pour résoudre manuellement les alertes actives d'avertissement ou critiques via l'API REST :

```bash
curl -X POST "http://localhost:5000/health/alerts/42/resolve" \
     -H "Content-Type: application/json" \
     -d '{"resolution_note": "Upstream HTML layout updated and parser fixed."}'
```
