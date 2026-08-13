---
id: "monitoring"
title: "提供商监控 API 参考"
sidebar_label: "提供商监控"
description: "提供商健康状态、金丝雀检查日志及自动化警报 Endpoint"
---


# 提供商监控 API 参考

提供商监控 API 暴露了用于查询提供商健康状况、检查每日合成金丝雀检查执行情况、查看异常值警报及解决系统事故的 Endpoint。

---

## <span className="api-method get">GET</span> `/health/providers`

获取所有金融数据提供商的当前健康状态和可用性摘要。

### 响应示例

```json
{
  "total_providers": 14,
  "healthy_count": 13,
  "degraded_count": 1,
  "providers": [
    {
      "name": "ZoneBourse",
      "is_healthy": true,
      "success_rate": 0.98,
      "avg_latency_ms": 320,
      "last_check_at": "2026-08-11T06:00:00Z"
    },
    {
      "name": "Investing",
      "is_healthy": false,
      "success_rate": 0.65,
      "avg_latency_ms": 1450,
      "last_check_at": "2026-08-11T06:00:00Z"
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/health/providers/{name}`

单个提供商的详细健康统计数据、历史延迟指标及近期异常值事件。

---

## <span className="api-method get">GET</span> `/health/alerts`

获取活跃或已解决的提供商质量警报。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `severity` | `string` | ❌ | — | Filter by severity (`critical`, `warning`, `info`) |
| `provider` | `string` | ❌ | — | Provider name |
| `include_resolved` | `boolean` | ❌ | `false` | Include historical resolved alerts |

---

## <span className="api-method post">POST</span> `/health/alerts/{id}/resolve`

使用可选的解决说明手动将警报标记为已解决。

### 请求体 (Request Body)

```json
{
  "resolution_note": "Upstream rate limit cleared by provider support."
}
```

---

## <span className="api-method post">POST</span> `/health/canary/run`

在所有已注册的提供商或单个目标提供商上立即触发后台金丝雀健康检查。

---

## <span className="api-method get">GET</span> `/health/canary/history`

每日合成金丝雀检查的历史执行日志。

---

## <span className="api-method get">GET</span> `/health/stats`

7 天滚动窗口内的全局数据质量统计信息。
