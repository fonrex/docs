---
id: "app-developer"
title: "App Developer Pathway"
sidebar_label: "App Developer"
description: "Integration guide for software, web, and mobile developers: REST API endpoints, real-time WebSockets streaming, and provider fallbacks"
---

# App Developer Pathway

This pathway provides a technical integration guide for **Software, Web, and Mobile Developers** incorporating Fonrex financial endpoints into external applications (React, Vue, Node.js, Python, Go, Flutter).

| Integration Protocol | Architecture | Usage Target |
|---|---|---|
| **FastAPI REST API** | JSON / OpenAPI | Asset search, historical series, fundamentals, DCF |
| **Redis WebSockets** | Pub/Sub Streaming | Real-time live quote subscriptions |
| **Multi-Provider Engine** | Hexagonal Ports & Adapters | Automatic failover & provider fallback |

---

## 1. OpenAPI & Swagger Documentation

Fonrex generates interactive OpenAPI / Swagger specifications dynamically via FastAPI:

- **Swagger UI**: `http://localhost:5000/docs`
- **ReDoc**: `http://localhost:5000/redoc`
- **OpenAPI JSON Schema**: `http://localhost:5000/openapi.json`

---

## 2. REST API Integration (Asset Search Example)

Search for symbols, tickers, or currency pairs across exchanges:

```http
GET /api/v1/assets/search?q=Apple
```

TypeScript implementation:

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
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}
```

---

## 3. Real-Time WebSocket Streaming

Subscribe to live price feeds backed by Redis Pub/Sub multiplexing:

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
  console.log(`Live quote update for ${payload.symbol}: $${payload.price}`);
};
```

> **Note**: For multiplexing and automatic client reconnection strategies, refer to the [Realtime Configuration Guide](/docs/guides/configure-realtime).

---

## 4. Multi-Provider Fallback Handling

Fonrex automatically abstracts underlying vendor failures. If a primary data source fails, the fallback engine queries secondary providers and returns an HTTP `200 OK` response with a diagnostic header:

```typescript
const res = await fetch('http://localhost:5000/api/v1/fundamentals/income-statement?symbol=AAPL');
const providerSource = res.headers.get('X-Fonrex-Provider-Source');
console.log(`Data source provider: ${providerSource}`); // e.g., 'fmp', 'sec-edgar', 'yfinance'
```

---

## Next Steps

- Review the [Realtime Streaming API Reference](/docs/api-reference/realtime)
- Review the [Assets API Reference](/docs/api-reference/assets)
- Review the [Hexagonal Architecture Specifications](/docs/architecture/hexagonal)
