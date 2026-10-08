---
id: "setup"
title: "开发环境搭建"
sidebar_label: "开发环境"
description: "使用锁定的依赖、本地数据库和质量门禁从源码运行 Fonrex"
---

# 开发环境搭建

## 前提条件

- Python 3.12
- Docker 和 Docker Compose（用于数据库和 Redis）
- Git 和 `make`

## 1. 克隆仓库并创建虚拟环境

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

## 2. 安装锁定的依赖

```bash
make install-dev
```

该命令安装 `requirements-dev.lock`：精确版本，每个包都经过哈希校验——与 Docker 镜像和 CI 使用的包完全相同。编辑 `requirements*.txt` 之后，使用 `make lock` 刷新锁文件（需要 `uv`）；切勿手动编辑 `.lock` 文件。

## 3. 启动数据库和 Redis

```bash
cp .env.example .env              # set FONREX_API_KEY
docker compose up -d db redis
```

二者都发布在 `127.0.0.1` 上，因此 `.env.example` 中的 `localhost` 地址可以访问它们。

## 4. 执行迁移并运行 API

```bash
alembic upgrade head
make run                          # uvicorn --reload on port 5000, loads .env
```

交互式文档位于 `http://localhost:5000/docs`。

如果想改为在 Docker 中运行你的工作副本，且每次修改后无需重新构建：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 5. 运行质量门禁

```bash
make ci
```

参见[测试](testing.md)。提交 pull request 之前，请阅读[架构规则](architecture-rules.md)：每条规则都由一个测试保障。Pull request 标题遵循 Conventional Commits（`feat`、`fix`、`docs`、`chore`、`refactor`、`perf`、`test`），主题使用小写。
