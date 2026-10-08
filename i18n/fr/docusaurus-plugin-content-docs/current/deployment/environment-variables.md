---
id: "environment-variables"
title: "Référence des variables d'environnement pour le déploiement"
sidebar_label: "Variables d'environnement"
description: "Les réglages qui comptent pour déployer Fonrex, et comment .env parvient aux conteneurs"
---

# Référence des variables d'environnement pour le déploiement

Chaque réglage est décrit dans [Configuration](../getting-started/configuration.md). Cette page couvre ce qui compte pour un déploiement.

## Comment `.env` parvient aux conteneurs

- `docker-compose.yml` charge `.env` dans le conteneur de l'API (`env_file`).
- Il **remplace** ensuite les adresses de services écrites pour une exécution locale : `DATABASE_URL` (construite à partir de `POSTGRES_PASSWORD`, hôte `db`), `REDIS_URL` (hôte `redis`) et `ASYNC_DATABASE_URL` (vidée, pour qu'elle soit dérivée de `DATABASE_URL`). Il fixe aussi `WEB_CONCURRENCY` et vide `HTTP_PROXY` / `HTTPS_PROXY`.
- `.env` n'est jamais copié dans l'image.
- Un `KEY=value` par ligne ; un commentaire placé après une valeur vide est lu comme la valeur.

Chaque variable de `.env.example` est lue par le code (`tests/test_env_settings.py`) ; une valeur invalide revient à sa valeur par défaut avec un avertissement au lieu d'arrêter l'API.

## À définir obligatoirement

| Variable | Pourquoi |
|---|---|
| `FONREX_API_KEY` | Sans clé, toutes les routes protégées répondent `401` |
| `FONREX_READ_ONLY_API_KEYS` | Clés pour les clients extérieurs à la machine (Sheets, tableaux de bord) |
| `POSTGRES_PASSWORD` | Avant le premier démarrage ; enregistré dans le volume à l'initialisation |
| `SEC_EDGAR_EMAIL` | Votre adresse de contact : la SEC refuse les clients automatisés anonymes |

## Jamais en production

| Réglage | Pourquoi |
|---|---|
| `FONREX_AUTH_REQUIRED=false` | Ouvre toutes les routes, y compris l'administration du cache et de la base (effectif uniquement lorsqu'aucune clé n'est configurée) |
| `WEB_CONCURRENCY` > 1 | Duplique les flux temps réel et le canari quotidien |
| `USAGE_LOG_IP=full` | Conserve les adresses IP complètes des appelants dans `usage_logs` ; préférez `none` ou `truncated` |

## Souvent ajustées

| Variable | Défaut | Quand |
|---|---|---|
| `FRED_API_KEY` | *(vide)* | Taux sans risque en direct pour le DCF |
| `FONREX_PROXY_URL`, `FONREX_PROXY_PROVIDERS` | *(vide)* | Sites qui refusent l'IP de votre serveur |
| `FONREX_PROVIDER_MAX_CONCURRENCY` | `4` | Moins de requêtes simultanées par site |
| `OPENBB_ALLOWED_ORIGIN` | `https://pro.openbb.co` | Une autre origine OpenBB (CORS) |
| `USAGE_LOG_RETENTION_DAYS` | `90` | Rétention du journal d'utilisation |
| `CANARY_RUN_HOUR` | `6` | Heure (UTC) de la vérification quotidienne des fournisseurs |
