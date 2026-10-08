---
id: "production-checklist"
title: "Liste de contrôle du déploiement en production"
sidebar_label: "Liste de contrôle production"
description: "Vérifications de sécurité, de configuration, de surveillance et de sauvegarde avant d'exposer une instance"
---

# Liste de contrôle du déploiement en production

## Sécurité
- [ ] `FONREX_API_KEY` défini avec une clé aléatoire (`echo "frx_live_$(openssl rand -hex 24)"`) ; `FONREX_AUTH_REQUIRED` laissé à `true`.
- [ ] Des clés en lecture seule (`FONREX_READ_ONLY_API_KEYS`) pour chaque client extérieur à la machine : Google Sheets, tableaux de bord, OpenBB.
- [ ] `POSTGRES_PASSWORD` modifié avant le premier démarrage.
- [ ] PostgreSQL et Redis publiés sur `127.0.0.1` uniquement (par défaut) ; l'API accessible uniquement via le reverse proxy.
- [ ] TLS sur le reverse proxy, upgrade WebSocket transmis pour `/ws/`.
- [ ] `USAGE_LOG_IP` à `none` ou `truncated`.
- [ ] `.env` et les dumps de la base jamais commités.

## Configuration
- [ ] `SEC_EDGAR_EMAIL` défini avec votre propre adresse de contact.
- [ ] `WEB_CONCURRENCY=1`.
- [ ] `FRED_API_KEY` défini si vous utilisez le DCF.
- [ ] Un proxy (`FONREX_PROXY_URL`) pour les sites qui refusent l'IP de votre serveur, si besoin.

## Données
- [ ] Instruments importés (`import_assets.py`) et prix ingérés (`scripts/ingest_all.py`).
- [ ] `POST /database/cleanup` jamais exécuté avec le `days_to_keep` par défaut (730), sauf si vous voulez supprimer huit des dix années ingérées : comptez d'abord avec `dry_run`.
- [ ] Sauvegarde quotidienne par `pg_dump` de toute la base, restauration testée au moins une fois.

## Surveillance
- [ ] `/health` répond, `providers.unavailable` est vide.
- [ ] `/health/providers` rempli après la première exécution du canari (06:00 UTC par défaut).
- [ ] Alertes critiques vérifiées régulièrement : `GET /health/alerts?severity=critical`.
- [ ] Health check du conteneur au vert : `docker compose ps`.
