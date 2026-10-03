---
id: "app-developer"
title: "💻 使用路径：应用开发者"
sidebar_label: "💻 应用开发者"
description: "Web 与移动端开发者集成指南：REST API 端点与实时 WebSockets 流。"
---

# 💻 使用路径：应用开发者

本路径适用于希望将 Fonrex API 集成至应用（React, Vue, Node.js, Python, Go, Flutter 等）的**软件与 Web/移动端开发者**。

> [!TIP]
> **目标：** 执行优化的 REST 查询，订阅实时 WebSockets 流，并处理多数据源降级。

---

### ⏱️ 预计耗时：10 分钟

---

## 📌 步骤 1：API 探索与 Swagger UI

访问本地 Swagger 文档：
- `http://localhost:5000/docs`

---

## 📌 步骤 2：发起 REST 请求（资产搜索）

```typescript
async function searchAssets(query: string) {
  const response = await fetch(`http://localhost:5000/api/v1/assets/search?q=${encodeURIComponent(query)}`);
  return await response.json();
}
```

---

## 📌 步骤 3：实时数据流 (WebSockets)

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/v1/realtime');

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['AAPL', 'TSLA']
  }));
};

ws.onmessage = (event) => {
  console.log('📈 实时价格更新:', JSON.parse(event.data));
};
```

---

## 🎯 建议的后续步骤

- ⚡ [实时流 API 参考](/docs/api-reference/realtime)
- 🔍 [资产 API 参考](/docs/api-reference/assets)
