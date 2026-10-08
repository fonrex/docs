---
id: "financial-analyst"
title: "金融分析师路径"
sidebar_label: "金融分析师"
description: "在您自己的实例上使用带来源的基本面数据、DCF 估值、Google Sheets 和 OpenBB Workspace"
---

# 金融分析师路径

本路径涵盖 Fonrex 的基本面与估值部分，以及两个无代码前端：Google Sheets 和 OpenBB Workspace。它们都读取**您自己的实例**。

| 需求 | 位置 |
|---|---|
| 带来源的比率 | `GET /fundamental`（EODHD 布局，`Sources` 部分） |
| 财务报表、盈利、评级 | `GET /fundamental/deep` |
| 内在价值 | `GET /dcf/{ticker}`（FCF）、`/compare`（三种模型）、`/sensitivity`；使用您自己的假设调用 `POST /dcf/{ticker}` |
| 电子表格 | Google Sheets 模板 |
| 仪表板 | OpenBB Workspace 小组件 |

## 1. 一个实例和一个密钥

安装实例（[安装](../getting-started/installation.md)），并为那些会把密钥保存在您机器之外的工具创建一个**只读密钥**：

```
FONREX_READ_ONLY_API_KEYS=frx_live_<random value>
```

## 2. 基本面数据

```bash
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/fundamental?ticker=AIR.PA"
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/fundamental/deep?ticker=AIR.PA"
```

`/fundamental` 依次从 Yahoo Finance（使用为该上市品种验证过的代码查询）、已存储的数字和抓取的网站中获取每个数字，并告诉您每个数字的来源。比率以比率表示（1.25 % 写作 `0.0125`）。请参阅[基本面数据](../api-reference/fundamentals.md)。

## 3. 估值

DCF 读取为该金融工具存储的深度基本面数据：请先调用 `/fundamental/deep`。

```bash
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/dcf/AIR.PA"
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/dcf/AIR.PA/sensitivity?model=fcf"
curl -s -X POST -H "X-API-KEY: $KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps", "ddm"], "projection_years": 10, "terminal_growth_rate": 0.02}' \
  http://localhost:5000/dcf/AIR.PA
```

`GET /dcf` 计算 FCF 模型；`/compare` 以及指定多个模型的 `POST` 请求会将 FCF、EPS 和 DDM 按 50/30/20 加权。WACC 基于 CAPM 并使用 FRED 10 年期利率。请参阅[估值与 DCF](../api-reference/valuation-dcf.md)。

## 4. Google Sheets

该模板为关注列表刷新基本面数据、DCF 和指标，并提供 `=FONREX_PE()`、`=FONREX_DIVIDEND_YIELD()`、`=FONREX_INTRINSIC_VALUE()` 和 `=FONREX_RSI()`。Google 的服务器通过隧道访问您的实例。请参阅 [Google Sheets 指南](../guides/google-sheets-connector.md)。

## 5. OpenBB Workspace

将您实例的 URL 添加为数据源，并在 `X-API-KEY` 请求头中填入您的密钥：可获得 19 个小组件和两个仪表板（EU Markets、Screener & Macro）。请参阅 [OpenBB 指南](../guides/openbb-workspace.md)。

:::info
Fonrex 显示的是原始财务数据和分析输出结果，不构成投资建议。
:::
