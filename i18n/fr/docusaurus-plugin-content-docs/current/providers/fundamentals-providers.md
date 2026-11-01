---
id: "fundamentals-providers"
title: "Liste des fournisseurs de données fondamentales"
sidebar_label: "Fournisseurs de données fondamentales"
description: "Les fournisseurs interrogés par /fundamental et les fournisseurs spécialisés"
---

# Liste des fournisseurs de données fondamentales

## Fournisseurs de `/fundamental`

Ces noms sont les clés de la réponse et les valeurs acceptées par le paramètre `provider` (sans distinction de casse).

| Fournisseur | Source | Recherché par | Région |
|---|---|---|---|
| `YahooFinance` | Yahoo Finance (bibliothèque `yfinance`) | Symbole vérifié de la cotation | Monde |
| `ZoneBourse` | zonebourse.com | ISIN | Europe |
| `Boursorama` | boursorama.com | ISIN | France / Europe |
| `Fortuneo` | fortuneo.fr | ISIN | France |
| `BourseDirect` | boursedirect.fr | ISIN | France |
| `InvestirLesEchos` | investir.lesechos.fr | ISIN | France |
| `GoogleFinance` | google.com/finance | Ticker avec la place de marché de la cotation (`EPA:AIR`) | Monde |
| `Msn` | msn.com/money | Ticker | Monde |
| `MorningStar` | Services JSON de Morningstar (screener et `sal-service`) | ISIN, ou ticker sur la place de son suffixe | Monde |
| `Investing` | investing.com | ISIN | Monde |
| `Barrons` | barrons.com | Ticker | États-Unis |
| `wallStreetJournal` | wsj.com | ISIN | États-Unis |
| `Marketwatch` | marketwatch.com | ISIN | États-Unis |
| `Gurufocus` | gurufocus.com | Ticker avec le suffixe de la place (`AIR.PA`), sinon ISIN | Monde |

Une correspondance active de la cotation (`provider_url`, puis `provider_ticker`) prime sur l'ISIN ou le ticker ; MSN reçoit le ticker résolu à partir de l'ISIN quand la requête nomme un ISIN. Chaque fournisseur renvoie un objet `FinancialMetrics` (PER, BPA, rendement du dividende, marges, chiffre d'affaires, résultat net, score ESG, scores Gurufocus…). Certains publient des pourcentages affichés : ils sont déclarés dans `monitoring/units.py` et convertis avant la validation.

Dans le document rendu, la réponse de Yahoo et les données fondamentales détaillées stockées passent en premier ; les fournisseurs scrapés ne complètent que le PER courant, le BPA et le rendement du dividende quand ils manquent (Google Finance, Barron's, MarketWatch, WSJ, Investing.com). La réponse de chaque fournisseur reste disponible avec `fmt=raw`.

Jetons facultatifs : `BARRONS_TOKEN`, `MARKETWATCH_TOKEN`, `WSJ_TOKEN`.

### Ce que lisent certains fournisseurs {#what-some-providers-read}

- **MorningStar** ne lit jamais la page de cours de global.morningstar.com (remplie par JavaScript, elle répond à un script par un défi AWS WAF). Le screener de Morningstar transforme un ISIN, ou un ticker envoyé sans son suffixe Yahoo, en identifiant d'une action (`0P0000OQN8`) : seule une action dont l'ISIN est celui demandé, ou dont le ticker l'est, sur la place indiquée par le suffixe (`AIR.PA` est Paris, jamais AAR Corp à New York). Trois services sont ensuite lus en parallèle : la vue d'ensemble (cours, capitalisation, volumes, P/S, P/B, PE, rendements du dividende, étoiles), le profil de la société (secteur, industrie, effectif) et les informations de négociation (bêta, actions, vente à découvert). Les chiffres réservés aux abonnés sont écartés. Les clés publiques du site sont intégrées ; `MORNINGSTAR_SAL_API_KEY` et `MORNINGSTAR_SAL_REALTIME_TOKEN` les remplacent seulement si Morningstar les change (HTTP 401/403).
- **Gurufocus** lit la page de synthèse d'une action (`/stock/TSLA/summary`, `/stock/XPAR:AIR/summary`) : GF Score (`/100`), Piotroski F-Score (`/9`), Beneish M-Score, Altman Z-Score, ROIC, PE, marges nette et opérationnelle, dette sur capitaux propres, BPA et chiffre d'affaires des douze derniers mois. Chaque chiffre vient de la ligne dont le libellé renvoie à sa définition, jamais du premier nombre de la page ; les scores et le ROIC sont contrôlés par des plages. Quand le badge du GF Score est dessiné dans le navigateur, le score est lu dans l'état de la page écrit par le serveur, sur l'action elle-même et jamais sur un concurrent.
- **ZoneBourse** lit la page de cours trouvée par sa recherche : nom, ISIN, secteur, dernier cours et devise, consensus des analystes, nombre d'analystes et objectif de cours, effectif, note ESG MSCI, capitalisation, valeur d'entreprise, VE/CA, flottant, chiffre d'affaires, résultat net et dette nette. Le PER, le chiffre d'affaires, le résultat net, la dette nette et VE/CA sont des estimations de l'exercice en cours.
- **Investing** lit la page de l'action en anglais (`www.investing.com`) ou en français (`fr.investing.com`, virgule décimale) : cours, variation, devise, et les chiffres clés (PE, BPA, dividende, capitalisation, chiffre d'affaires, résultat net, EBITDA, P/B, ROA, ROE, marge brute, bêta, plage sur 52 semaines) ainsi que l'industrie, le secteur et l'effectif.

## Fournisseurs spécialisés

| Fournisseur | Source | Route |
|---|---|---|
| `SECEdgar` | SEC EDGAR, Form 4 | `/insider-transactions/{ticker}`, et la section `InsiderTransactions` de `/fundamental` pour les actions américaines |
| `JustETF` | justetf.com | `/etf/{isin}/details` |
| `IndexConstituents` | Wikipedia | `/index/{index_name}/constituents` |
| `OpenFIGI` | openfigi.com | Chargé, utilisé par aucune route aujourd'hui |
| `Treasury` | home.treasury.gov, courbes de taux « par » quotidiennes | `/macro/treasury/curve`, `/macro/treasury/series`, et le taux sans risque américain du DCF quand FRED n'en donne pas |
| `CFTC` | cftc.gov, rapports hebdomadaires Commitments of Traders (Legacy, TFF, Disaggregated) | `/cot/markets`, `/cot/positions`, `/cot/signals`, `/cot/extremes` |
| `ESEF` | filings.xbrl.org (rapports annuels ESEF des sociétés cotées européennes) et GLEIF (LEI d'un ISIN) | `/esef/{ticker}/statements`, `/esef/{ticker}/check`, `/esef/{ticker}/filings` |

## Santé

Chaque fournisseur de données fondamentales est vérifié tous les jours par le [moniteur canary](../monitoring/canary-monitor.md) ; `GET /health/providers` en affiche le résultat. Un fournisseur qui ne peut pas être importé au démarrage est listé dans `providers.unavailable` de `GET /health`.
