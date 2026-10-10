---
id: "database-migrations"
title: "Migrations de la base en production"
sidebar_label: "Migrations de la base"
description: "Mettre à jour une instance en toute sécurité : sauvegarder, migrer, vérifier, et restaurer si besoin"
---

# Migrations de la base en production

Le conteneur de l'API applique `alembic upgrade head` à chaque démarrage. Une mise à jour de Fonrex est donc une mise à jour du schéma : préparez-la.

## Procédure de mise à jour

1. **Sauvegardez la base** :

   ```bash
   docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex-$(date +%F).dump
   ```

2. **Mettez à jour le code** : `git pull`.
3. **Migrez seul** (facultatif, pour voir les migrations s'exécuter avant le démarrage de l'API) :

   ```bash
   docker compose --profile migrate build fonrex-migrate
   docker compose --profile migrate run --rm fonrex-migrate
   ```

4. **Démarrez la nouvelle version** : `docker compose up -d --build`.
5. **Vérifiez** : `docker compose logs fonrex-api` affiche les migrations appliquées, puis lancez `curl http://localhost:5000/health` et quelques requêtes avec votre clé. Une base restée en retard sur le code fait répondre `503` à ses routes.

## Revenir en arrière

Restaurez la sauvegarde faite à l'étape 1 avec la version précédente du code (voir [Docker Compose](../getting-started/docker-compose.md#backing-up-the-database)). Préférez-la à `alembic downgrade` : certains downgrades ne peuvent pas rendre ce que l'upgrade a supprimé (la migration 008 supprime des tables ; la migration 014 ne conserve qu'une barre par instrument et par date en revenant en arrière).

## Migrations notables

| Migration | Ce qu'il faut savoir |
|---|---|
| 014 — prix par cotation | Reconstruit `prices_eod` avec une série par cotation et redate les barres existantes à leur séance. S'exécute seule ; rien n'est retéléchargé. Si une série semble fausse ensuite : `POST /historical/ingest?ticker=<ticker>&force_refresh=true` |
| 015 — rendements du dividende en ratios | Convertit les rendements du dividende enregistrés de pourcentages en ratios |
| 016 — ajustement des séries de prix | Crée `price_series_adjustments`. Les prix ne sont pas modifiés : chaque série enregistrée avant est récupérée de nouveau en entier à sa prochaine ingestion, avec la clôture négociée dans `close` et la clôture ajustée des dividendes dans `adj_close`. Pour le faire d'un coup : `docker compose exec fonrex-api python scripts/ingest_all.py --force` |
| 017 — taux macro de plusieurs sources | Ajoute `source` à `macro_rates_cache` (la BCE à côté de FRED). Rien à faire |
| 018 — devise des états financiers | Les états enregistrés perdent leur faux `USD`. Enrichissez à nouveau les instruments que vous valorisez (`GET /fundamental/deep?ticker=...&refresh=true`) : d'ici là, le DCF prend la devise de la cotation |
| 019 — dates lues chez Yahoo | Efface les dates de détachement et de position courte au 1970-01-01 ; elles reviennent au prochain enrichissement approfondi |

La liste complète se trouve dans [Migrations du schéma](../architecture/migrations.md).

## Tester les migrations

Les tests de base de données appliquent les migrations à un vrai TimescaleDB, sur des données existantes, en descendant puis en remontant :

```bash
make test-db     # throwaway container of the image of docker-compose.yml, port 54329
```

Pour les exécuter contre votre propre serveur (une base temporaire est créée puis supprimée) :

```bash
FONREX_TEST_DATABASE_URL=postgresql://fonrex:<password>@localhost:5432/fonrex \
    pytest tests/test_timescale_integration.py
```
