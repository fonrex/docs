---
id: "changelog"
title: "Journal des versions de Fonrex"
sidebar_label: "Journal des modifications"
description: "Historique du projet, ajouts de fonctionnalités, migrations de schéma et mises à jour de version"
---

# Journal des versions de Fonrex

## Prochaine version {#next-release}

### Prix {#prices}
- **`close` est de nouveau la clôture négociée**, ajustée des splits seulement ; **`adj_close`** est ajusté des splits et des dividendes. Avant, les deux contenaient le prix ajusté des dividendes.
- **Un seul ajustement par série.** Un split ou un dividende après la dernière ingestion laissait un faux rendement là où les barres enregistrées et les nouvelles se rejoignaient (environ moins le rendement du dividende, -75 % après un split de 4 pour 1). L'ingestion compare maintenant les dernières barres enregistrées avec la source et récupère de nouveau toute la série quand elles diffèrent. La migration 016 ajoute `price_series_adjustments` ; les séries enregistrées avant sont récupérées de nouveau à leur prochaine ingestion (`scripts/ingest_all.py --force` pour toutes d'un coup).
- **Paramètre `isin`** sur `GET /eod/{ticker}`, `GET /ticker/{symbol}/history` et `POST /historical/ingest` : désigne l'instrument quand plusieurs partagent un ticker. Les réponses donnent la `listing` qu'elles ont lue.

### Taux en euros et devise de la valorisation {#euro-rates-and-currency-of-the-valuation}
- **Le DCF actualise avec le taux sans risque de la devise des états financiers** : FRED pour l'USD, le taux AAA de la zone euro de la BCE pour l'EUR, `DCF_RISK_FREE_RATE` sinon. Une société en euros n'est plus actualisée avec le taux américain. La réponse donne `price_currency`, `warnings` et `wacc.risk_free_rate_currency`.
- **Un cours dans une autre devise ne donne aucun potentiel** au lieu d'un potentiel faux ; un cours en pence est converti en livres. Chaque modèle donne maintenant son propre `upside_pct` (il valait toujours 0).
- **`GET /macro/rates?currency=`** : les taux de la BCE (AAA 10 ans, taux de dépôt, CISS) à côté du taux FRED ; chaque taux indique sa `source`, sa `currency` et sa `freshness`. Le widget macro d'OpenBB affiche une carte par série.
- L'enrichissement enregistre la **devise des états financiers** (migration 018) et lit les dates de Yahoo en secondes (migration 019 : plus de 1970-01-01).
- **`AIR.PA` est Airbus, jamais AAR Corp** : un ticker cherché sans son suffixe ne désigne qu'une cotation sur la place du suffixe. Le cache de `/fundamental/deep` est tenu par instrument.

### Facteurs Fama/French {#famafrench-factors}
- **Rendements des facteurs** de la Kenneth French Data Library : États-Unis, Europe et marchés développés, 3 facteurs, 5 facteurs et momentum, mensuels et journaliers, en dollars US (`GET /factors`, `GET /factors/{dataset}`, `POST /factors/refresh`, `scripts/load_factors.py` ; migration 020).
- **Exposition d'une cotation aux facteurs** : `GET /factors/exposure/{ticker}` régresse ses rendements excédentaires sur les facteurs de sa région (`ff3`, `ff5`, `carhart`) : bêtas, t-stats, alpha annualisé, R².
- **Cours de change de la BCE** de l'euro, jour par jour depuis 1999, pour comparer en dollars une cotation dans une autre devise (`fx_rates`, `scripts/load_fx_rates.py` ; migration 021).
- **Coût des fonds propres à partir des facteurs** dans le DCF : `wacc_params.cost_of_equity_model` = `ff3`, `ff5` ou `carhart` sur `POST /dcf/{ticker}`. Le CAPM reste le défaut.
- Deux **widgets OpenBB** : exposition aux facteurs et rendements des facteurs, dans un nouvel onglet *Factors* de l'app EU Markets.

