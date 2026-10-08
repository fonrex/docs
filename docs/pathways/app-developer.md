---
id: "app-developer"
title: "App Developer Pathway"
sidebar_label: "App Developer"
description: "Integrate a Fonrex instance in an application: authentication, REST routes, WebSocket stream, errors and caching"
---

# App Developer Pathway

This pathway is for developers calling a Fonrex instance from an application (web, mobile, scripts).

| Protocol | Use |
|---|---|
| REST (JSON, OpenAPI) | Catalogue, prices, fundamentals, indicators, valuation, news |
| WebSocket | Realtime ticks, one connection per ticker |

## 1. OpenAPI

Your instance publishes its own specification:

- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`
- OpenAPI JSON: `http://localhost:5000/openapi.json`

Generate a client from `openapi.json` if your stack supports it.

## 2. Authentication

Send a key with every request: `X-API-KEY: <key>` or `Authorization: Bearer <key>`. `401` means no key, `403` an unknown key or a read-only key on a route that changes something. A browser or mobile application holds its key on the user's device: give it a **read-only** key.

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

## 3. Identify instruments correctly

A ticker is not a global identifier: the same instrument has several listings (currencies, exchanges), and the same ticker can be another instrument elsewhere. Look instruments up by ISIN (`/assets/by-isin/{isin}`, `/listings?isin=`), and pass `currency` or `exchange` to the price routes when several listings share a ticker.

## 4. Realtime

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

One connection per ticker. Prices arrive as decimal strings. A read-only key does not start streams; subscribe tickers server-side with `POST /realtime/subscribe`. See [Realtime](../api-reference/realtime.md).

## 5. Errors and caching

- Error bodies are `{"detail": "..."}`, except `/eod` (`{"error", "message", "reason"}`).
- `503` means a service of the instance is not available (database not migrated, Redis down, worker not started).
- Most answers are cached in Redis (EOD 24 h, fundamentals 1 h, DCF 6 h, news 30 min…); `nocache`, `refresh` or `force_refresh` parameters bypass the cache where they exist.
- Fundamentals answers report their sources (`Sources`); there is no response header naming the provider.

## Next steps

- [Assets & listings](../api-reference/assets.md)
- [Realtime configuration](../guides/configure-realtime.md)
- [Layers & ports](../architecture/hexagonal.md)
