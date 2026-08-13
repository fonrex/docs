---
id: "monitoring"
title: "Référence API Monitoring de Providers"
sidebar_label: "Monitoring de Providers"
description: "Endpoints pour les statuts de santé des providers, journaux d'inspection canary et alertes automatisées"
---


# Référence API Monitoring de Providers

L'API de supervision des providers expose des endpoints pour consulter la santé des providers, inspecter les exécutions quotidiennes des contrôles canary synthétiques, afficher les alertes d'outliers et résoudre les incidents.

---

## <span className="api-method get">GET</span> `/health/providers`

Récupérer le résumé actuel de santé et de disponibilité de l'ensemble des providers de données financières.

### Exemple de Réponse

```json
{
  "total_providers": 14,
  "healthy_count": 13,
  "degraded_count": 1,
  "providers": [
    {
      "name": "ZoneBourse",
      "is_healthy": true,
      "success_rate": 0.98,
      "avg_latency_ms": 320,
      "last_check_at": "2026-08-11T06:00:00Z"
    },
    {
      "name": "Investing",
      "is_healthy": false,
      "success_rate": 0.65,
      "avg_latency_ms": 1450,
      "last_check_at": "2026-08-11T06:00:00Z"
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/health/providers/{name}`

Statistiques détaillées de santé, métriques de latence historique et événements récents d'outliers pour un provider unique.

---

## <span className="api-method get">GET</span> `/health/alerts`

Récupérer les alertes de qualité actives ou résolues des providers.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `severity` | `string` | ❌ | — | Filtrer par sévérité (`critical`, `warning`, `info`) |
| `provider` | `string` | ❌ | — | Nom du provider |
| `include_resolved` | `boolean` | ❌ | `false` | Inclure l'historique des alertes résolues |

---

## <span className="api-method post">POST</span> `/health/alerts/{id}/resolve`

Marquer manuellement une alerte comme résolue avec une note d'explication optionnelle.

### Corps de la Requête

```json
{
  "resolution_note": "Upstream rate limit cleared by provider support."
}
```

---

## <span className="api-method post">POST</span> `/health/canary/run`

Déclencher immédiatement un contrôle de santé Canary en arrière-plan sur tous les providers enregistrés ou un provider cible.

---

## <span className="api-method get">GET</span> `/health/canary/history`

Journal d'exécution historique des contrôles canary synthétiques quotidiens.

---

## <span className="api-method get">GET</span> `/health/stats`

Statistiques globales de qualité des données sur une fenêtre glissante de 7 jours.
