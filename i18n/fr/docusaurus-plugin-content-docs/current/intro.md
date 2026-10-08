---
id: "intro"
title: "Introduction à Fonrex"
sidebar_label: "Introduction"
description: "Présentation de Fonrex, l'API de données financières open source et auto-hébergée"
---

# Introduction à Fonrex

Fonrex est une API de données financières open source et **auto-hébergée**. Une seule stack Docker Compose (FastAPI, PostgreSQL/TimescaleDB et Redis) collecte et sert les cours de clôture, les cours en temps réel, les données fondamentales, les indicateurs techniques, les actualités et les valorisations DCF, et surveille la qualité des données qu'elle collecte.

Fonrex n'est pas un service hébergé : il n'existe pas d'API cloud Fonrex. Chaque client (vos scripts, Google Sheets, OpenBB Workspace, Zipline) dialogue avec **votre propre instance**. Les données sont scrapées ou récupérées depuis des sources publiques par votre instance, sous votre responsabilité.

Fonrex est distribué sous licence **AGPL-3.0**.

## Ce que vous obtenez

| Domaine | Ce que fournit Fonrex |
|---|---|
| **Prix** | Historique de fin de journée par cotation (Yahoo Finance, TradingView en solution de repli), barres quotidiennes/hebdomadaires/mensuelles, cours en temps réel par WebSocket |
| **Données fondamentales** | Un document au format EODHD construit à partir de Yahoo Finance, des données fondamentales détaillées stockées et de 13 sites web scrapés, avec la source de chaque chiffre |
| **Indicateurs techniques** | 18 indicateurs calculés côté serveur avec pandas-ta, requêtes multi-indicateurs et screener |
| **Valorisation** | DCF avec trois modèles (FCF, EPS, DDM), WACC dynamique, comparaison des modèles et matrice de sensibilité |
| **Actualités** | 7 fournisseurs d'actualités, dédupliquées par URL et par similarité des titres |
| **Qualité des données** | Vérifications de plage et de consensus à chaque requête, exécution quotidienne d'un canary sur des actifs connus, alertes |
| **Intégrations** | Widgets OpenBB Workspace, un modèle Google Sheets, un bundle de données Zipline |

## Fonrex comparé à une API de données commerciale

| | Fonrex | API commerciale de données de marché |
|---|---|---|
| **Hébergement** | Votre machine (Docker) | Cloud du fournisseur |
| **Prix** | Gratuit, open source (AGPL-3.0) | Abonnement mensuel |
| **Stockage** | Votre PostgreSQL + TimescaleDB | Géré par le fournisseur |
| **Temps réel** | Push WebSocket + Redis Pub/Sub | Souvent du polling REST ou une offre payante |
| **Marchés européens** | Natifs (Euronext, Xetra…), ETF UCITS via JustETF | Souvent une offre supérieure |
| **Sources** | Plusieurs fournisseurs par chiffre, source indiquée | Un seul fournisseur |
| **Limites de débit** | Celles des sources publiques que vous interrogez | Quota du fournisseur |

## Démarrage rapide

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
# The API rejects every request until a key is configured:
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
mkdir -p logs
docker compose up -d
```

`/health` répond sans clé :

```bash
curl http://localhost:5000/health
```

```json
{
  "status": "healthy",
  "service": "FonRex API",
  "timestamp": "2026-10-08T16:34:42.235390",
  "yfinance_available": true,
  "providers": { "loaded": 14, "unavailable": [] },
  "cache": { "enabled": true, "status": "connected", "ttl_seconds": { "eod": 86400, "...": "..." } }
}
```

Toutes les autres routes exigent la clé : voir [Installation](getting-started/installation.md) et [Premier appel d'API](getting-started/first-api-call.md).
