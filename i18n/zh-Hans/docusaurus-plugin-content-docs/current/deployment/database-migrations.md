---
id: "database-migrations"
title: "生产环境中的数据库迁移"
sidebar_label: "数据库迁移"
description: "安全地升级实例：备份、迁移、检查，必要时恢复"
---

# 生产环境中的数据库迁移

API 容器每次启动时都会执行 `alembic upgrade head`。因此，升级 Fonrex 也就意味着升级 Schema：请事先做好准备。

## 升级步骤

1. **备份数据库**：

   ```bash
   docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex-$(date +%F).dump
   ```

2. **更新代码**：`git pull`。
3. **单独执行迁移**（可选，以便在 API 启动之前查看迁移的执行情况）：

   ```bash
   docker compose --profile migrate build fonrex-migrate
   docker compose --profile migrate run --rm fonrex-migrate
   ```

4. **启动新版本**：`docker compose up -d --build`。
5. **检查**：`docker compose logs fonrex-api` 会显示已应用的迁移，然后执行 `curl http://localhost:5000/health`，并使用你的密钥发送几个请求。落后于代码的数据库会导致其相关路由返回 `503`。

## 回滚

使用上一版本的代码恢复第 1 步中的备份（参见 [Docker Compose](../getting-started/docker-compose.md#backing-up-the-database)）。建议优先采用这种方式，而不是 `alembic downgrade`：有些降级无法还原升级时删除的内容（迁移 008 会删除表；迁移 014 在回退时每个金融工具和日期只保留一根 K 线）。

## 值得注意的迁移

| 迁移 | 须知事项 |
|---|---|
| 014 — 按上市品种存储价格 | 以每个上市品种一个序列的方式重建 `prices_eod`，并将现有 K 线重新标注为其交易日日期。自动运行；不会重新下载任何数据。如果之后某个序列看起来有误：`POST /historical/ingest?ticker=<ticker>&force_refresh=true` |
| 015 — 股息率改为比率 | 将已存储的股息率从百分比转换为比率 |

完整列表见 [Schema 迁移](../architecture/migrations.md)。

## 测试迁移

数据库测试会在真实的 TimescaleDB 上、基于已有数据应用迁移，先降级再升级：

```bash
make test-db     # throwaway container of the image of docker-compose.yml, port 54329
```

如需针对你自己的服务器运行（会创建并删除一个临时数据库）：

```bash
FONREX_TEST_DATABASE_URL=postgresql://fonrex:<password>@localhost:5432/fonrex \
    pytest tests/test_timescale_integration.py
```
