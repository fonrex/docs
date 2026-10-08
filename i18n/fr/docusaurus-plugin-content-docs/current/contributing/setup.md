---
id: "setup"
title: "Mise en place de l'environnement de développement"
sidebar_label: "Environnement de dev"
description: "Exécuter Fonrex depuis les sources avec des dépendances verrouillées, une base locale et le contrôle qualité"
---

# Mise en place de l'environnement de développement

## Prérequis

- Python 3.12
- Docker et Docker Compose (base de données et Redis)
- Git, et `make`

## 1. Cloner et créer un environnement virtuel

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

## 2. Installer les dépendances verrouillées

```bash
make install-dev
```

Cette commande installe `requirements-dev.lock` : des versions exactes, chacune vérifiée par rapport à son hash, soit les mêmes paquets que l'image Docker et la CI. Après avoir modifié `requirements*.txt`, rafraîchissez les verrous avec `make lock` (nécessite `uv`) ; ne modifiez jamais les fichiers `.lock` à la main.

## 3. Démarrer la base de données et Redis

```bash
cp .env.example .env              # set FONREX_API_KEY
docker compose up -d db redis
```

Les deux sont publiés sur `127.0.0.1` : les adresses `localhost` de `.env.example` les atteignent donc.

## 4. Migrer et lancer l'API

```bash
alembic upgrade head
make run                          # uvicorn --reload on port 5000, loads .env
```

La documentation interactive se trouve à `http://localhost:5000/docs`.

Pour exécuter plutôt votre copie de travail dans Docker, sans reconstruire à chaque modification :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 5. Lancer le contrôle qualité

```bash
make ci
```

Voir [Tests](testing.md). Avant d'ouvrir une pull request, lisez les [Règles d'architecture](architecture-rules.md) : chaque règle est garantie par un test. Les titres de pull request suivent Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`), avec un sujet en minuscules.
