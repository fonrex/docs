---
id: "hexagonal"
title: "分层与端口"
sidebar_label: "分层与端口"
description: "Fonrex 如何区分 HTTP 适配器、应用逻辑和对外适配器，以及各功能遵循这一结构的程度"
---

# 分层与端口

代码按功能组织，每个功能内部分为三个层级：

1. **HTTP 适配器**（`routers/`）——解析请求，调用下一层，将错误转换为 HTTP 状态码。
2. **应用逻辑**——用例（`use_cases/`）或功能服务（`historical/`、`technical/`、`news/`、`valuation/`、`monitoring/`、`macro/`）。
3. **对外适配器**——SQLAlchemy 仓储（`database/`）、Redis（`cache/`）、数据提供方（`financials/providers/`、`news/providers/`、`historical/providers.py`）。

```
┌──────────────── routers/ (FastAPI) ────────────────┐
│  parse request → call use case → map errors        │
└──────────────────────────┬─────────────────────────┘
                           ▼
┌──────── use_cases/ — depends on ports only ────────┐
│  GetFundamentals, GetDeepFundamentals, GetQuote…   │
│  use_cases/ports.py: repository, cache, providers  │
└──────────────────────────┬─────────────────────────┘
                           ▼ implemented by
┌──── database/, cache/, financials/providers/ ──────┐
│  SQLAlchemy, Redis, HTTP                           │
└────────────────────────────────────────────────────┘
```

## 各功能遵循的程度

| 功能 | 路由器 | 应用逻辑 | 是否位于端口之后？ |
|---|---|---|---|
| 基本面 | `routers/fundamentals.py` | `use_cases/fundamentals.py` | 是（`use_cases/ports.py`） |
| 专项数据提供方 | `routers/specialized.py` | `use_cases/specialized.py` | 是 |
| 实时 | `routers/realtime.py` | `use_cases/realtime.py` | 部分——WebSocket 协议位于路由器中 |
| 技术指标 | `routers/technical.py` | `technical/indicator_service.py` | 是（`technical/contracts.py`） |
| 监控 | `routers/monitoring.py` | `monitoring/` | 部分——金丝雀检测和校验层使用 `monitoring/ports.py`；路由的读取查询写在路由器中 |
| 历史数据与 EOD | `routers/historical.py`, `routers/assets.py` | `historical/ingestion_service.py`, `database/query.py` | 否 |
| 估值 | `routers/valuation.py` | `valuation/dcf_service.py` | 否 |
| 新闻 | `routers/news.py` | `news/news_service.py` | 否 |
| 宏观、运维 | `routers/macro.py`, `routers/admin.py` | `macro/`, `database/maintenance.py`, `cache/` | 否 |

用例层是目标模型；其他功能直接调用各自的服务。

## 由测试保证的规则

- `technical/` 不导入 FastAPI、SQLAlchemy、Redis 或 ORM 模型；`monitoring/` 不导入 SQLAlchemy 或 ORM 模型（`tests/test_exception_boundaries.py`）。
- 异步代码只通过 `concurrency.run_sync()` 调用阻塞代码（SQLAlchemy 会话、pandas、yfinance）（`tests/test_async_boundary.py`）——参见[并发](concurrency.md)。
- 路由器使用 `routers/errors.py` 转换应用错误。

## 错误映射

| 应用错误（`use_cases/errors.py`） | HTTP 状态码 |
|---|---|
| `InvalidInput` | `400 Bad Request` |
| `ResourceNotFound` | `404 Not Found` |
| `DependencyUnavailable` | `503 Service Unavailable` |
| `UpstreamFailure` | `500 Internal Server Error` |

技术指标有其自己的错误：未知指标 `400`，无价格 `404`，K 线数量不足 `422`。
