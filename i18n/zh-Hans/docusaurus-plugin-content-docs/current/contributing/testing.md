---
id: "testing"
title: "测试指南与执行"
sidebar_label: "测试指南"
description: "质量门禁、数据库测试，以及如何在无网络的情况下测试数据提供方"
---

# 测试指南与执行

## 质量门禁

```bash
make ci
```

`make ci` 就是 GitHub Actions 在每个 pull request 以及每次推送到 `main` 时运行的内容：

| 步骤 | 命令 | 拦截内容 |
|---|---|---|
| Lint | `make lint`（Ruff） | 严格的 Ruff 违规 |
| 类型注解 | `make typecheck` | 所列模块中未标注类型的边界 |
| 语法 | `make syntax` | 无法编译的 Python 文件 |
| 迁移 | `make migration-check` | 存在多于一个 Alembic head |
| 测试与覆盖率 | `make test-cov` | 失败的测试、警告（`PYTHONWARNINGS=error`）、全局覆盖率低于 70 %、某个模块低于其自身下限 |

覆盖率下限按模块列在 `scripts/check_coverage_distribution.py` 中，包括每个数据提供方；没有设置下限的数据提供方会导致门禁失败。下限只升不降。

## 运行测试

```bash
PYTHONPATH=. pytest                                   # everything
PYTHONPATH=. pytest tests/test_technical_indicators.py -v
PYTHONPATH=. pytest -k "cache_key"
```

测试套件从不与真实服务通信：`tests/conftest.py` 会清除你 shell 中的凭据，将 Redis 和数据库指向不可达的地址，并使任何真实的 Yahoo 查询失败。

## 数据库测试

`tests/test_timescale_integration.py` 在真实的 TimescaleDB 上运行真实的迁移：现有价格的迁移、压缩超表、upsert、清理、降级与升级，以及一个等待 TimescaleDB 作业的迁移。没有服务器时这些测试会被跳过。

```bash
make test-db     # throwaway container of the image of docker-compose.yml, port 54329
```

也可以针对任意 TimescaleDB 服务器运行——每次运行都会创建并删除自己的数据库：

```bash
FONREX_TEST_DATABASE_URL=postgresql://user:password@127.0.0.1:5432/postgres make ci
```

CI 在一个与 `docker-compose.yml` 使用相同镜像的 `timescaledb` 服务上运行这些测试。

## 编写测试

- **不访问真实网络。** 数据提供方测试使用 `fake_network` fixture（`tests/conftest.py`）：每个 `httpx` 请求都由预设的响应应答，没有预设响应的请求会导致测试失败。
- **真实页面。** 解析器在 `tests/fixtures/providers/` 中真实页面的精简副本上进行测试。
- **缓存键。** 某个路由新增参数时，需要添加一个测试，发送仅在该参数上不同的两个请求（`tests/test_cache_keys.py`）。
- **按财年组织的报表。** 在按补全流程的存储方式存储的数据行上测试计算：每个财年三行。
- **测试在没有修复时必须失败。** 通过撤销一次改动来验证这一点。

有些守护测试会读取文档：`tests/test_docs_consistency.py` 将 `ARCHITECTURE.md` 中的表格（路由、迁移、模块、缓存有效期、金丝雀资产）以及 `README.md` 中的数字与代码进行比较。
