---
id: "financial-analyst"
title: "金融分析师使用路径"
sidebar_label: "金融分析师"
description: "金融分析师技术指南：DCF 估值模型、基本面报表提取、Google Sheets 连接器与 OpenBB Workspace"
---

# 金融分析师使用路径

本路径为**金融分析师与估值专家**提供技术集成指南。涵盖基本面财务报表提取、折现现金流 (DCF) 估值模型，以及 Google Sheets 与 OpenBB Workspace 自动化集成。

| 功能领域 | 集成方式 | 输出格式 |
|---|---|---|
| **Google Sheets 连接器** | Apps Script / `IMPORTDATA` | CSV / 单元格计算 |
| **OpenBB Workspace** | REST 路由 (`/openbb`) | 指标卡片、AgGrid 表格、Plotly 图表 |
| **DCF 估值引擎** | FastAPI 后端 | 自由现金流、EPS 与 DDM 内在价值 |

---

## 1. 访问实例端点

确保 Fonrex 实例正在运行：

```http
GET /health
```

默认本地地址：`http://localhost:5000`

---

## 2. Google Sheets 集成

直接使用标准公式或自定义 Apps Script 函数将电子表格模型连接至 Fonrex 端点：

### 直接公式调用

```excel
=IMPORTDATA("http://localhost:5000/api/v1/fundamentals/ratios?symbol=AAPL&format=csv")
```

### 自定义 Apps Script 函数

| 函数签名 | 说明 |
|---|---|
| `=FONREX_PE("AIR.PA")` | 市盈率 (P/E Ratio) |
| `=FONREX_DIVIDEND_YIELD("AIR.PA")` | 股息率 (小数格式) |
| `=FONREX_INTRINSIC_VALUE("AAPL")` | 每股 DCF 内在价值 |

> **注意**：自定义单元格公式在 Google 端缓存 30 分钟。手动刷新请使用菜单脚本。参考 [Google Sheets 连接器指南](/docs/guides/google-sheets-connector)。

---

## 3. OpenBB Terminal Workspace 配置

Fonrex 提供专为 OpenBB Terminal (Cloud 与 Desktop) 设计的 `/openbb` 端点：

1. 打开 OpenBB Workspace。
2. 添加 Fonrex 作为自定义后端数据源 (`http://localhost:5000/openbb`)。
3. 加载默认 Fonrex 工作区仪表板布局。

> **注意**：参考 [OpenBB Workspace 指南](/docs/guides/openbb-workspace)。

---

## 4. DCF 估值引擎

查询估值模型以计算企业内在价值：

```http
GET /api/v1/valuation/dcf?symbol=AAPL&wacc=0.085&growth_rate=0.05
```

响应 JSON 格式：

```json
{
  "symbol": "AAPL",
  "intrinsic_value_per_share": 198.50,
  "current_price": 185.20,
  "upside_downside_pct": 7.18,
  "wacc_used": 0.085,
  "terminal_growth_rate": 0.05
}
```

---

## 后续步骤

- 参考 [基本面与财务比率 API 参考](/docs/api-reference/fundamentals)
- 参考 [DCF 估值引擎 API 参考](/docs/api-reference/valuation-dcf)
- 参考 [OpenBB 集成 API 参考](/docs/api-reference/openbb)
