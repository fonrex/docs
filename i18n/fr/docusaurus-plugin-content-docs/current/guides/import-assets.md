---
id: "import-assets"
title: "Guide du pipeline d'import CSV d'actifs"
sidebar_label: "Importer des actifs"
description: "Importer des instruments et des cotations depuis des fichiers CSV avec import_assets.py"
---

# Guide du pipeline d'import CSV d'actifs

`import_assets.py` charge des instruments et leurs cotations depuis des fichiers CSV dans le catalogue. Il est idempotent : importer deux fois un fichier met à jour les lignes au lieu de les dupliquer.

## Format CSV

```csv
name,ticker,isin,productType,currency
Airbus SE,AIR.PA,NL0000235190,STOCK,EUR
Apple Inc,AAPL,US0378331005,STOCK,USD
Apple Inc,APC.DE,US0378331005,STOCK,EUR
iShares Core MSCI World UCITS ETF,EUNL.DE,IE00B4L5Y983,ETF,EUR
```

| Colonne | Règle |
|---|---|
| `name` | Non vide |
| `ticker` | 20 caractères au maximum |
| `isin` | 12 caractères, `[A-Z]{2}[A-Z0-9]{10}` |
| `productType` | `STOCK` ou `ETF` |
| `currency` | 3 lettres majuscules |

Les lignes sont dédupliquées sur `(isin, ticker, currency)`. La place de marché d'une cotation est déduite du suffixe du ticker (`AIR.PA` → `XPAR`, `BMW.DE` → `XETR`) ; un ticker sans suffixe n'a pas de place de marché.

L'image fournit deux catalogues : `data/etf.csv` et `data/stocks.csv`.

## Ce que l'import écrit

```
CSV file
  │ parse_csv(): validation, deduplication
  ▼
AssetImporter.run()  — batches of 200 rows
  ├─ one row of assets per ISIN
  ├─ one row of asset_listings per (instrument, ticker, exchange, currency)
  └─ default mappings: YahooFinance and GoogleFinance
```

- La première cotation d'un instrument est sa cotation **principale** ; tant qu'aucune n'est principale, une cotation en USD, GBP, JPY, CHF, CAD ou AUD le devient.
- L'import n'effectue **aucun appel réseau**. La correspondance Yahoo Finance qu'il écrit est le ticker du fichier, non vérifié : la première ingestion ou la première requête de données fondamentales sur la cotation la remplace par le symbole Yahoo vérifié à partir de l'ISIN et de la devise.

## Commandes

```bash
# One file
docker compose exec fonrex-api python import_assets.py --file data/etf.csv

# Simulation, nothing written
docker compose exec fonrex-api python import_assets.py --file data/etf.csv --dry-run

# Every CSV file of a directory
docker compose exec fonrex-api python import_assets.py --dir data/isin_data

# Without --file or --dir: data/etf.csv and data/stocks.csv
docker compose exec fonrex-api python import_assets.py
```

Options : `--batch-size` (lignes par transaction, 200), `--verbose`.

Un simple nom de fichier est recherché dans `data/isin_data/`, puis dans le dossier de l'application ; un chemin relatif ou absolu est utilisé tel quel.

## Enrichissement depuis Yahoo Finance

L'enrichissement détaillé (chiffres clés, états financiers, résultats, recommandations des analystes) est une étape distincte :

```bash
# One instrument
docker compose exec fonrex-api python import_assets.py --enrich-only --isin US0378331005

# The instruments of a file
docker compose exec fonrex-api python import_assets.py --enrich-only --file data/etf.csv --limit 100
```

`--enrich-only` a besoin de `--isin` ou de `--file`. Yahoo est interrogé avec le symbole vérifié de la cotation principale ; un instrument sans symbole vérifié est ignoré et le journal en indique la raison. `GET /fundamental/deep?ticker=...&refresh=true` fait de même pour un instrument via l'API.

`make db-seed` importe le catalogue par défaut et l'enrichit (`scripts/seed_database.py --enrich`).

## Supprimer les doublons d'ISIN

Les bases de données créées avant la règle d'unicité des ISIN peuvent contenir deux fois le même ISIN. `scripts/clean_isin_duplicates.py` les fusionne sur la ligne la plus ancienne :

```bash
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --diagnose-only   # read only
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --dry-run         # run, then roll back
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --create-index    # clean + unique index
```

## Étape suivante

Ingérez les prix des cotations importées : voir [Ingérer des données historiques](ingest-historical-data.md).
