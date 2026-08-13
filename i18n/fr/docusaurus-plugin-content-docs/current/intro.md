---
id: "intro"
title: "Introduction à Fonrex"
sidebar_label: "Introduction"
description: "Vue d'ensemble de l'API d'infrastructure de données financières open-source et auto-hébergée Fonrex"
---


# Introduction à Fonrex

Fonrex est une infrastructure FastAPI open-source et auto-hébergée pour les données de marché, les fondamentaux financiers, les indicateurs techniques, l'agrégation d'actualités, la valorisation DCF et le monitoring en temps réel de la santé des providers. Construit sur Python 3.12, PostgreSQL/TimescaleDB et Redis, Fonrex comble le fossé entre les flux financiers institutionnels et les flux de travail développeurs auto-hébergés.

Conçu selon les principes d'architecture hexagonale, Fonrex offre une API robuste pour les analystes quantitatifs, les traders algorithmiques et les applications financières. Il unifie des fournisseurs de données dispersés au sein d'interfaces REST et WebSocket standardisées tout en assurant une validation continue des providers et une logique de fallback.

Fonrex est distribué sous licence open-source **AGPL-3.0**, vous offrant un contrôle total sur votre pipeline de données financières sans verrouillage de limites d'appels API ni modèles de tarification coûteux par requête.

## Fonrex vs. Fournisseurs de Données Financières Commerciaux

| Fonctionnalité | Fonrex Pro | FMP Premium / Commercial APIs |
|---|---|---|
| **Hébergement** | Auto-hébergé (Docker) | Cloud SaaS |
| **Tarification** | Gratuit & Open Source (AGPL-3.0) | $50 – $500+ / month |
| **Stockage des Données** | Hypertables PostgreSQL + TimescaleDB | Géré par le Vendeur |
| **Streaming Temps Réel** | WebSocket Natif + Redis Pub/Sub | Restreint / Surcoût |
| **Fallback Multi-Providers** | Automatisé (14+ Fondamentaux, 7+ News) | Dépendance à un Seul Vendeur |
| **Indicateurs Personnalisés** | 18+ Intégrés + Moteur Custom Pandas-TA | Paramètres API Limités |
| **Valorisation DCF** | Modèles Personnalisés WACC, FCF, EPS & DDM | Boîte Noire / Métriques Statiques |
| **Contrôle Qualité Données** | Consensus Temps Réel & Contrôles Canary Quotidiens | SLA Propriétaire |

## Démarrage Rapide (4 Commandes)

Déployez une instance Fonrex complète avec stockage historique, cache Redis et endpoints API en 4 simples commandes :

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

Vérifiez que votre instance locale est opérationnelle :

```bash
curl http://localhost:5000/health
```

Output:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "alembic_version": "011_provider_monitoring"
}
```
