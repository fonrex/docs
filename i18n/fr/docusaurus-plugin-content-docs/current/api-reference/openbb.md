---
id: "openbb"
title: "API d'Intégration OpenBB Workspace"
sidebar_label: "Intégration OpenBB"
description: "Référence d'API pour les adaptateurs OpenBB Workspace, la découverte de widgets, les applications pré-assemblées et l'authentification"
---

# API d'Intégration OpenBB Workspace

Fonrex fournit des points de terminaison backend natifs conçus pour **OpenBB Workspace** (Desktop et Cloud). Le routeur `/openbb` transforme les modèles du domaine financier de Fonrex en contrats de schéma stricts requis par les widgets OpenBB :

- **Tuiles de métriques** (`type: "metric"`) : `[ { "label": "...", "value": ..., "delta": ... } ]`
- **Graphiques Plotly** (`type: "chart"`) : Objet JSON de figure `Plotly.js` `{ "data": [...], "layout": {...} }`
- **Tableaux de données** (`type: "table"`) : Liste d'enregistrements `[ { ... }, { ... } ]` pour AgGrid

---

## Authentification

OpenBB Workspace prend en charge l'authentification par en-tête personnalisé pour les connexions backend REST. Fonrex valide les identifiants via une double extraction :

| Méthode | En-tête (Header) | Exemple d'utilisation |
|---|---|---|
| **En-tête API Key (Recommandé)** | `X-API-KEY: frx_live_...` | En-tête personnalisé natif configuré dans OpenBB Workspace |
| **Jeton Bearer** | `Authorization: Bearer frx_live_...` | Clients HTTP standards & requêtes curl |

> **Remarque** : Les deux formats d'en-tête utilisent la même logique de validation sous-jacente. Si l'authentification est activée sur votre instance, définissez `OPENBB_API_KEY` ou `FONREX_API_KEY` dans votre fichier `.env`.

---

## Points de Découverte et d'Applications

### Découvrir les Widgets Disponibles

```http
GET /openbb/widgets.json
```

Renvoie le manifeste complet des 19 widgets interactifs fournis par votre instance Fonrex. OpenBB Workspace interroge automatiquement ce point de terminaison lors de l'ajout de Fonrex comme source de données personnalisée.

### Récupérer les Applications Pré-assemblées

```http
GET /openbb/apps.json
```

Renvoie les configurations d'applications pré-assemblées pour OpenBB Workspace, incluant :
1. **Fonrex — EU Markets** : Tableau de bord d'analyse par ticker (onglets Aperçu, Évaluation, Analyse Technique, Actualités).
2. **Fonrex — Screener & Macro** : Tableau de bord de recherche d'idées (Screener technique et contexte macroéconomique FRED).

---

## Points de Terminaison des Données

### Métriques (`type: "metric"`)

#### Métrique de Cotation en Temps Réel
```http
GET /openbb/quote/{ticker}
```
Renvoie un instantané du prix en temps réel, la variation en %, le volume et le plus haut/plus bas du jour sous forme de tuiles de métriques.

#### Taux d'Intérêt Macroéconomiques
```http
GET /openbb/macro/rates
```
Renvoie les taux d'intérêt et rendements macroéconomiques actuels (intégration de l'API FRED) sous forme de tuiles de métriques.

---

### Graphiques (`type: "chart"`)

#### Graphique en Chandeliers EOD
```http
GET /openbb/eod/{ticker}?period=1y&order=a
```
Renvoie l'historique des prix OHLCV journaliers sous forme de figure Plotly avec fonctionnalités d'ingestion automatique.

#### Historique des Bougies d'un Ticker
```http
GET /openbb/ticker/{symbol}/history?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&interval=1D
```
Renvoie les bougies historiques filtrées sous forme de graphique Plotly.

#### Graphique d'Indicateur Technique Simple
```http
GET /openbb/technical/{ticker}?indicator=rsi&period=14
```
Renvoie la série temporelle d'un indicateur technique sous forme de graphique linéaire Plotly.

#### Graphique Multi-Indicateurs
```http
GET /openbb/technical/{ticker}/multi?indicators=sma_20,ema_50,rsi_14
```
Renvoie plusieurs indicateurs techniques superposés dans une seule figure Plotly.

#### Graphique Technique Superposé
```http
GET /openbb/technical/{ticker}/chart?indicators=sma_20,rsi_14
```
Renvoie l'historique des prix en chandeliers avec lignes d'indicateurs et sous-graphiques superposés.

---

### Tableaux de Données (`type: "table"`)

#### Données Fondamentales Multi-Fournisseurs
```http
GET /openbb/fundamental?ticker=AAPL
```
Aplatit les métriques fondamentales multi-fournisseurs (PER, ROE, Rendement du dividende, Capitalisation) sous forme de tableau.

#### États Financiers Approfondis & ESG
```http
GET /openbb/fundamental/deep?ticker=AAPL&sections=all
```
Renvoie les états financiers, scores ESG, consensus des analystes et transactions d'initiés.

#### Tableau de Cotations en Lot (Batch)
```http
GET /openbb/quotes?tickers=AAPL,MSFT,SAP.DE
```
Renvoie les instantanés de prix en temps réel pour plusieurs tickers sous forme de tableau structuré.

#### Évaluation Intrinsèque DCF
```http
GET /openbb/dcf/{ticker}
```
Renvoie les résultats d'évaluation DCF (modèles Cash-Flow Libre, BPA et Actualisation des Dividendes).

#### Comparaison des Modèles DCF
```http
GET /openbb/dcf/{ticker}/compare
```
Renvoie une analyse comparative côte à côte des 3 modèles DCF.

#### Matrice de Sensibilité DCF
```http
GET /openbb/dcf/{ticker}/sensitivity?model=fcf&wacc_min=0.06&wacc_max=0.16&growth_min=0.01&growth_max=0.05
```
Renvoie la grille de sensibilité WACC × taux de croissance terminal.

#### Tableau du Screener Technique
```http
GET /openbb/technical/screen?indicator=rsi&operator=lt&value=30
```
Filtre les instruments correspondant aux seuils d'indicateurs et renvoie les résultats sous forme de tableau.

#### Tableau d'Actualités Agrégées
```http
GET /openbb/news/{ticker}?limit=20
```
Renvoie les actualités financières dédoublonnées issues de 7 sources intégrées pour un ticker.

#### Flux d'Actualités Global
```http
GET /openbb/news/feed?limit=20
```
Renvoie les articles du flux d'actualités financières mondiales.

#### Transactions d'Initiés
```http
GET /openbb/insider_transactions/{ticker}?limit=20
```
Renvoie les transactions d'initiés du formulaire SEC Form 4 (actions US).

#### Détails des ETF
```http
GET /openbb/etf/{isin}/details
```
Renvoie les métadonnées de l'ETF UCITS, la taille du fonds, le frais de gestion (TER), la composition et la répartition sectorielle.

#### Composants des Indices
```http
GET /openbb/index/{index_name}/constituents
```
Renvoie la liste des entreprises composant les principaux indices (`sp500`, `cac40`, `nasdaq100`, `dax`).
