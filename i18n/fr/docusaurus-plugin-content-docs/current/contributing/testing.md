---
id: "testing"
title: "Consignes & exécution des tests"
sidebar_label: "Consignes de test"
description: "Le contrôle qualité, les tests de base de données et comment tester les fournisseurs sans réseau"
---

# Consignes & exécution des tests

## Le contrôle qualité

```bash
make ci
```

`make ci` est ce que GitHub Actions exécute à chaque pull request et à chaque push sur `main` :

| Étape | Commande | Bloque |
|---|---|---|
| Lint | `make lint` (Ruff) | Violations Ruff strictes |
| Annotations | `make typecheck` | Frontières non typées des modules listés |
| Syntaxe | `make syntax` | Fichiers Python qui ne compilent pas |
| Migrations | `make migration-check` | Plus d'une tête Alembic |
| Tests et couverture | `make test-cov` | Tests en échec, avertissements (`PYTHONWARNINGS=error`), couverture globale sous 70 %, un module sous son propre seuil |

Les seuils de couverture sont listés par module dans `scripts/check_coverage_distribution.py`, y compris pour chaque fournisseur de données ; un fournisseur sans seuil fait échouer le contrôle. Les seuils ne font que monter.

## Lancer les tests

```bash
PYTHONPATH=. pytest                                   # everything
PYTHONPATH=. pytest tests/test_technical_indicators.py -v
PYTHONPATH=. pytest -k "cache_key"
```

La suite ne contacte jamais de service réel : `tests/conftest.py` efface les identifiants de votre shell, fait pointer Redis et la base vers des adresses injoignables et fait échouer toute recherche Yahoo réelle.

## Tests de base de données

`tests/test_timescale_integration.py` exécute les vraies migrations sur un vrai TimescaleDB : migration des prix existants, hypertable compressée, upserts, nettoyage, downgrade et upgrade, et une migration qui attend un job TimescaleDB. Sans serveur, ces tests sont ignorés.

```bash
make test-db     # throwaway container of the image of docker-compose.yml, port 54329
```

Ou contre n'importe quel serveur TimescaleDB ; chaque exécution crée et supprime sa propre base :

```bash
FONREX_TEST_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/postgres make ci
```

La CI les exécute sur un service `timescaledb` de la même image que `docker-compose.yml`.

## Écrire des tests

- **Aucun réseau réel.** Les tests de fournisseurs utilisent la fixture `fake_network` (`tests/conftest.py`) : chaque requête `httpx` reçoit une réponse préenregistrée, et une requête sans réponse fait échouer le test.
- **De vraies pages.** Les parseurs sont testés sur des copies réduites de vraies pages dans `tests/fixtures/providers/`.
- **Clés de cache.** Une route qui gagne un paramètre reçoit un test avec deux requêtes qui ne diffèrent que par ce paramètre (`tests/test_cache_keys.py`).
- **États financiers par exercice.** Testez un calcul sur des lignes enregistrées comme l'enrichissement les enregistre : trois lignes par exercice.
- **Un test doit échouer sans le correctif.** Vérifiez-le en annulant la modification une fois.

Certains garde-fous lisent les documents : `tests/test_docs_consistency.py` compare au code les tableaux de `ARCHITECTURE.md` (routes, migrations, modules, durées de vie du cache, actifs du canari) et les chiffres de `README.md`.