### Indicateurs Eurostat
- **Inflation, chômage, croissance du PIB et enquêtes de conjoncture** de la zone euro et de chaque pays de l'UE, depuis Eurostat (gratuit, sans clé) : `GET /macro/indicators` (dernières valeurs avec la variation sur la période précédente), `GET /macro/indicators/{indicator}` (séries de 10 pays au plus), `POST /macro/indicators/refresh`. Voir [Indicateurs macro](../api-reference/macro-indicators.md).
- Conservés période par période dans `macro_observations` (migration 022) ; une révision d'Eurostat, comme le chiffre définitif après une estimation flash de l'inflation, remplace la valeur de sa période. Nouveaux réglages `EUROSTAT_REFRESH_HOURS` et `EUROSTAT_API_URL`.
- Deux **widgets OpenBB** : les indicateurs d'un pays en cartes, et un indicateur de plusieurs pays en graphique, dans l'onglet *Macro Context* de l'app Screener & Macro.

### Dépôts SEC (XBRL) {#sec-filings-xbrl}
- **Les états annuels déposés auprès de la SEC**, lus dans les faits XBRL d'EDGAR (gratuit, sans clé) : `GET /sec/{ticker}/statements` donne chaque chiffre avec son concept XBRL et un lien vers son dépôt. Rapports 10-K, 20-F et 40-F seulement ; un retraitement remplace la valeur qu'il corrige. Voir [Dépôts SEC](../api-reference/sec-filings.md).
- **Les états Yahoo vérifiés par rapport à la SEC** : `GET /sec/{ticker}/check` donne, année par année, `match`, `mismatch`, `missing_yahoo` ou `missing_sec` pour chaque chiffre que les deux sources définissent de la même façon. `POST /sec/{ticker}/refresh` relit une société tout de suite.
- **Le CIK n'est jamais deviné à partir d'un ticker** : seule une cotation américaine de l'instrument est recherchée, et le nom à la SEC doit correspondre. `AIR.PA` (Airbus) n'est jamais confondu avec `AIR` (AAR Corp).
- Faits gardés dans `xbrl_facts` et `sec_company_loads` (migration 023). Nouveaux réglages `SEC_XBRL_REFRESH_HOURS` et `SEC_CHECK_TOLERANCE` ; un avertissement au démarrage tant que `SEC_EDGAR_EMAIL` est l'adresse de l'exemple.
- Un **widget OpenBB** : *Fonrex SEC Check*, la vérification en tableau, les écarts en premier.

### Courbes de taux du Trésor américain {#us-treasury-yield-curves}
- **Les courbes de taux quotidiennes du Trésor américain**, fichiers gratuits sans clé : la courbe nominale depuis 1990 (1 mois à 30 ans) et la courbe réelle (TIPS) depuis 2003 (5 à 30 ans). Voir [Courbes de taux du Trésor](../api-reference/treasury-curves.md).
- `GET /macro/treasury/curve` donne la courbe d'un jour avec le **point mort d'inflation** et des comparaisons avec d'autres jours (`compare=1M`, `1Y` ou une date) ; `GET /macro/treasury/series` les maturités et les **écarts** (`10Y-2Y`) dans le temps ; `POST /macro/treasury/refresh` et `scripts/load_treasury_curve.py` lisent des années à la demande.
- Conservées jour par jour dans `yield_curve_points` (migration 024) : une année n'est lue que si une requête en a besoin, une année passée lue après sa fin plus jamais, l'année en cours après `TREASURY_REFRESH_HOURS` (nouveau réglage, 12 par défaut).
- **Le taux sans risque américain du DCF sans clé FRED** : quand FRED ne donne pas de taux, le taux à 10 ans de la courbe du Trésor est utilisé (`treasury_live`, `treasury_cached`, `treasury_stale`) au lieu de `DCF_RISK_FREE_RATE`.
- Deux **widgets OpenBB** (26 au total) : la courbe du jour avec celles d'il y a 1 mois et 1 an, et l'écart 10 ans moins 2 ans, dans l'onglet *Macro Context* de l'app Screener & Macro.

