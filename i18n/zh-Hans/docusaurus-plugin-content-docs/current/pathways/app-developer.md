---
id: "app-developer"
title: "应用开发者使用路径"
sidebar_label: "应用开发者"
description: "开发者技术集成指南：REST API、实时 WebSockets 流与多数据源降级"
---

# 应用开发者使用路径

本路径为将 Fonrex 金融端点集成至外部应用（React, Vue, Node.js, Python, Go, Flutter 等）的**软件与 Web/移动端开发者**提供技术集成指南。

| 集成协议 | 架构 | 主要用途 |
|---|---|---|
| **FastAPI REST API** | JSON / OpenAPI | 资产搜索、历史 K 线、基本面、DCF 估值 |
| **Redis WebSockets** | Pub/Sub 流 | 订阅实时价格更新 |
| **多数据源引擎** | 端口与适配器 (Hexagonal) | 自动故障转移与 Provider 降级 |

---

## 1. OpenAPI 与 Swagger 文档

Fonrex 通过 FastAPI 动态生成交互式 OpenAPI / Swagger 规范：

- **Swagger UI**：`http://localhost:5000/docs`
- **ReDoc**：`http://localhost:5000/redoc`
- **OpenAPI JSON Schema**：`http://localhost:5000/openapi.json`

---

## 2. REST API 集成 (资产搜索示例)

搜索股票代码或货币对：

```http
GET /api/v1/assets/search?q=Apple
```

TypeScript 实现：

```typescript
interface AssetResult {
  symbol: string;
  name: string;
  exchange: string;
  asset_type: string;
}

async function searchAssets(query: string): Promise<AssetResult[]> {
  const response = await fetch(`http://localhost:5000/api/v1/assets/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`HTTP 错误! 状态: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}
```

---

## 3. 实时 WebSocket 数据流

订阅由 Redis Pub/Sub 复用支持的实时价格流：

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/v1/realtime');

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['AAPL', 'TSLA']
  }));
};

ws.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  console.log(`实时价格更新 ${payload.symbol}: $${payload.price}`);
};
```

> **注意**：参考 [实时配置指南](/docs/guides/configure-realtime)。

---

## 4. 错误处理与多 Provider 降级

Fonrex 自动抽象底层供应商故障。如果主要数据源失败，降级引擎会自动查询次要 Provider 并返回包含诊断标头的 HTTP `200 OK` 响应：

```typescript
const res = await fetch('http://localhost:5000/api/v1/fundamentals/income-statement?symbol=AAPL');
const providerSource = res.headers.get('X-Fonrex-Provider-Source');
console.log(`数据源 Provider: ${providerSource}`);
```

---

## 后续步骤

- 参考 [实时流 API 参考](/docs/api-reference/realtime)
- 参考 [资产 API 参考](/docs/api-reference/assets)
- 参考 [六边形架构规范](/docs/architecture/hexagonal)
