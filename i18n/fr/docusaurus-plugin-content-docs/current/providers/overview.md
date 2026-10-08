---
id: "overview"
title: "Vue d'ensemble de l'architecture des fournisseurs"
sidebar_label: "Vue d'ensemble"
description: "Comment Fonrex interroge ses fournisseurs en parallèle, choisit le terme de recherche, valide les valeurs et partage une seule couche HTTP"
---

# Vue d'ensemble de l'architecture des fournisseurs

Fonrex collecte des données depuis des sources publiques au moyen de **fournisseurs** : 14 pour les données fondamentales, 4 spécialisés, 7 pour les actualités, plus Yahoo Finance et TradingView pour les prix. Tous s'exécutent dans votre instance, depuis votre adresse IP (ou votre proxy).

## Une requête `/fundamental`

```
GET /fundamental?ticker=AIR.PA
      │
      ▼
GetFundamentals  ── listing, ISIN, mappings, verified Yahoo symbol
      │
      ▼
FinancialProviderRunner.run()  ── all providers in parallel (12 s each)
      │      ZoneBourse, GoogleFinance, Boursorama, Barrons, WSJ, MarketWatch,
      │      MorningStar, Investing, Gurufocus, Fortuneo, BourseDirect, MSN,
      │      InvestirLesEchos, YahooFinance  (+ SEC EDGAR insider data, 15 s max)
      ▼
ValidationLayer.validate_results()  ── range and consensus checks, outliers → None
      ▼
FinancialsFormatter.to_eodhd()  ── each figure: Yahoo → stored figures → scraped providers
      ▼
JSON document with a Sources section (cached 1 hour)
```

## Le terme de recherche de chaque fournisseur

L'exécuteur donne à chaque fournisseur l'identifiant le plus fiable dont il dispose, dans cet ordre :

1. Pour Yahoo Finance, le **symbole vérifié de la cotation** (à partir de l'ISIN, coté dans la devise de la cotation). Une cotation qui n'en a pas n'est pas envoyée à Yahoo : son ticker seul peut désigner un autre instrument.
2. Pour Google Finance, le ticker construit à partir de la place de marché de la cotation (`EPA:AIR`) ; pour Gurufocus, le ticker avec son suffixe Yahoo (`AIR.PA`).
3. Une correspondance `provider_url` active, puis une correspondance `provider_ticker` active.
4. L'ISIN, pour les fournisseurs qui recherchent par ISIN (ZoneBourse, Investing, WSJ, MarketWatch, Fortuneo, BourseDirect, Boursorama, Gurufocus, InvestirLesEchos).
5. Le ticker demandé.

Le terme utilisé est indiqué par fournisseur dans `raw_providers` (`fmt=raw`).

## Résilience

- **Fournisseurs indépendants.** Un fournisseur qui échoue ou dépasse son délai renvoie une entrée d'erreur ; les autres répondent.
- **Homonymes rejetés.** Un fournisseur scrapé qui répond avec un autre ISIN que celui de l'instrument est signalé comme une erreur, et non fusionné.
- **Valeurs validées.** La [couche de validation](../monitoring/validation-layer.md) écarte les valeurs hors plage et les valeurs aberrantes au regard du consensus avant la construction du document.
- **Une seule couche HTTP.** Chaque fournisseur passe par `BaseFinancialProvider` : trois tentatives avec des pauses croissantes sur les erreurs réseau et les 429/5xx, échec définitif sur 401/403/404, au plus `FONREX_PROVIDER_MAX_CONCURRENCY` requêtes simultanées par fournisseur, proxy facultatif (`FONREX_PROXY_URL`, limité à certains fournisseurs avec `FONREX_PROXY_PROVIDERS`).

## Quand un site web refuse vos requêtes

Les sites web protégés par un service anti-bot refusent de plus en plus les requêtes provenant d'une connexion personnelle (typiquement `403`). Le fournisseur signale alors une erreur et les autres répondent. Faites passer ces fournisseurs par le proxy HTTP de votre choix :

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
```

Le proxy s'applique aux sites web scrapés, pas aux bibliothèques `yfinance` et TradingView.

## Pages associées

- [Fournisseurs de données fondamentales](fundamentals-providers.md)
- [Fournisseurs d'actualités](news-providers.md)
- [Ajouter un fournisseur](../guides/adding-providers.md)
