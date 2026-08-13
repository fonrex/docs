---
id: "setup"
title: "Configuration de l'Environnement de Développement"
sidebar_label: "Config Dev"
description: "Configuration d'un environnement virtuel Python local, installation des dépendances dev et exécution des tests"
---


# Configuration de l'Environnement de Développement

Ce guide explique comment configurer un environnement de développement local pour contribuer à Fonrex.

## Prérequis

- **Python 3.12**
- **Docker & Docker Compose**
- **Git**

## Configuration Étape par Étape

### 1. Forker et Cloner le Dépôt

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

### 2. Créer l'Environnement Virtuel

```bash
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Installer les Dépendances

Install main and development dependencies:

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. Démarrer les Services Locaux (Base de Données & Redis)

Start PostgreSQL and Redis in Docker while developing python code locally:

```bash
docker compose up -d fonrex-db fonrex-redis
```

### 5. Exécuter les Migrations de Base de Données

Apply migrations to your local test database:

```bash
alembic upgrade head
```

### 6. Exécuter le Serveur FastAPI en Mode Reload

```bash
uvicorn main:app --reload --port 5000
```

Access local interactive API docs at `http://localhost:5000/docs`.
