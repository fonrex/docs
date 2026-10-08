---
id: "hexagonal"
title: "Couches & ports"
sidebar_label: "Couches & ports"
description: "Comment Fonrex sépare les adaptateurs HTTP, la logique applicative et les adaptateurs vers l'extérieur, et dans quelle mesure chaque fonctionnalité suit ce découpage"
---

# Couches & ports

Le code est organisé par fonctionnalité et, à l'intérieur d'une fonctionnalité, en trois niveaux :

1. **Adaptateurs HTTP** (`routers/`) : analysent la requête, appellent le niveau inférieur, traduisent les erreurs en statuts HTTP.
2. **Logique applicative** : cas d'usage (`use_cases/`) ou services fonctionnels (`historical/`, `technical/`, `news/`, `valuation/`, `monitoring/`, `macro/`).
3. **Adaptateurs vers l'extérieur** : dépôts SQLAlchemy (`database/`), Redis (`cache/`), fournisseurs (`financials/providers/`, `news/providers/`, `historical/providers.py`).

```
┌──────────────── routers/ (FastAPI) ────────────────┐
│  parse request → call use case → map errors        │
└──────────────────────────┬─────────────────────────┘
                           ▼
┌──────── use_cases/ — depends on ports only ────────┐
│  GetFundamentals, GetDeepFundamentals, GetQuote…   │
│  use_cases/ports.py: repository, cache, providers  │
└──────────────────────────┬─────────────────────────┘
                           ▼ implemented by
┌──── database/, cache/, financials/providers/ ──────┐
│  SQLAlchemy, Redis, HTTP                           │
└────────────────────────────────────────────────────┘
```

## Dans quelle mesure chaque fonctionnalité le suit

| Fonctionnalité | Routeur | Logique applicative | Derrière des ports ? |
|---|---|---|---|
| Fondamentaux | `routers/fundamentals.py` | `use_cases/fundamentals.py` | Oui (`use_cases/ports.py`) |
| Fournisseurs spécialisés | `routers/specialized.py` | `use_cases/specialized.py` | Oui |
| Temps réel | `routers/realtime.py` | `use_cases/realtime.py` | En partie : le protocole WebSocket est dans le routeur |
| Indicateurs techniques | `routers/technical.py` | `technical/indicator_service.py` | Oui (`technical/contracts.py`) |
| Surveillance | `routers/monitoring.py` | `monitoring/` | En partie : le canary et la couche de validation utilisent `monitoring/ports.py` ; les requêtes de lecture des routes sont écrites dans le routeur |
| Historique et EOD | `routers/historical.py`, `routers/assets.py` | `historical/ingestion_service.py`, `database/query.py` | Non |
| Valorisation | `routers/valuation.py` | `valuation/dcf_service.py` | Non |
| Actualités | `routers/news.py` | `news/news_service.py` | Non |
| Macro, exploitation | `routers/macro.py`, `routers/admin.py` | `macro/`, `database/maintenance.py`, `cache/` | Non |

La couche de cas d'usage est le modèle cible ; les autres fonctionnalités appellent directement leurs services.

## Règles garanties par des tests

- `technical/` n'importe ni FastAPI, ni SQLAlchemy, ni Redis, ni les modèles ORM ; `monitoring/` n'importe ni SQLAlchemy ni les modèles ORM (`tests/test_exception_boundaries.py`).
- Le code bloquant (sessions SQLAlchemy, pandas, yfinance) est atteint via `concurrency.run_sync()` depuis le code asynchrone (`tests/test_async_boundary.py`) : voir [Concurrence](concurrency.md).
- Les routeurs traduisent les erreurs applicatives avec `routers/errors.py`.

## Correspondance des erreurs

| Erreur applicative (`use_cases/errors.py`) | Statut HTTP |
|---|---|
| `InvalidInput` | `400 Bad Request` |
| `ResourceNotFound` | `404 Not Found` |
| `DependencyUnavailable` | `503 Service Unavailable` |
| `UpstreamFailure` | `500 Internal Server Error` |

Les indicateurs techniques ont leurs propres erreurs : indicateur inconnu `400`, aucun prix `404`, trop peu de barres `422`.
