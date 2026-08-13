---
id: "environment-variables"
title: "Référence de Déploiement des Variables d'Environnement"
sidebar_label: "Variables d'Environnement"
description: "Référence complète de déploiement pour toutes les variables d'environnement utilisées par les modules Python"
---


# Référence de Déploiement des Variables d'Environnement

Below is the complete inventory of environment variables referenced across all Fonrex Python modules (`os.getenv(...)`).

## 1. Database & Persistence

- `DATABASE_URL`: URL de connexion PostgreSQL complète.
- `ASYNC_DATABASE_URL`: URL de connexion pour le driver AsyncPG (déduite automatiquement si vide).
- `POSTGRES_DB`: Nom de la base de données PostgreSQL.
- `POSTGRES_USER`: Nom d'utilisateur PostgreSQL.
- `POSTGRES_PASSWORD`: Mot de passe PostgreSQL.

## 2. In-Memory Cache & Pub/Sub

- `REDIS_URL`: Chaîne de connexion pour Redis.
- `CACHE_TTL`: TTL de cache par défaut global en secondes.

## 3. Web & Application Server

- `FLASK_ENV` / `ENVIRONMENT`: Mode d'environnement (`production`, `development`).
- `SECRET_KEY`: Clé secrète de signature cryptographique.
- `PORT`: Port d'écoute HTTP (par défaut `5000`).

## 4. Market Data & Streaming

- `TV_MAX_CONNECTIONS`: Connexions WebSocket maximum vers TradingView.
- `TV_RECONNECT_DELAY`: Délai initial pour la reconnexion WebSocket (backoff).
- `REALTIME_QUOTE_TTL`: TTL des snapshots dans Redis.
- `REALTIME_AUTO_SUBSCRIBE`: Drapeau d'activation de l'auto-abonnement lors des requêtes de quote.

## 5. Indicator Calculation

- `TECHNICAL_CACHE_ENABLED`: Activer/désactiver le cache Redis des séries d'indicateurs.
- `TECHNICAL_DEFAULT_LIMIT`: Défaut OHLCV window size.
- `TECHNICAL_MAX_BATCH_TICKERS`: Tickers maximum par appel API en masse.
- `TECHNICAL_MAX_BATCH_INDICATORS`: Indicateurs maximum par appel en masse.

## 6. Provider Quality & Health

- `VALIDATION_OUTLIER_THRESHOLD`: Déviation de consensus maximum autorisée (ex. `0.50`).
- `VALIDATION_MIN_PROVIDERS`: Nombre minimum de providers pour le calcul du consensus.
- `CANARY_RUN_HOUR`: Heure UTC pour déclencher les contrôles canary quotidiens (0-23).
- `CANARY_PROVIDER_SEMAPHORE`: Nombre maximum de workers de contrôles canary parallèles.
