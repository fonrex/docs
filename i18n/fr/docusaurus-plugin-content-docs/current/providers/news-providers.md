---
id: "news-providers"
title: "Fournisseurs de l'agrégateur d'actualités"
sidebar_label: "Fournisseurs d'actualités"
description: "Les 7 fournisseurs d'actualités, leurs correspondances et la déduplication des articles"
---

# Fournisseurs de l'agrégateur d'actualités

`NewsService` (`news/news_service.py`) interroge en parallèle les sept fournisseurs de `news/providers/` pour `GET /news/{ticker}`.

| Module | Source | Méthode | Langue |
|---|---|---|---|
| `yfinance_news.py` | Yahoo Finance | `yfinance` (`ticker.news`), ticker tel que saisi | `en` |
| `google_finance_news.py` | Google Finance | JSON intégré, HTML en solution de repli | Déduite du suffixe du ticker |
| `zonebourse_news.py` | ZoneBourse | HTML | `fr` |
| `boursorama_news.py` | Boursorama | HTML | `fr` |
| `investing_news.py` | Investing.com | HTML, nécessite une correspondance | `en` |
| `marketwatch_news.py` | MarketWatch | HTML | `en` |
| `msn_finance_news.py` | MSN Finance | Endpoint JSON, HTML en solution de repli | `en` |

## Correspondances

Trois fournisseurs lisent une correspondance de l'instrument, par nom de fournisseur en minuscules : ZoneBourse (`zonebourse`) et Boursorama (`boursorama`) partagent la correspondance du fournisseur de données fondamentales du même nom ; Investing.com a besoin d'une correspondance nommée `investing_com` et ne renvoie rien sans elle. Les quatre autres construisent leur requête à partir du ticker.

## Déduplication

1. **URL** : mise en minuscules, suppression des paramètres `utm_*`, du fragment et de la barre oblique finale ; le premier article reçu est conservé.
2. **Titre** : `difflib.SequenceMatcher` sur les titres normalisés (minuscules, sans ponctuation) ; à partir de `NEWS_DEDUP_SIMILARITY` (0,85), l'article le plus récent est conservé.

Avec `language`, les articles dont la langue est connue et différente sont supprimés avant la déduplication. Les articles sont triés du plus récent au plus ancien et tronqués à `limit` ; chaque fournisseur est sollicité pour deux fois ce nombre.

## Stockage

Les articles des instruments présents dans le catalogue sont insérés ou mis à jour dans `news_articles` (`ON CONFLICT (url) DO UPDATE`) ; `GET /news/feed` et `GET /news/stats` lisent cette table. Les anciens articles ne sont pas purgés automatiquement.

Un fournisseur en échec renvoie une liste vide sans bloquer les autres.
