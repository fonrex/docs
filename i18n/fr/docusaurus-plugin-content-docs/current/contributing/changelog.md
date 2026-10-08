---
id: "changelog"
title: "Journal des versions de Fonrex"
sidebar_label: "Journal des modifications"
description: "Historique du projet, ajouts de fonctionnalités, migrations de schéma et mises à jour de version"
---

# Journal des versions de Fonrex

## Octobre 2026 — Sécurité par défaut, prix par cotation, données fournisseurs vérifiées

Fusionné sur `main` le 8 octobre 2026 (pull request #15).

### ⚠️ Changements incompatibles
- **Une clé d'API est exigée par défaut.** Toutes les routes sauf `/health`, la documentation, `/widgets.json`, `/apps.json` et `/static` répondent `401` tant que `FONREX_API_KEY` n'est pas défini. `FONREX_AUTH_REQUIRED=false` n'ouvre qu'une instance sans aucune clé configurée. Nouvelles **clés en lecture seule** (`FONREX_READ_ONLY_API_KEYS`) pour les clients extérieurs à la machine.
- **`GET /quote` et `GET /openbb/quote` ne démarrent plus de flux temps réel.** Utilisez `POST /realtime/subscribe` ; `subscribe_if_missing=true` reste disponible sur `/quote` pour les clés à accès complet.
- **Les prix sont enregistrés par cotation** (migration 014) : `prices_eod` a pour clé `(asset_listing_id, resolution, time)` et est daté par séance. La migration convertit les lignes existantes ; faites une sauvegarde avant la mise à jour.
- **Les rendements du dividende sont des ratios** partout, y compris les valeurs enregistrées (migration 015).

### Sécurité et exploitation
- Docker Compose charge `.env` et remplace les adresses des services ; PostgreSQL et Redis publiés sur `127.0.0.1` uniquement ; volume de la base monté sur le bon répertoire de données.
- Journal d'utilisation écrit par lots en arrière-plan, sans l'IP de l'appelant par défaut (`USAGE_LOG_IP`), purgé après `USAGE_LOG_RETENTION_DAYS`.
- `POST /database/cleanup` borné (`days_to_keep` ≥ 30) avec un `dry_run`.
- Les entrées du cache Redis sont uniquement en JSON.

### Qualité des données
- Les prix et les fondamentaux d'une cotation sont récupérés avec un **symbole Yahoo vérifié** à partir de l'ISIN et de la devise de la cotation ; une cotation qui n'en a pas n'est pas ingérée, et la réponse en indique la raison.
- Les fournisseurs lisent les chiffres que leurs pages affichent réellement (`financials/numbers.py`) ; les pourcentages sont normalisés avant validation ; une réponse portant sur un autre ISIN est rejetée.
- `/fundamental` construit chaque chiffre à partir de Yahoo, puis des chiffres enregistrés, puis des fournisseurs scrapés, et nomme la source dans une section `Sources`.
- Les états financiers sont lus par exercice (DCF, ratios de solvabilité).
- Chaque paramètre de requête fait partie de sa clé de cache (fondamentaux, actualités, transactions d'initiés, indicateurs techniques par cotation).
- Le taux sans risque enregistré est rafraîchi depuis FRED ; chaque tick temps réel atteint chaque client WebSocket une seule fois.
- La migration 014 attend la fin des jobs TimescaleDB en cours au lieu de provoquer un interblocage avec eux.

### Qualité
- Dépendances verrouillées et vérifiées par hash ; un seuil de couverture par module (70 % au global) ; tests de base de données sur TimescaleDB dans la CI ; garde-fous qui maintiennent `ARCHITECTURE.md` et `AGENTS.md` en phase avec le code.


## v1.6.0 (2026-09)

### Fonctionnalités majeures
- **Intégration OpenBB Workspace** : routeur adaptateur backend natif (`/openbb`) prenant en charge 19 widgets interactifs et 2 tableaux de bord applicatifs pré-assemblés (`Fonrex — EU Markets` & `Fonrex — Screener & Macro`).
- **Authentification par double en-tête** : ajout de la prise en charge de l'en-tête personnalisé natif d'OpenBB `X-API-KEY` en plus de la validation standard du jeton `Authorization: Bearer` (`auth/dependencies.py`).
- **Adaptateurs Plotly & AgGrid** : transformations de données standardisées pour les figures Plotly (graphiques en chandeliers, superpositions d'indicateurs techniques) et les tableaux AgGrid (fondamentaux approfondis, matrice de sensibilité DCF, actualités, composition des indices).

### 🐛 Corrections de bugs & améliorations
- **Journalisation sur volume Docker** : résolution des problèmes de permissions de volume sur les environnements hôtes grâce à l'étape de préparation `mkdir -p logs`, et ajout de guides de dépannage des permissions.
- **Mises à jour du DCF & des fournisseurs** : amélioration de la mise en cache et de la normalisation des données pour les modèles de valorisation DCF et les fournisseurs de composition des indices.

## v2.0.0 (2026-08)


### Fonctionnalités majeures
- **Documentation Docusaurus v3** : structure complète de documentation technique générée sous `documentation/`.
- **Surveillance de la santé des fournisseurs (phase 12)** : mise en œuvre de `ValidationLayer`, `CanaryMonitor`, de l'hypertable TimescaleDB `provider_health_log`, de l'agrégation quotidienne du consensus et de 7 endpoints REST de santé (`/health/*`).
- **Moteur de valorisation & DCF (phase 11)** : intégration des modèles de valeur intrinsèque FCF, EPS et DDM avec calcul dynamique du WACC et matrices de sensibilité (`/dcf/*`).
- **Agrégateur d'actualités (phase 10)** : moteur de scraping multi-fournisseurs (`NewsService`) sur 7 sources avec dédoublonnage `ON CONFLICT (url)` et cache Redis (`/news/*`).
- **Architecture des actifs par ISIN (phase 9)** : refonte du schéma de base des actifs en `assets`, `asset_listings` et `asset_mappings` avec un index unique partiel sur l'ISIN.

### 🐛 Corrections de bugs & refactorisation
- Nettoyage de l'ancien code (`eod/`, `record/`, `seed_assets.py` supprimés).
- Outil autonome de dédoublonnage des ISIN `scripts/clean_isin_duplicates.py`.
- Frontières de concurrence par pool de threads via `concurrency.py`.
