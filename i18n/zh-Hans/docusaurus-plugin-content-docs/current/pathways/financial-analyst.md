---
id: "financial-analyst"
title: "📊 使用路径：金融分析师"
sidebar_label: "📊 金融分析师"
description: "金融分析师无代码入门指南：DCF估值、Google Sheets连接器与OpenBB Workspace。"
---

# 📊 使用路径：金融分析师

本路径专门为**金融分析师与投资者**设计，旨在无需编写复杂代码的情况下自动化基本面研究、构建 DCF（折现现金流）模型并填充电子表格。

> [!TIP]
> **目标：** 将 Fonrex 连接至 Google Sheets 和 OpenBB Workspace，自动化财务报表提取与估值计算。

---

### ⏱️ 预计耗时：5 分钟

---

## 📌 步骤 1：访问您的 Fonrex 实例

默认本地地址：`http://localhost:5000`

---

## 📌 步骤 2：连接 Google Sheets (无代码)

直接在 Google Sheets 表格中获取更新数据：

```excel
=IMPORTDATA("http://localhost:5000/api/v1/fundamentals/ratios?symbol=AAPL&format=csv")
```

---

## 📌 步骤 3：配置 OpenBB Terminal Workspace

在 OpenBB 机构级终端中可视化 Fonrex 数据：

![OpenBB Workspace Fonrex](/img/template-preview.png)

---

## 📌 步骤 4：DCF 估值模型

查询自动估值引擎以计算每股内在价值：

```bash
curl "http://localhost:5000/api/v1/valuation/dcf?symbol=AAPL&wacc=0.085&growth_rate=0.05"
```

---

## 🎯 建议的后续步骤

- 🏛️ [基本面与财务比率 API 参考](/docs/api-reference/fundamentals)
- 💰 [DCF 估值引擎 API 参考](/docs/api-reference/valuation-dcf)
