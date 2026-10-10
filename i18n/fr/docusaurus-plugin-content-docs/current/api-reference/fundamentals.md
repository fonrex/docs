---
id: "fundamentals"
title: "Référence API Données fondamentales"
sidebar_label: "Fondamentaux"
description: "Fondamentaux multi-fournisseurs au format EODHD et fondamentaux approfondis enregistrés"
---

# Référence API Données fondamentales

Deux routes servent les fondamentaux :

- `GET /fundamental` construit un document à partir de Yahoo Finance, des chiffres enregistrés en base et des fournisseurs scrapés, avec la source de chaque chiffre.
- `GET /fundamental/deep` renvoie ce que l'enrichissement approfondi a enregistré : indicateurs clés, états financiers, historique des résultats et recommandations d'analystes.

Les ratios sont des ratios : un rendement du dividende de 0,32 % vaut `0.0032`.

---

## <span className="api-method get">GET</span> `/fundamental`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker (ex. `AIR.PA`). `ticker` ou `isin` est obligatoire |
| `isin` | string | — | ISIN de l'instrument |
| `exchange` | string | — | Place, pour choisir une cotation |
| `currency` | string | — | Devise, pour choisir une cotation |
| `provider` | string | tous | Un nom de fournisseur, ou plusieurs séparés par des virgules, au lieu de tous |
| `fmt` | string | `eodhd` | `eodhd` (document mis en forme) ou `raw` (la réponse de chaque fournisseur) |
| `nocache` | boolean | `false` | Ignorer la réponse en cache |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/fundamental?ticker=AIR.PA"
```

### Le document mis en forme (`fmt=eodhd`)

| Section | Contenu |
|---|---|
| `General` | Nom, ISIN, place, devise, pays, secteur et industrie, description, adresse, site web |
| `Highlights` | Capitalisation boursière, EBITDA, PER, BPA, rendement du dividende, marges, rentabilités, chiffre d'affaires… |
| `Valuation` | PER courant et prévisionnel, cours/ventes, cours/valeur comptable, ratios de valeur d'entreprise |
| `SharesStats` | Actions en circulation et flottant, détention par les initiés et les institutions, positions vendeuses |
| `Technicals` | Bêta, plus haut et plus bas sur 52 semaines, moyennes mobiles |
| `SplitsDividends` | Montant et rendement du dividende, taux de distribution, dates, dernière division d'actions |
| `AnalystRatings` | Consensus, objectif de cours, nombre de recommandations achat/conserver/vente |
| `Holders`, `InsiderTransactions`, `ESGScores` | Détenteurs, transactions SEC Form 4 (actions américaines), scores ESG |
| `Earnings`, `Financials` | Historique des résultats et états financiers enregistrés |
| `Providers` | Ce que chaque fournisseur a renvoyé |
| `Sources` | La source de chaque chiffre, par ex. `{"Highlights": {"PERatio": "YahooFinance", "PEGRatio": "database (2026-10-01)"}}` |
| `ETF_Data` | Uniquement pour un ETF |

Chaque chiffre est pris, dans cet ordre :

1. dans la réponse Yahoo Finance de cette requête ;
2. dans les chiffres enregistrés par l'enrichissement approfondi, signalés comme `database (date of the fetch)` ;
3. pour le PER courant, le bénéfice par action et le rendement du dividende uniquement, chez les fournisseurs scrapés qui publient la même grandeur (Google Finance, Barron's, MarketWatch, WSJ, Investing.com).

Les estimations pour l'année en cours (Boursorama, ZoneBourse) et les chiffres trimestriels (Google Finance) sont d'autres grandeurs : ils ne servent jamais de repli mais restent disponibles avec `fmt=raw`.

### Quel instrument est interrogé

Pour une cotation de votre catalogue, Yahoo Finance est interrogé avec le **symbole vérifié pour la cotation** (trouvé à partir de l'ISIN et contrôlé par rapport à la devise de la cotation), jamais avec le ticker brut, qui peut désigner un autre instrument chez Yahoo. Sans symbole vérifié, Yahoo n'est pas interrogé et son entrée en indique la raison. Les fournisseurs scrapés sont recherchés par correspondance, ISIN ou ticker ; un fournisseur qui répond sur un autre ISIN est signalé comme une erreur.

Chaque valeur passe par la [couche de validation](../monitoring/validation-layer.md) avant d'être utilisée.

La réponse complète est mise en cache une heure ; `nocache=true` contourne le cache.

---

## <span className="api-method get">GET</span> `/fundamental/deep`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `ticker` / `isin` | string | — | L'instrument (l'un des deux est obligatoire) |
| `refresh` | boolean | `false` | Interroger à nouveau Yahoo Finance au lieu d'utiliser la réponse en cache |
| `sections` | string | `all` | `all`, ou une liste séparée par des virgules parmi `highlights`, `statements`, `earnings`, `ratings` |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/fundamental/deep?ticker=AIR.PA&sections=highlights,ratings"
```

Structure de la réponse :

```json
{
  "asset_profile": { "isin": "NL0000235190", "ticker": "AIR.PA", "name": "Airbus SE", "exchange": "XPAR", "currency": "EUR" },
  "highlights": { "pe_ratio": 28.5, "dividend_yield": 0.0125, "roe": 0.162, "...": "..." },
  "statements": {
    "income":   { "annual": [ { "period_end": "2025-12-31", "...": "..." } ], "quarterly": [] },
    "balance":  { "annual": [], "quarterly": [] },
    "cashflow": { "annual": [], "quarterly": [] }
  },
  "earnings_history": [ { "...": "..." } ],
  "analyst_ratings": { "...": "..." },
  "meta": { "fetched_at": "2026-10-08T16:40:00+00:00", "source": "yfinance", "cache_hit": false, "symbol": "AIR.PA" }
}
```

Les chiffres sont récupérés chez Yahoo Finance avec le symbole vérifié (`meta.symbol`) puis enregistrés. Sans symbole vérifié, rien n'est récupéré : la réponse contient ce que la base détient déjà, `meta.source` vaut `database` et `meta.note` donne la raison. Les réponses complètes sont mises en cache 24 heures par instrument ; une requête ne reçoit que les sections demandées.

---

## Routes historiques

`GET /stocks` (vue d'ensemble du marché) et `GET /stocks/{ticker}/financials` subsistent des versions précédentes. Elles interrogent Yahoo Finance avec le ticker tel que saisi ; préférez `/fundamental`.
