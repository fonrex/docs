---
id: "installation"
title: "Installation Guide"
sidebar_label: "Installation"
description: "How to install and run Fonrex using Docker and Docker Compose"
---

# Installation Guide

This guide walks you through setting up a self-hosted instance of Fonrex using Docker Compose.

## System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Container Runtime**: Docker Engine 24.0+ and Docker Compose v2.20+
- **Minimum System Resources**:
  - CPU: 2 Cores
  - RAM: 4 GB RAM (8 GB recommended for heavy ingestion workloads)
  - Storage: 10 GB SSD space (dependent on historical tick data volume)

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

### 2. Configure Environment Variables

Create your local `.env` configuration file from the template:

```bash
cp .env.example .env
```

Default settings are optimized for local development. For production deployments, update database passwords and secret keys.

### 3. Launch Services via Docker Compose

Run the multi-container stack in detached mode:

```bash
docker compose up -d
```

This starts four services:
- `fonrex-api`: FastAPI backend running on port `5000`
- `fonrex-db`: PostgreSQL 16 with TimescaleDB HA extension on port `5432`
- `fonrex-redis`: Redis 7 in-memory cache on port `6379`
- `fonrex-migrate`: One-shot migration container running `alembic upgrade head`

### 4. Verify System Health

Check that the API and backing services are fully operational:

```bash
curl "http://localhost:5000/health"
```

Expected JSON response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### 5. Import Initial Asset Universe

Seed your local database with financial instruments and listings from CSV data:

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv
```

Your API is now ready to serve financial data!
