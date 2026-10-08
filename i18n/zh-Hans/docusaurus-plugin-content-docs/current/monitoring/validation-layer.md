---
id: "validation-layer"
title: "验证层架构"
sidebar_label: "验证层"
description: "在每个数据提供方的值进入响应之前对其进行的范围检查和共识检查"
---

# 验证层架构

在基本面数据提供方中，有十三个通过读取网页获取数据。当页面发生变化时，数据提供方可能仍会继续返回结果，但数字是错误的（例如市盈率返回 `0.8` 而不是 `24.0`）。`ValidationLayer`（`monitoring/validation_layer.py`）会在每个 `/fundamental` 请求中、在数据提供方返回之后且文档构建之前捕获这类值。被拒绝的值会变为 `None`，文档会改用其他来源的数字。

## 1. 单位规范化

范围使用比率：3.45 % 的股息收益率写作 `0.0345`。抓取类数据提供方通常返回显示用的百分数（`3.45`）。`monitoring/units.py` 为每个数据提供方声明以百分数返回的字段（`PROVIDER_PERCENT_FIELDS`）；这些字段会在任何检查之前进行转换。数据提供方的响应保留其自身的单位；日志中记录的是转换后的比率。

## 2. 范围检查

| 字段 | 最小值 | 最大值 |
|---|---|---|
| `pe_ratio` | 0.5 | 1000 |
| `pe_forward` | 0.5 | 500 |
| `pb_ratio` | 0 | 100 |
| `ps_ratio` | 0 | 200 |
| `peg_ratio` | −10 | 50 |
| `ev_ebitda` | 0 | 500 |
| `price`、`target_price`、`week_52_high`、`week_52_low` | 0.001 | 1,000,000 |
| `dividend_yield` | 0 | 0.50 |
| `dividend_rate` | 0 | 1000 |
| `payout_ratio` | 0 | 10 |
| `roe` | −5 | 10 |
| `roa` | −2 | 2 |
| `net_margin`、`operating_margin` | −5 | 1 |
| `gross_margin` | −1 | 1 |
| `quarterly_revenue_growth_yoy` | −0.99 | 10 |
| `quarterly_earnings_growth_yoy` | −0.99 | 20 |
| `eps`、`eps_trailing`、`eps_forward` | −1000 | 10,000 |
| `beta` | −3 | 5 |
| `short_percent_float` | 0 | 1 |

超出范围的值被标记为 `out_of_range` 并设为 `None`。

## 3. 共识检查

当至少 `VALIDATION_MIN_PROVIDERS`（2）个数据提供方为同一字段给出在范围内的值时：

1. 计算这些值的中位数 `M`；
2. 每个值 `V` 的偏差为 `|V − M| / M`；
3. 偏差超过 `VALIDATION_OUTLIER_THRESHOLD`（0.50）时，该值被标记为 `outlier` 并设为 `None`。

## 4. 日志记录

每个被检查的值都会连同其状态写入 `provider_health_log` 超表（hypertable，保留 30 天）：`ok`、`out_of_range`、`outlier` 或 null。`GET /health/stats` 汇总最近 7 天的情况。

验证层从不抛出异常：内部错误会被记录到日志，响应会在未经验证的情况下继续返回，而不是失败。

## 设置

```env
VALIDATION_OUTLIER_THRESHOLD=0.50
VALIDATION_MIN_PROVIDERS=2
```
