---
id: "app-developer"
title: "应用开发者路径"
sidebar_label: "应用开发者"
description: "在应用中集成 Fonrex 实例：身份验证、REST 路由、WebSocket 流、错误和缓存"
---

# 应用开发者路径

本路径面向从应用（Web、移动端、脚本）调用 Fonrex 实例的开发者。

| 协议 | 用途 |
|---|---|
| REST（JSON、OpenAPI） | 目录、价格、基本面数据、指标、估值、新闻 |
| WebSocket | 实时 tick，每个 ticker 一个连接 |

## 1. OpenAPI

您的实例会发布自己的规范：

- Swagger UI：`http://localhost:5000/docs`
- ReDoc：`http://localhost:5000/redoc`
- OpenAPI JSON：`http://localhost:5000/openapi.json`

如果您的技术栈支持，可以根据 `openapi.json` 生成客户端。

## 2. 身份验证

每个请求都需发送密钥：`X-API-KEY: <key>` 或 `Authorization: Bearer <key>`。`401` 表示缺少密钥，`403` 表示密钥未知，或在会修改数据的路由上使用了只读密钥。浏览器或移动应用会把密钥保存在用户设备上：请为其提供**只读**密钥。

```typescript
const FONREX = "http://localhost:5000";

async function fonrex<T>(path: string, key: string): Promise<T> {
  const response = await fetch(`${FONREX}${path}`, { headers: { "X-API-KEY": key } });
  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

type Listing = { id: number; ticker: string; exchange: string; currency: string; isin: string; name: string; is_primary: boolean };

const { listings } = await fonrex<{ count: number; listings: Listing[] }>(
  "/listings?isin=NL0000235190", key,
);
```

## 3. 正确识别金融工具

ticker 不是全局标识符：同一金融工具有多个上市品种（listing，不同货币、不同交易所），而同一个 ticker 在别处可能代表另一个金融工具。请按 ISIN 查找金融工具（`/assets/by-isin/{isin}`、`/listings?isin=`），并在多个上市品种共用一个 ticker 时，向价格路由传递 `currency` 或 `exchange`。

## 4. 实时数据

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${key}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case "snapshot":
    case "tick":
      render(message.data.close);
      break;
    case "not_streaming":
      showDelayed(message.error);
      break;
  }
};
```

每个 ticker 一个连接。价格以十进制字符串形式到达。只读密钥不会启动流；请在服务端使用 `POST /realtime/subscribe` 订阅 ticker。请参阅[实时数据](../api-reference/realtime.md)。

## 5. 错误和缓存

- 错误响应体为 `{"detail": "..."}`，`/eod` 除外（`{"error", "message", "reason"}`）。
- `503` 表示实例的某项服务不可用（数据库未迁移、Redis 宕机、worker 未启动）。
- 大多数响应都缓存在 Redis 中（EOD 24 小时、基本面数据 1 小时、DCF 6 小时、新闻 30 分钟…）；在支持的路由上，`nocache`、`refresh` 或 `force_refresh` 参数可以绕过缓存。
- 基本面数据响应会报告其来源（`Sources`）；没有标明数据提供方的响应头。

## 后续步骤

- [资产与上市品种](../api-reference/assets.md)
- [实时数据配置](../guides/configure-realtime.md)
- [分层与端口](../architecture/hexagonal.md)