### Commitments of Traders de la CFTC {#cftc-commitments-of-traders}
- **Les rapports hebdomadaires Commitments of Traders de la CFTC**, fichiers gratuits sans clé : Legacy depuis 1986, Traders in Financial Futures et Disaggregated depuis juin 2006, contrats à terme seuls. Les positions des spéculateurs (non-commerciaux, leveraged funds, managed money) et de tous les autres types d'intervenants sur les marchés à terme américains : indices boursiers, taux, devises, matières premières. Voir [Commitments of Traders](../api-reference/cot.md).
- `GET /cot/markets` liste les marchés par code CFTC ; `GET /cot/positions` donne tous les types d'intervenants d'un marché ; `GET /cot/signals` la **position nette**, sa part de l'open interest, sa variation et le **COT index** (0 à 100 sur une fenêtre de semaines) ; `GET /cot/extremes` les positionnements les plus extrêmes des marchés clés ; `POST /cot/refresh` et `scripts/load_cot.py` lisent des années à la demande.
- Chaque date de rapport est accompagnée de son **jour de publication estimé** (le vendredi qui suit), pour des backtests sans anticipation.
- Gardés semaine par semaine dans `cot_weeks` et `cot_positions` (migration 025) : une année n'est lue que quand une requête en a besoin, les années jusqu'en 2016 une seule fois, l'année en cours après `COT_REFRESH_HOURS` (nouveau réglage, 24 par défaut).
- Deux **widgets OpenBB** (28 en tout) : le positionnement d'un marché avec son COT index, et les positionnements les plus extrêmes des marchés clés, dans l'onglet *Macro Context* de l'application Screener & Macro.

### Rapports ESEF (rapports annuels européens) {#esef-filings-european-annual-reports}
- **Les états annuels des sociétés cotées européennes**, lus dans leurs rapports ESEF sur filings.xbrl.org (XBRL International, gratuit, sans clé) : `GET /esef/{ticker}/statements` donne chaque chiffre avec son concept IFRS et un lien vers le rapport dans la visionneuse. Voir [Rapports ESEF](../api-reference/esef-filings.md).
- **Les états Yahoo vérifiés par rapport au rapport annuel** : `GET /esef/{ticker}/check`, avec les règles de la vérification SEC (`match`, `mismatch`, `missing_yahoo`, `missing_esef`). `GET /esef/{ticker}/filings` liste les rapports et ce que leur lecture a trouvé ; `POST /esef/{ticker}/refresh` relit une société tout de suite.
- **La société est trouvée par l'ISIN, jamais par le ticker** : GLEIF donne le LEI de l'ISIN, et son nom doit correspondre au nom de l'instrument, formes juridiques mises de côté.
- **Un rapport par période** (une langue, la dernière version), lu une seule fois ; la période de chaque chiffre vient du chiffre lui-même, jamais de l'index (un exercice clos en juin listé au 31 décembre). TotalEnergies publie en dollars américains, et ses chiffres sont en dollars.
- Gardés dans `esef_filings`, `esef_facts` et `esef_entity_loads` (migration 026) ; nouveau réglage `ESEF_REFRESH_HOURS` ; `scripts/load_esef.py` lit les rapports de toutes les actions du catalogue. La correspondance IFRS connaît désormais `RevenueFromContractsWithCustomers`, ainsi que le `ProfitLoss` et l'`Equity` d'un groupe sans intérêts minoritaires.
- Un **widget OpenBB** (29 en tout) : *Fonrex ESEF Check*, la vérification sous forme de tableau, les écarts en premier.
- filings.xbrl.org indique que son index n'est pas complet : aucun rapport de société allemande n'y figure.

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
