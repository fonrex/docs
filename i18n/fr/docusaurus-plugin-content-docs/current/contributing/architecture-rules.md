---
id: "architecture-rules"
title: "Règles & consignes d'architecture"
sidebar_label: "Règles d'architecture"
description: "Les règles de contribution d'AGENTS.md et le test qui garantit chacune d'elles"
---

# Règles & consignes d'architecture

`AGENTS.md`, à la racine du dépôt, est le contrat de toute contribution, humaine ou automatisée. Chaque règle est garantie par un test : en enfreindre une fait échouer `make ci`.

| # | Règle | Garantie par |
|---|---|---|
| 1 | **Une seule couche HTTP.** Un fournisseur ne crée jamais de client HTTP ; il utilise les fonctions utilitaires de `financials/providers/base.py`, où se trouvent les nouvelles tentatives, les pauses, la limite de concurrence et le proxy | `tests/test_provider_http_policy.py` |
| 2 | **Les réglages sont réels.** Lisez les réglages avec les fonctions utilitaires de `settings.py` ; chaque variable de `.env.example` est lue par le code ; une valeur invalide revient à la valeur par défaut avec un avertissement | `tests/test_env_settings.py` |
| 3 | **Les documents disent la vérité.** Les chiffres de `README.md` correspondent au code ; les tableaux de `ARCHITECTURE.md` listent chaque route, migration et module | `tests/test_docs_consistency.py` |
| 4 | **Les fournisseurs se chargent, ou l'échec est visible** (`PROVIDER_SPECS`, `/health`) | `tests/test_docs_consistency.py` |
| 5 | **Les unités sont déclarées** dans `monitoring/units.py` | `tests/test_provider_units.py` |
| 6 | **Les seuils de couverture ne font que monter**, un par fournisseur | `tests/test_coverage_gate.py` |
| 7 | **Sécurisé par défaut.** Chaque route exige une clé sauf si elle est déclarée publique ; une route qui modifie quelque chose n'est jamais un `GET` | `tests/test_auth_defaults.py` |
| 8 | **L'image Docker est autonome** ; `.env` n'y entre jamais | `tests/test_docker_image.py` |
| 9 | **Le journal d'utilisation ne retarde jamais une réponse** ; aucune IP n'est enregistrée sauf demande | `tests/test_usage_recorder.py` |
| 10 | **Aucun accès réseau réel dans les tests** (`fake_network`, pages enregistrées) | `tests/conftest.py` |
| 11 | **Les versions sont verrouillées** (`requirements*.lock`, vérifiées par hash) | `tests/test_dependency_lock.py` |
| 12 | **Les prix appartiennent à une cotation** : clé `(asset_listing_id, resolution, time)`, date de séance à minuit UTC, tickers résolus par `database/price_series.py` | `tests/test_price_series.py` |
| 13 | **Les symboles sources sont vérifiés, jamais devinés** (`historical/yahoo_symbols.py`) | `tests/test_yahoo_symbols.py` |
| 14 | **Les nombres affichés sont lus à un seul endroit** (`financials/numbers.py`) | `tests/test_numbers.py` |
| 15 | **Un chiffre restitué nomme sa source** (`Sources` de `/fundamental`) | `tests/test_financials_formatter.py` |
| 16 | **Rien de ce qui est lu dans Redis n'est exécuté, rien n'est supprimé sans limite** (cache JSON, nettoyage borné avec `dry_run`) | `tests/test_cache_service.py`, `tests/test_database_cleanup.py` |
| 17 | **La CI teste sur la base de données d'une installation** (même image TimescaleDB) | `tests/test_ci_workflow.py` |
| 18 | **Les états financiers sont lus par exercice** (`financials/fiscal_years.py`) | `tests/test_fiscal_years.py` |
| 19 | **Une clé de cache contient chaque paramètre qui change la réponse** | `tests/test_cache_keys.py` |

## Couches

- `routers/` analysent la requête et traduisent les erreurs applicatives en statuts HTTP.
- `use_cases/` dépendent des ports de `use_cases/ports.py`, jamais de FastAPI, de SQLAlchemy ni d'un fournisseur.
- Le code bloquant est appelé via `concurrency.run_sync()`.

Voir [Couches & ports](../architecture/hexagonal.md).

## Identité

- Ne prenez jamais un ticker pour un identifiant global : `SPFF` est un ETF obligataire en EUR dans un catalogue et un fonds américain chez Yahoo. Résolvez une cotation (ticker, place, devise) et utilisez le symbole vérifié pour elle.
- Ne masquez jamais un échec par une valeur de repli ou un `except` silencieux : indiquez pourquoi quelque chose manque (`reason`, `note`, `warnings`).
