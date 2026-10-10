---
id: "openbb-workspace"
title: "Connecter Fonrex à OpenBB Workspace"
sidebar_label: "Guide OpenBB Workspace"
description: "Connecter votre instance Fonrex auto-hébergée aux widgets et tableaux de bord d'OpenBB Workspace"
---

# Connecter Fonrex à OpenBB Workspace

[OpenBB Workspace](https://openbb.co) peut utiliser votre instance Fonrex comme backend personnalisé : données fondamentales européennes, valorisations DCF, indicateurs techniques et actualités apparaissent sous forme de widgets OpenBB.

## Prérequis

1. Une instance Fonrex en cours d'exécution, joignable par OpenBB. OpenBB Workspace dans le navigateur (`pro.openbb.co`) appelle votre instance depuis votre navigateur : `http://localhost:5000` fonctionne quand le navigateur tourne sur la même machine ; sinon, exposez l'instance via un tunnel ou votre réseau.
2. Une clé d'API de l'instance. Une clé **en lecture seule** (`FONREX_READ_ONLY_API_KEYS`) suffit pour tous les widgets, et c'est celle qu'il faut utiliser.

## Étape 1 — Ajouter Fonrex comme source de données

1. Dans OpenBB Workspace, faites un clic droit sur le tableau de bord et sélectionnez **Add data** (ou ouvrez les connexions de backend).
2. Saisissez l'URL de votre instance, par exemple `http://localhost:5000` ou `https://myfonrex.share.zrok.io`.
3. OpenBB lit `/widgets.json` et liste les 21 widgets. Ce fichier et `/apps.json` répondent sans clé.

## Étape 2 — Ajouter la clé

Ajoutez un en-tête personnalisé à la connexion :

- **Nom** : `X-API-KEY`
- **Valeur** : `frx_live_...`

Toutes les routes `/openbb/...` l'exigent.

## Étape 3 — Importer les tableaux de bord

`/apps.json` contient deux tableaux de bord :

**Fonrex — EU Markets** — un ticker :
- *Overview* : cours, taux macro, graphique EOD, données fondamentales détaillées, actualités
- *Valuation* : valorisation DCF, comparaison des modèles et matrice de sensibilité
- *Technical* : graphique technique et graphique multi-indicateurs
- *News* : actualités du ticker et flux global
- *Watchlist* : cours en lot
- *Factors* : exposition du ticker aux 5 facteurs Fama/French et rendements des facteurs européens

**Fonrex — Screener & Macro** — découverte :
- *Screener* : screener technique (par exemple RSI < 30)
- *Macro Context* : taux FRED et BCE (USD et EUR) et composants des indices

Importez-les depuis le menu Apps d'OpenBB, ou ajoutez les widgets un par un à votre propre tableau de bord.

## Widgets

| Widget | Nom | Catégorie | Type |
|---|---|---|---|
| `fonrex_fundamentals` | Fonrex Fundamentals | Fundamentals | table |
| `fonrex_fundamentals_deep` | Fonrex Deep Fundamentals | Fundamentals | table |
| `fonrex_insider_transactions` | Fonrex Insider Transactions | Fundamentals | table |
| `fonrex_etf_details` | Fonrex ETF Details | Fundamentals | table |
| `fonrex_eod` | Fonrex EOD History | Historical | chart |
| `fonrex_history` | Fonrex OHLCV History | Historical | chart |
| `fonrex_quote` | Fonrex Quote | Market Data | metric |
| `fonrex_quotes_batch` | Fonrex Batch Quotes | Market Data | table |
| `fonrex_index_constituents` | Fonrex Index Constituents | Market Data | table |
| `fonrex_technical` | Fonrex Technical Indicator | Technical | chart |
| `fonrex_technical_multi` | Fonrex Multi-Indicator | Technical | chart |
| `fonrex_technical_chart` | Fonrex Technical Chart | Technical | chart |
| `fonrex_screener` | Fonrex Technical Screener | Technical | table |
| `fonrex_news` | Fonrex News | News | table |
| `fonrex_news_feed` | Fonrex News Feed | News | table |
| `fonrex_dcf` | Fonrex DCF Valuation | Valuation | table |
| `fonrex_dcf_compare` | Fonrex DCF Models Comparison | Valuation | table |
| `fonrex_dcf_sensitivity` | Fonrex DCF Sensitivity Matrix | Valuation | table |
| `fonrex_macro_rates` | Fonrex Macro Rates | Macro | metric |
| `fonrex_factor_exposure` | Fonrex Factor Exposure | Factors | table |
| `fonrex_factor_returns` | Fonrex Factor Returns | Factors | chart |

Les routes correspondantes sont listées dans la [référence de l'API OpenBB](../api-reference/openbb.md).

## Bon à savoir

- **Cours** : le widget de cours ne démarre jamais de flux temps réel. Il affiche le prix en temps réel une fois le ticker abonné (`POST /realtime/subscribe` avec une clé à accès complet), et sinon le prix différé de Yahoo Finance.
- **Les prix et les indicateurs** ont besoin des prix du ticker en base de données ; le widget EOD les ingère à la première utilisation.
- **Le DCF** a besoin des données fondamentales détaillées du ticker : ouvrez d'abord le widget de données fondamentales détaillées.
- **L'exposition aux facteurs** a besoin des prix journaliers du ticker (`POST /historical/ingest`, ou ouvrez d'abord le widget EOD) ; les fichiers de facteurs et les cours de change de la BCE sont téléchargés à la première utilisation.

## Dépannage

- **Connexion refusée** : vérifiez `docker compose ps` et qu'OpenBB peut joindre l'URL.
- **401 / 403** : l'en-tête `X-API-KEY` est absent ou ne correspond à aucune clé de votre `.env` (redémarrez l'API après l'avoir modifié).
- **Erreur CORS** : le navigateur appelle votre instance depuis l'origine OpenBB. `OPENBB_ALLOWED_ORIGIN` (par défaut `https://pro.openbb.co`) liste les origines autorisées, séparées par des virgules.
