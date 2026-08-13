---
id: "setup"
title: "Development Environment Setup"
sidebar_label: "Dev Setup"
description: "How to set up a local Python virtual environment, install dev dependencies, and run tests"
---

# Development Environment Setup

This guide explains how to set up a local development environment for contributing to Fonrex.

## Prerequisites

- **Python 3.12**
- **Docker & Docker Compose**
- **Git**

## Step-by-Step Setup

### 1. Fork and Clone Repository

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

### 2. Create Virtual Environment

```bash
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

Install main and development dependencies:

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. Start Local Backing Services (Database & Redis)

Start PostgreSQL and Redis in Docker while developing python code locally:

```bash
docker compose up -d fonrex-db fonrex-redis
```

### 5. Run Database Migrations

Apply migrations to your local test database:

```bash
alembic upgrade head
```

### 6. Run FastAPI Server in Reload Mode

```bash
uvicorn main:app --reload --port 5000
```

Access local interactive API docs at `http://localhost:5000/docs`.
