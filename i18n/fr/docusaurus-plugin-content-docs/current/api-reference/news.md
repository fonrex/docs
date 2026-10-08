---
id: "news"
title: "Référence API Agrégateur d'actualités"
sidebar_label: "Actualités"
description: "Les actualités d'un ticker issues de 7 fournisseurs, dédoublonnées, et le flux global des articles enregistrés"
---

# Référence API Agrégateur d'actualités

`GET /news/{ticker}` interroge sept fournisseurs en parallèle (Yahoo Finance, Google Finance, ZoneBourse, Boursorama, Investing.com, MarketWatch et MSN Finance), supprime les doublons et enregistre dans `news_articles` les articles des instruments présents dans le catalogue. Voir [Fournisseurs d'actualités](../providers/news-providers.md).

---

## <span className="api-method get">GET</span> `/news/{ticker}`

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker (ex. `AIR.PA`) |
| `limit` | integer | `20` | Nombre d'articles renvoyés (au plus `NEWS_MAX_LIMIT`, 100) |
| `language` | string | — | Ne garder que cette langue (`en`, `fr`…) ; les articles de langue inconnue sont conservés. `all` signifie aucun filtre |
| `force_refresh` | boolean | `false` | Ignorer la réponse en cache |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/news/AIR.PA?limit=5&language=fr"
```

```json
{
  "ticker": "AIR.PA",
  "isin": "NL0000235190",
  "count": 1,
  "providers": ["boursorama"],
  "cached": false,
  "articles": [
    {
      "title": "Airbus : livraisons en hausse en septembre",
      "summary": "...",
      "url": "https://www.boursorama.com/bourse/actualites/...",
      "image_url": null,
      "source": "Boursorama",
      "provider": "boursorama",
      "author": null,
      "published_at": "2026-10-08T07:45:00Z",
      "related_tickers": [],
      "language": "fr"
    }
  ]
}
```

Chaque réponse est mise en cache 30 minutes (`NEWS_CACHE_TTL`), séparément pour chaque `limit` et chaque langue. Un fournisseur en échec ne renvoie rien sans bloquer les autres.

### Dédoublonnage

1. **URL** : minuscules, paramètres `utm_*`, fragment et barre oblique finale supprimés. Le premier article reçu est conservé.
2. **Similarité des titres** : `difflib.SequenceMatcher` sur les titres normalisés ; à partir de `NEWS_DEDUP_SIMILARITY` (0.85), l'article le plus récent est conservé.

Les articles sont ensuite triés du plus récent au plus ancien et tronqués à `limit` (chaque fournisseur est interrogé pour le double de ce nombre).

---

## <span className="api-method get">GET</span> `/news/feed`

Les derniers articles enregistrés dans `news_articles`, tous instruments confondus. Rien n'est récupéré auprès des fournisseurs.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `limit` | integer | `50` | Nombre d'articles renvoyés |
| `language` | string | — | Filtre de langue (`all` = aucun) |
| `tickers` | string | — | Tickers séparés par des virgules ; conserve les articles liés à l'un d'eux |

```json
{ "count": 0, "from_date": null, "to_date": null, "articles": [] }
```

---

## <span className="api-method post">POST</span> `/news/{ticker}/refresh`

Récupérer à nouveau les actualités d'un ticker en arrière-plan et répondre immédiatement : `{"status": "queued", "ticker": "AIR.PA"}`. Clé à accès complet uniquement.

---

## <span className="api-method get">GET</span> `/news/stats`

```json
{
  "total_articles": 0,
  "by_provider": {},
  "by_language": {},
  "last_fetched_at": null,
  "top_assets": {}
}
```
