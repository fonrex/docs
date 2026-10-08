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
| `MorningStar` | morningstar | Ticker | Monde |
| `Investing` | investing.com | ISIN | Monde |
| `Barrons` | barrons.com | Ticker | États-Unis |
| `wallStreetJournal` | wsj.com | ISIN | États-Unis |
| `Marketwatch` | marketwatch.com | ISIN | États-Unis |
| `Gurufocus` | gurufocus.com | Ticker avec le suffixe de la place (`AIR.PA`), sinon ISIN | Monde |

Une correspondance active de la cotation (`provider_url`, puis `provider_ticker`) prime sur l'ISIN ou le ticker ; MSN reçoit le ticker résolu à partir de l'ISIN quand la requête nomme un ISIN. Chaque fournisseur renvoie un objet `FinancialMetrics` (PER, BPA, rendement du dividende, marges, chiffre d'affaires, résultat net, score ESG, scores Gurufocus…). Certains publient des pourcentages affichés : ils sont déclarés dans `monitoring/units.py` et convertis avant la validation.

Dans le document rendu, la réponse de Yahoo et les données fondamentales détaillées stockées passent en premier ; les fournisseurs scrapés ne complètent que le PER courant, le BPA et le rendement du dividende quand ils manquent (Google Finance, Barron's, MarketWatch, WSJ, Investing.com). La réponse de chaque fournisseur reste disponible avec `fmt=raw`.

Jetons facultatifs : `BARRONS_TOKEN`, `MARKETWATCH_TOKEN`, `WSJ_TOKEN`.

## Fournisseurs spécialisés

| Fournisseur | Source | Route |
|---|---|---|
| `SECEdgar` | SEC EDGAR, Form 4 | `/insider-transactions/{ticker}`, et la section `InsiderTransactions` de `/fundamental` pour les actions américaines |
| `JustETF` | justetf.com | `/etf/{isin}/details` |
| `IndexConstituents` | Wikipedia | `/index/{index_name}/constituents` |
| `OpenFIGI` | openfigi.com | Chargé, utilisé par aucune route aujourd'hui |

## Santé

Chaque fournisseur de données fondamentales est vérifié tous les jours par le [moniteur canary](../monitoring/canary-monitor.md) ; `GET /health/providers` en affiche le résultat. Un fournisseur qui ne peut pas être importé au démarrage est listé dans `providers.unavailable` de `GET /health`.
