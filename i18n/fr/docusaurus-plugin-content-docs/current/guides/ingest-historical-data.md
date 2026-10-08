---
id: "ingest-historical-data"
title: "Ingérer des données de marché historiques"
sidebar_label: "Ingérer l'historique"
description: "Comment Fonrex récupère, vérifie et stocke les cours de clôture par cotation"
---

# Ingérer des données de marché historiques

Les prix sont stockés par **cotation** (ticker + place de marché + devise), par résolution et par séance. Une cotation est ingérée :

- automatiquement, la première fois que `GET /eod/{ticker}` ne trouve rien de stocké pour la requête ;
- à la demande, avec `POST /historical/ingest` ou `POST /historical/ingest/bulk` ;
- pour tout le catalogue, avec `scripts/ingest_all.py`.

## Le pipeline

`HistoricalIngestionService` exécute ces étapes :

1. **Série** — le ticker désigne une cotation : la cotation qui porte ce ticker (la principale en premier ; `currency` ou `exchange` en choisissent une autre), sinon la cotation préférée de l'instrument. Un instrument sans cotation ne peut pas être ingéré.
2. **Détection des trous** — sans barre stockée, dix ans sont récupérés ; quand la dernière séance stockée est aujourd'hui ou hier, la cotation est `up_to_date` ; sinon, seuls les jours manquants sont récupérés. Un `from_date` antérieur à la première barre stockée récupère aussi la partie la plus ancienne.
3. **Symbole source** — le ticker de votre catalogue n'est pas toujours un symbole Yahoo (`EUCO` est `SYBC.DE` sur Yahoo, et `SPFF` seul est un fonds américain). Fonrex interroge Yahoo par **ISIN**, retient la première ligne cotée dans la **devise de la cotation** et dotée d'un prix, et l'enregistre comme symbole vérifié de la cotation. Une cotation pour laquelle rien ne correspond n'est pas récupérée depuis Yahoo, et n'est pas recherchée à nouveau pendant 24 heures.
4. **Récupération** — Yahoo Finance avec le symbole vérifié ; TradingView en solution de repli, accepté uniquement quand la ligne est cotée dans la devise de la cotation. Les prix sont ajustés des splits et des dividendes ; chaque barre est datée de sa séance.
5. **Normalisation** — barres sans prix écartées, plus haut/plus bas inversés corrigés, volume négatif mis à zéro, dates en double écartées.
6. **Upsert** — lots de 1 000 lignes, `ON CONFLICT (asset_listing_id, resolution, time) DO UPDATE`. Avec `force_refresh`, les barres stockées de la plage récupérée sont remplacées.
7. **Cache** — les réponses en cache calculées à partir des prix du ticker (`eod`, `history`, `technical`, `dcf`) sont supprimées.
8. **Journal** — une ligne dans `ingest_log` : statut, source, lignes ajoutées, plage, durée, erreur.

## Quand un ticker n'obtient aucun prix, ou un mauvais prix

Le résultat de l'ingestion en donne la raison :

```json
{
  "ticker": "GOVY",
  "status": "failed",
  "error": "No Yahoo symbol quoted in CHF for ISIN IE00B3S5XW04; Yahoo offers SYBB.DE (EUR)"
}
```

- **Plusieurs cotations partagent le ticker** : nommez celle que vous voulez, `POST /historical/ingest?ticker=GOVY&currency=CHF`.
- **Quel symbole a été utilisé** : `provider_symbol` dans le résultat ; `note` indique pourquoi TradingView a été utilisé au lieu de Yahoo.
- **Rechercher à nouveau le symbole, ou remplacer une ancienne série** : `POST /historical/ingest?ticker=<ticker>&force_refresh=true`.
- **Définir vous-même le symbole** quand vous connaissez la bonne ligne (on lui fait alors confiance tel quel) :

```bash
docker compose exec -T db psql -U fonrex -d fonrex -c "
  INSERT INTO asset_mappings (asset_id, asset_listing_id, provider_name, provider_ticker,
                              source, is_active, failure_count, created_at, updated_at)
  SELECT l.asset_id, l.id, 'YahooFinance', 'GOVY.SW', 'manual', true, 0, now(), now()
  FROM asset_listings l WHERE l.ticker = 'GOVY' AND l.currency = 'CHF'
  ON CONFLICT (asset_listing_id, provider_name)
  DO UPDATE SET provider_ticker = EXCLUDED.provider_ticker, source = 'manual', is_active = true"
```

## Ingérer tout le catalogue

```bash
docker compose exec fonrex-api python scripts/ingest_all.py
```

| Option | Défaut | Description |
|---|---|---|
| `--resolution` | `1D` | `1D`, `1W` ou `1M` |
| `--source` | `auto` | `auto`, `yfinance` ou `tradingview` |
| `--force` | désactivé | Récupère à nouveau tout l'historique (sans détection des trous) |
| `--concurrency` | `5` | Ingestions parallèles |

Une courte pause aléatoire précède chaque ticker pour ne pas surcharger les sources.

## Conserver ou supprimer les anciens prix

Une première ingestion récupère dix ans. `POST /database/cleanup` supprime les prix plus anciens que `days_to_keep` jours, **730 par défaut**, ce qui effacerait huit de ces dix ans. Comptez d'abord avec `dry_run` :

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"days_to_keep": 3650, "dry_run": true}' http://localhost:5000/database/cleanup
```

## Mise à niveau depuis les séries partagées (migration 014)

Avant la migration 014, les cotations d'un même instrument partageaient une seule série, et les séances européennes ou asiatiques étaient datées de la veille. La migration reconstruit `prices_eod` par cotation et redate les lignes existantes ; rien n'est à retélécharger. Si une série semble fausse ensuite, remplacez-la avec `force_refresh=true`. Sauvegardez la base de données avant la mise à niveau.
