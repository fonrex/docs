---
id: "architecture-rules"
title: "架构规则与指南"
sidebar_label: "架构规则"
description: "AGENTS.md 中的贡献规则以及保障每条规则的测试"
---

# 架构规则与指南

仓库根目录下的 `AGENTS.md` 是所有贡献（无论是人工还是自动化的）都须遵守的约定。每条规则都由一个测试保障：违反任意一条都会导致 `make ci` 失败。

| # | 规则 | 保障测试 |
|---|---|---|
| 1 | **只有一个 HTTP 层。** 数据提供方从不自行创建 HTTP 客户端；它使用 `financials/providers/base.py` 中的辅助函数，重试、暂停、并发限制和代理都在那里实现 | `tests/test_provider_http_policy.py` |
| 2 | **配置真实有效。** 使用 `settings.py` 中的辅助函数读取配置；`.env.example` 中的每个变量都会被代码读取；无效值会回退到默认值并给出警告 | `tests/test_env_settings.py` |
| 3 | **文档如实反映代码。** `README.md` 中的数字与代码一致；`ARCHITECTURE.md` 中的表格列出了所有路由、迁移和模块 | `tests/test_docs_consistency.py` |
| 4 | **数据提供方要么成功加载，要么失败可见**（`PROVIDER_SPECS`、`/health`） | `tests/test_docs_consistency.py` |
| 5 | **单位必须声明**，位于 `monitoring/units.py` | `tests/test_provider_units.py` |
| 6 | **覆盖率下限只升不降**，每个数据提供方一个 | `tests/test_coverage_gate.py` |
| 7 | **默认安全。** 除非声明为公开，否则每个路由都需要密钥；会修改内容的路由绝不能是 `GET` | `tests/test_auth_defaults.py` |
| 8 | **Docker 镜像是自包含的**；`.env` 绝不会被打包进去 | `tests/test_docker_image.py` |
| 9 | **使用日志从不拖慢响应**；除非明确要求，否则不存储 IP | `tests/test_usage_recorder.py` |
| 10 | **测试中不访问真实网络**（`fake_network`、保存的页面） | `tests/conftest.py` |
| 11 | **版本锁定**（`requirements*.lock`，带哈希校验） | `tests/test_dependency_lock.py` |
| 12 | **价格属于上市品种**：键为 `(asset_listing_id, resolution, time)`，交易日日期取 UTC 午夜，代码由 `database/price_series.py` 解析 | `tests/test_price_series.py` |
| 13 | **数据源代码经过验证，绝不猜测**（`historical/yahoo_symbols.py`） | `tests/test_yahoo_symbols.py` |
| 14 | **显示的数字在同一处读取**（`financials/numbers.py`） | `tests/test_numbers.py` |
| 15 | **渲染出的数据注明其来源**（`/fundamental` 的 `Sources`） | `tests/test_financials_formatter.py` |
| 16 | **从 Redis 读取的内容绝不执行，删除操作绝不无边界**（JSON 缓存，带 `dry_run` 的有界清理） | `tests/test_cache_service.py`, `tests/test_database_cleanup.py` |
| 17 | **CI 在与实际安装相同的数据库上测试**（相同的 TimescaleDB 镜像） | `tests/test_ci_workflow.py` |
| 18 | **财务报表按财年读取**（`financials/fiscal_years.py`） | `tests/test_fiscal_years.py` |
| 19 | **缓存键包含所有会改变响应的参数** | `tests/test_cache_keys.py` |

## 分层

- `routers/` 解析请求，并将应用错误转换为 HTTP 状态码。
- `use_cases/` 依赖于 `use_cases/ports.py` 中的端口，从不依赖 FastAPI、SQLAlchemy 或某个数据提供方。
- 阻塞代码通过 `concurrency.run_sync()` 调用。

参见[分层与端口](../architecture/hexagonal.md)。

## 身份

- 切勿把代码当作全局标识符：`SPFF` 在某个目录中是以 EUR 计价的债券 ETF，而在 Yahoo 上是一只美国基金。应解析出上市品种（代码、交易所、货币），并使用为其验证过的代码。
- 切勿用后备值或静默的 `except` 掩盖失败：应报告缺失某项内容的原因（`reason`、`note`、`warnings`）。
