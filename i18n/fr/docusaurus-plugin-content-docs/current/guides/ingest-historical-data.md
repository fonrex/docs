---
id: "ingest-historical-data"
title: "Ingestion de Données Historiques de Marché"
sidebar_label: "Ingérer des Données Historiques"
description: "Guide pour les backfills historiques quotidiens, la détection de lacunes et la CLI d'ingestion globale"
---


# Ingestion de Données Historiques de Marché

Ce guide explique comment Fonrex gère l'ingestion des données historiques EOD, la détection des lacunes temporelles, les fallbacks et les backfills globaux.

## Le Pipeline d'Ingestion (`HistoricalIngestionService`)

Lorsqu'une tâche d'ingestion est déclenchée (via l'API ou la CLI), `HistoricalIngestionService` exécute 7 étapes :

1. **Listing Resolution**: Maps the requested ticker to its canonical asset ID and exchange listing.
2. **Gap Detection**: Queries `prices_eod` to find missing date ranges. If data exists up to yesterday, ingestion is skipped (`status: up_to_date`).
3. **Extraction Principale**: Récupère de façon asynchrone les bougies quotidiennes OHLCV depuis Yahoo Finance.
4. **Extraction de Fallback**: Si Yahoo Finance échoue ou retourne des bougies incomplètes, le système bascule de façon transparente vers un bridge WebSocket TradingView.
5. **Normalisation des Bougies**: Valide les prix positifs, corrige les limites haut/bas inversées et nettoie les dates manquantes.
6. **Batch Upsert**: Exécute des instructions PostgreSQL natives `INSERT ... ON CONFLICT (time, asset_id) DO UPDATE` par lots de 1 000 bougies.
7. **Invalidation du Cache**: Scanne et purge toutes les clés de cache historique Redis pour le ticker.

## Ingérer Tous les Tickers via la CLI

To backfill historical data for every financial asset stored in your database, run the `scripts/ingest_all.py` CLI utility:

```bash
docker compose exec fonrex-api python scripts/ingest_all.py
```

### Options

```bash
# Limit to 50 assets with 8 parallel concurrency workers
docker compose exec fonrex-api python scripts/ingest_all.py --limit 50 --concurrency 8

# Force re-ingestion of existing date ranges
docker compose exec fonrex-api python scripts/ingest_all.py --force
```
