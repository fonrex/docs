---
id: "financial-analyst"
title: "Parcours Analyste financier"
sidebar_label: "Analyste financier"
description: "Données fondamentales avec leurs sources, valorisations DCF, Google Sheets et OpenBB Workspace sur votre propre instance"
---

# Parcours Analyste financier

Ce parcours couvre le volet données fondamentales et valorisation de Fonrex, ainsi que les deux interfaces sans code : Google Sheets et OpenBB Workspace. Toutes lisent **votre propre instance**.

| Besoin | Où |
|---|---|
| Ratios avec leur source | `GET /fundamental` (format EODHD, section `Sources`) |
| États financiers, résultats, recommandations | `GET /fundamental/deep` |
| Valeur intrinsèque | `GET /dcf/{ticker}` (FCF), `/compare` (trois modèles), `/sensitivity` ; `POST /dcf/{ticker}` avec vos hypothèses |
| Feuille de calcul | Modèle Google Sheets |
| Tableaux de bord | Widgets OpenBB Workspace |

## 1. Une instance et une clé

Installez l'instance ([Installation](../getting-started/installation.md)) et créez une **clé en lecture seule** pour les outils qui la conservent hors de votre machine :

```
FONREX_READ_ONLY_API_KEYS=frx_live_<random value>
```

## 2. Données fondamentales

```bash
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/fundamental?ticker=AIR.PA"
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/fundamental/deep?ticker=AIR.PA"
```

`/fundamental` prend chaque chiffre chez Yahoo Finance (interrogé avec le symbole vérifié de la cotation), puis dans les chiffres stockés, puis sur les sites web scrapés, et vous indique d'où vient chacun. Les ratios sont des ratios (`0.0125` pour 1,25 %). Voir [Données fondamentales](../api-reference/fundamentals.md).

## 3. Valorisation

Le DCF lit les données fondamentales détaillées stockées pour l'instrument : appelez d'abord `/fundamental/deep`.

```bash
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/dcf/AIR.PA"
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/dcf/AIR.PA/sensitivity?model=fcf"
curl -s -X POST -H "X-API-KEY: $KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps", "ddm"], "projection_years": 10, "terminal_growth_rate": 0.02}' \
  http://localhost:5000/dcf/AIR.PA
```

`GET /dcf` calcule le modèle FCF ; `/compare` et un `POST` qui demande plusieurs modèles pondèrent FCF, EPS et DDM 50/30/20. WACC issu du CAPM avec le taux à 10 ans de FRED. Voir [Valorisation et DCF](../api-reference/valuation-dcf.md).

## 4. Google Sheets

Le modèle rafraîchit les données fondamentales, le DCF et les indicateurs d'une liste de suivi, et propose `=FONREX_PE()`, `=FONREX_DIVIDEND_YIELD()`, `=FONREX_INTRINSIC_VALUE()` et `=FONREX_RSI()`. Les serveurs de Google joignent votre instance via un tunnel. Voir le [guide Google Sheets](../guides/google-sheets-connector.md).

## 5. OpenBB Workspace

Ajoutez l'URL de votre instance comme source de données, avec votre clé dans l'en-tête `X-API-KEY` : 19 widgets et deux tableaux de bord (EU Markets, Screener & Macro). Voir le [guide OpenBB](../guides/openbb-workspace.md).

:::info
Fonrex affiche des données financières brutes et des résultats analytiques. Il ne constitue pas un conseil en investissement.
:::
