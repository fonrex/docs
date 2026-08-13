---
id: "setup"
title: "开发环境搭建"
sidebar_label: "开发搭建"
description: "如何搭建本地 Python 虚拟环境、安装开发依赖项及运行测试"
---


# 开发环境搭建

本指南说明了如何搭建用于参与 Fonrex 贡献的本地开发环境。

## Prerequisites

- **Python 3.12**
- **Docker & Docker Compose**
- **Git**

## 循序渐进搭建步骤

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
