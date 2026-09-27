---
id: "openbb-workspace"
title: "Connecter Fonrex à OpenBB Workspace"
sidebar_label: "Guide OpenBB Workspace"
description: "Guide étape par étape pour connecter vos pipelines de données auto-hébergées Fonrex à OpenBB Workspace"
---

# Connecter Fonrex à OpenBB Workspace

[OpenBB Workspace](https://openbb.co) est une plateforme moderne et open-source de terminal financier et de tableaux de bord. Fonrex intègre des adaptateurs natifs qui vous permettent de connecter directement votre instance API auto-hébergée à OpenBB Workspace.

Grâce à cette connexion, vous apportez les données fondamentales des marchés européens, les évaluations DCF, les calculs d'indicateurs techniques personnalisés et les actualités financières multi-sources directement dans votre espace de travail OpenBB (Desktop ou Cloud).

---

## Prérequis

Avant de commencer, assurez-vous de disposer de :

1. Une instance API Fonrex en cours d'exécution (accessible en local sur `http://localhost:5000` ou via un nom de domaine / relay distant).
2. L'application OpenBB Workspace (version Desktop ou interface Web).
3. Si l'authentification est activée sur votre instance (`FONREX_AUTH_REQUIRED=true` ou `OPENBB_API_KEY` défini), munissez-vous de votre clé API (ex: `frx_live_...`).

---

## Guide de Configuration Étape par Étape

### Étape 1 : Ajouter Fonrex comme Source de Données dans OpenBB

1. Ouvrez **OpenBB Workspace**.
2. Faites un clic droit sur votre grille de travail et sélectionnez **"Add data"** (ou ouvrez **Backend Connections** dans les Paramètres).
3. Entrez l'URL backend de votre instance Fonrex :
   - Pour un développement local : `http://localhost:5000`
   - Pour un déploiement distant : `https://votre-instance-fonrex.com`
4. OpenBB Workspace interrogera automatiquement `/openbb/widgets.json` afin de découvrir les 19 widgets disponibles.

### Étape 2 : Configurer les En-têtes d'Authentification

Si votre serveur Fonrex requiert une clé API :

1. Dans la fenêtre de configuration du backend dans OpenBB, ajoutez un en-tête de requête personnalisé :
   - Nom de l'en-tête (Header) : `X-API-KEY`
   - Valeur de l'en-tête : `frx_live_votre_cle_api`
2. Alternativement, le format standard `Authorization: Bearer frx_live_...` est également supporté.
3. Cliquez sur **Save Connection**.

### Étape 3 : Importer les Applications de Tableau de Bord

Fonrex propose deux applications pré-configurées via `/openbb/apps.json` :

#### 1. Fonrex — EU Markets
Une suite d'analyse complète par ticker comprenant :
- **Onglet Aperçu (Overview)** : Instantanés de cotation, données fondamentales approfondies et graphique en chandeliers EOD.
- **Onglet Évaluation (Valuation)** : Calcul de la valeur intrinsèque par modèle DCF et matrice de sensibilité WACC × croissance.
- **Onglet Analyse Technique (Technical)** : Graphiques d'indicateurs techniques superposés (RSI, SMA, MACD).
- **Onglet Actualités (News)** : Flux d'actualités dédoublonnées issues de 7 fournisseurs financiers.

#### 2. Fonrex — Screener & Macro
Un espace de travail pour la génération d'idées et l'analyse contextuelle :
- **Onglet Screener** : Tableau de screener technique en temps réel.
- **Onglet Contexte Macro (Macro Context)** : Taux d'intérêt macroéconomiques majeurs (FRED) et composants des principaux indices (S&P 500, CAC 40, NASDAQ 100, DAX).

Pour importer :
1. Ouvrez le menu **Apps / Marketplace** dans OpenBB.
2. Sélectionnez **"Import App"** et choisissez **Fonrex — EU Markets**.

---

## Tableau Récapitulatif des Widgets

| Widget ID | Nom | Catégorie | Type de Sortie |
|---|---|---|---|
| `fonrex_fundamentals` | Fondamentaux Fonrex | Fundamentals | Tableau |
| `fonrex_fundamentals_deep` | Fondamentaux Approfondis | Fundamentals | Tableau |
| `fonrex_eod` | Historique EOD Fonrex | Historical | Graphique (Plotly) |
| `fonrex_history` | Historique OHLCV | Historical | Graphique (Plotly) |
| `fonrex_quote` | Cotation Temps Réel | Market Data | Métrique |
| `fonrex_quotes_batch` | Cotations en Lot | Market Data | Tableau |
| `fonrex_technical` | Indicateur Technique | Technical | Graphique (Plotly) |
| `fonrex_technical_multi` | Multi-Indicateurs | Technical | Graphique (Plotly) |
| `fonrex_technical_chart` | Graphique Technique Complet | Technical | Graphique (Plotly) |
| `fonrex_screener` | Screener Technique | Technical | Tableau |
| `fonrex_news` | Actualités du Ticker | News | Tableau |
| `fonrex_news_feed` | Flux d'Actualités Global | News | Tableau |
| `fonrex_dcf` | Évaluation DCF | Valuation | Tableau |
| `fonrex_dcf_compare` | Comparaison Modèles DCF | Valuation | Tableau |
| `fonrex_dcf_sensitivity` | Matrice de Sensibilité DCF | Valuation | Tableau |
| `fonrex_insider_transactions` | Transactions d'Initiés | Fundamentals | Tableau |
| `fonrex_etf_details` | Détails ETF | Fundamentals | Tableau |
| `fonrex_index_constituents` | Composants des Indices | Market Data | Tableau |
| `fonrex_macro_rates` | Taux Macroéconomiques | Macro | Métrique |

---

## Dépannage des Problèmes de Connexion

- **Connexion refusée** : Vérifiez via `docker compose ps` que le conteneur `fonrex-api` est bien démarré et que le port `5000` est exposé.
- **Erreurs 401 / 403** : Vérifiez que l'en-tête `X-API-KEY` dans OpenBB correspond à la clé configurée dans le fichier `.env` de Fonrex.
- **Erreurs CORS** : Si vous utilisez OpenBB Web, assurez-vous que votre serveur autorise les requêtes de l'origine OpenBB ou définissez `CORS_ORIGINS=*` dans `.env`.
