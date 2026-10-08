---
id: "monitoring"
title: "Référence API Surveillance des fournisseurs & Administration"
sidebar_label: "Surveillance & Admin"
description: "Santé des fournisseurs, exécutions canari, alertes, statistiques de validation, administration du cache et de la base"
---

# Référence API Surveillance des fournisseurs & Administration

Les routes de surveillance rapportent ce que la [couche de validation](../monitoring/validation-layer.md) et le [canari quotidien](../monitoring/canary-monitor.md) ont observé sur chaque fournisseur de fondamentaux. Les routes d'administration gèrent le cache et la base de données de votre instance.

Les routes qui modifient quelque chose (`POST` ici) exigent une clé **à accès complet**.

---

## <span className="api-method get">GET</span> `/health`

Publique (sans clé). État du service, fournisseurs chargés au démarrage, état du cache et durées de vie.

```json
{
  "status": "healthy",
  "service": "FonRex API",
  "timestamp": "2026-10-08T16:34:42.235390",
  "yfinance_available": true,
  "providers": { "loaded": 14, "unavailable": [] },
  "cache": { "enabled": true, "status": "connected", "ttl_seconds": { "eod": 86400, "...": "..." } }
}
```

`providers.unavailable` nomme un fournisseur qui n'a pas pu être importé (dépendance manquante) : il est ignoré par toutes les requêtes jusqu'à correction.

---

## <span className="api-method get">GET</span> `/health/providers`

Synthèse de la santé des fournisseurs, lue dans Redis (écrite par le canari, 1 heure) ou en base.

```json
{
  "checked_at": "2026-10-08T06:02:10Z",
  "total_providers": 14,
  "healthy": 13,
  "degraded": 1,
  "down": 0,
  "providers": [
    {
      "name": "ZoneBourse",
      "is_healthy": true,
      "success_rate_7d": 0.98,
      "avg_latency_ms": null,
      "last_check": null,
      "canary_passed": null,
      "active_alerts": 0,
      "status_label": "OK"
    }
  ]
}
```

`status_label` vaut `OK` (taux de succès ≥ 85 %), `DEGRADED` (≥ 70 %) ou `DOWN`. Quand la synthèse vient de Redis, `avg_latency_ms`, `last_check` et `canary_passed` valent `null` et `active_alerts` vaut 0. Sur une nouvelle instance, avant la première exécution du canari, la liste est vide.

## <span className="api-method get">GET</span> `/health/providers/{provider_name}`

Détails d'un fournisseur sur `days` jours (7 par défaut) : `status`, `success_rate_7d`, `success_rate_30d`, `avg_latency_ms`, `daily_stats`, `recent_failures` et `active_alerts`.

---

## <span className="api-method get">GET</span> `/health/alerts`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `severity` | string | — | `warning` ou `critical` |
| `provider_name` | string | — | Un seul fournisseur |
| `include_resolved` | boolean | `false` | Inclure les alertes résolues |
| `limit` | integer | `50` | Nombre maximal d'alertes |

Types d'alertes levées par le canari : `canary_failed` (une valeur hors de sa plage attendue) et `high_outlier_rate` (taux de succès sous `ALERT_SUCCESS_RATE_WARNING` / `ALERT_SUCCESS_RATE_CRITICAL`). Voir [Alertes](../monitoring/alerts.md).

## <span className="api-method post">POST</span> `/health/alerts/{alert_id}/resolve`

Résoudre une alerte à la main. La note est un **paramètre de requête** (query) :

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/health/alerts/42/resolve?resolution_note=Parser%20fixed"
```

```json
{ "status": "resolved", "alert_id": 42, "resolved_at": "2026-10-08T10:12:00+00:00" }
```

Une alerte déjà résolue répond `{"status": "already_resolved"}`, une alerte inconnue `404`.

---

## <span className="api-method post">POST</span> `/health/canary/run`

Lancer une exécution du canari en arrière-plan, pour tous les fournisseurs ou pour `provider_name` seulement. Répond `{"status": "queued", "provider": "all", "message": "..."}`.

## <span className="api-method get">GET</span> `/health/canary/history`

Les vérifications canari passées. Paramètres : `provider_name`, `ticker`, `days` (7), `limit` (100).

## <span className="api-method get">GET</span> `/health/stats`

Statistiques de validation des 7 derniers jours :

```json
{
  "period": "last_7_days",
  "total_values_validated": 0,
  "total_valid": 0,
  "total_outliers": 0,
  "total_out_of_range": 0,
  "total_nulls": 0,
  "overall_quality_score": null,
  "most_reliable_providers": [],
  "least_reliable_providers": [],
  "fields_most_often_invalid": []
}
```

---

## Administration du cache

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/cache/stats` | Version et mémoire de Redis, durée de vie de chaque catégorie de cache, tickers en cache |
| `POST` | `/cache/clear` | Supprimer les réponses de fin de journée en cache (clés `eod:*` uniquement) |
| `POST` | `/cache/clear/{ticker}` | Supprimer les réponses de fin de journée en cache d'un ticker (`eod:{TICKER}:*`). Le paramètre `period` ne supprime rien pour l'instant : les clés ont plus de segments que le motif qu'il construit |

Les autres catégories (fondamentaux, indicateurs, actualités, DCF…) expirent d'elles-mêmes ; une ingestion invalide les réponses dérivées des prix de son ticker.

## Administration de la base de données

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/database/stats` | Prix et tickers enregistrés, requêtes API des dernières 24 heures |
| `GET` | `/database/tickers` | Chaque ticker ayant des prix : première et dernière date, nombre de barres |
| `GET` | `/database/ticker/{ticker}` | La même chose pour un ticker, avec son nombre de requêtes API |
| `POST` | `/database/cleanup` | Supprimer les prix plus anciens que `days_to_keep` jours et les journaux de plus de 30 jours |

`POST /database/cleanup` prend un corps JSON `{"days_to_keep": 730, "dry_run": false}`. `days_to_keep` doit valoir 30 ou plus (730 par défaut). Une première ingestion récupère dix ans : comptez avant de supprimer avec `dry_run`, qui ne supprime rien et renvoie ce qu'une exécution réelle supprimerait.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"days_to_keep": 3650, "dry_run": true}' http://localhost:5000/database/cleanup
```

Le journal d'utilisation (`usage_logs`) a sa propre rétention, `USAGE_LOG_RETENTION_DAYS`.
