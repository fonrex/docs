---
id: "alerts"
title: "数据提供方告警与处理"
sidebar_label: "告警与处理"
description: "canary 产生的告警、其严重级别，以及自动和手动处理"
---

# 数据提供方告警与处理

canary 运行会在 `provider_alerts` 中创建告警。当同一数据提供方已有某种类型的活动告警时，不会重复创建该类型的告警。

## 告警类型

| 类型 | 触发条件 | 严重级别 | 处理方式 |
|---|---|---|---|
| `canary_failed` | 某个 canary 值超出其预期范围（或为异常值） | 一次运行中失败次数达到 `ALERT_CANARY_CRITICAL`（3）时为 `critical`，低于该值时为 `warning` | 之后某次运行的所有检查都通过时自动处理 |
| `high_outlier_rate` | 该数据提供方在本次运行中的成功率低于 `ALERT_SUCCESS_RATE_WARNING`（0.85） | 低于 `ALERT_SUCCESS_RATE_CRITICAL`（0.70）时为 `critical`，否则为 `warning` | 手动 |

`consecutive_nulls` 和 `latency_spike` 存在于数据库结构中，但目前没有任何代码会触发它们。

告警会记录数据提供方、首次失败的 ticker 和字段、收到的值以及预期范围。

## 列出告警

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/alerts?severity=critical"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/health/alerts?provider_name=Investing&include_resolved=true"
```

## 手动处理告警

备注是一个查询参数；需要完全访问密钥。

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/health/alerts/42/resolve?resolution_note=Parser%20updated"
```

## 收到告警后该怎么做

1. 查看失败的值：`GET /health/canary/history?provider_name=<name>`。
2. 直接查询该数据提供方：`GET /fundamental?ticker=AIR.PA&provider=<name>&fmt=raw&nocache=true`。
3. `403` 或空响应通常意味着网站拒绝了您的连接：让该数据提供方通过代理访问（`FONREX_PROXY_URL`、`FONREX_PROXY_PROVIDERS`）。
4. 数字错误通常意味着页面发生了变化：需要更新该数据提供方的解析器（[添加数据提供方](../guides/adding-providers.md)介绍了使用已保存页面进行测试的方法）。
5. 在此期间，验证层会阻止该数据提供方的可疑值进入响应。

## 设置

```env
ALERT_CANARY_CRITICAL=3
ALERT_SUCCESS_RATE_WARNING=0.85
ALERT_SUCCESS_RATE_CRITICAL=0.70
```
