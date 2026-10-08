---
id: "alerts"
title: "Alertes fournisseurs et résolution"
sidebar_label: "Alertes et résolution"
description: "Les alertes levées par le canary, leur gravité, leur résolution automatique et manuelle"
---

# Alertes fournisseurs et résolution

L'exécution du canary crée des alertes dans `provider_alerts`. Une alerte d'un type donné n'est pas dupliquée tant qu'une alerte de ce type est active pour le même fournisseur.

## Types d'alertes

| Type | Levée quand | Gravité | Résolution |
|---|---|---|---|
| `canary_failed` | Une valeur du canary est hors de sa plage attendue (ou aberrante) | `critical` à partir de `ALERT_CANARY_CRITICAL` échecs dans l'exécution (3), `warning` en dessous | Automatique quand toutes les vérifications d'une exécution ultérieure réussissent |
| `high_outlier_rate` | Le taux de succès du fournisseur dans l'exécution est inférieur à `ALERT_SUCCESS_RATE_WARNING` (0,85) | `critical` en dessous de `ALERT_SUCCESS_RATE_CRITICAL` (0,70), `warning` sinon | Manuelle |

`consecutive_nulls` et `latency_spike` existent dans le schéma, mais aucun code ne les lève aujourd'hui.

Une alerte enregistre le fournisseur, le ticker et le champ du premier échec, la valeur reçue et la plage attendue.

## Lister les alertes

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/alerts?severity=critical"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/alerts?provider_name=Investing&include_resolved=true"
```

## Résoudre une alerte à la main

La note est un paramètre de requête ; une clé à accès complet est nécessaire.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/health/alerts/42/resolve?resolution_note=Parser%20updated"
```

## Que faire d'une alerte

1. Examinez les valeurs en échec : `GET /health/canary/history?provider_name=<name>`.
2. Interrogez directement le fournisseur : `GET /fundamental?ticker=AIR.PA&provider=<name>&fmt=raw&nocache=true`.
3. Un `403` ou une réponse vide signifie généralement que le site web refuse votre connexion : faites passer le fournisseur par un proxy (`FONREX_PROXY_URL`, `FONREX_PROXY_PROVIDERS`).
4. Un nombre faux signifie généralement que la page a changé : le parser du fournisseur doit être mis à jour ([ajouter des fournisseurs](../guides/adding-providers.md) décrit les tests avec des pages enregistrées).
5. En attendant, la couche de validation écarte des réponses les valeurs suspectes du fournisseur.

## Paramètres

```env
ALERT_CANARY_CRITICAL=3
ALERT_SUCCESS_RATE_WARNING=0.85
ALERT_SUCCESS_RATE_CRITICAL=0.70
```
