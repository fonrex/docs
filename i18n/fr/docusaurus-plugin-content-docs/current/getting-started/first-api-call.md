---
id: "first-api-call"
title: "Effectuer votre premier appel d'API"
sidebar_label: "Premier appel d'API"
description: "S'authentifier et interroger les prix, les indicateurs et les cours en temps réel avec des clients cURL, Python et WebSocket"
---

# Effectuer votre premier appel d'API

Toutes les routes, sauf `/health`, `/docs`, `/redoc`, `/openapi.json`, `/widgets.json`, `/apps.json` et `/static`, exigent une clé d'API, envoyée dans l'un de ces deux en-têtes :

```
Authorization: Bearer frx_live_...
X-API-KEY: frx_live_...
```

Une clé absente renvoie `401`, une clé inconnue `403`. Les exemples ci-dessous utilisent la clé définie dans `.env` lors de l'[installation](installation.md) :

```bash
export FONREX_API_KEY="frx_live_..."   # the value of FONREX_API_KEY in .env
AUTH="X-API-KEY: $FONREX_API_KEY"
```

La documentation interactive de votre instance se trouve à `http://localhost:5000/docs`.

## 1. Cours de clôture

```bash
curl -s -H "$AUTH" "http://localhost:5000/eod/AIR.PA?period=5d"
```

Quand rien n'est encore stocké pour la cotation, Fonrex ingère d'abord son historique (Yahoo Finance, TradingView en solution de repli) ; le premier appel peut donc prendre quelques secondes.

```json
{
  "ticker": "AIR.PA",
  "period": "5d",
  "format": "json",
  "count": 3,
  "retrieved_at": "2026-10-08T16:34:42.404598+00:00",
  "data_source": "database",
  "data": [
    {
      "Date": "2026-10-07",
      "Open": 154.46,
      "High": 156.46,
      "Low": 152.46,
      "Close": 155.46,
      "Adj Close": 155.46,
      "Volume": 1400000
    }
  ]
}
```

Ajoutez `&fmt=csv` pour obtenir du CSV. Quand plusieurs cotations partagent un ticker, choisissez-en une avec `currency` ou `exchange`.

### Python

```python
import os
import requests

session = requests.Session()
session.headers["X-API-KEY"] = os.environ["FONREX_API_KEY"]

eod = session.get("http://localhost:5000/eod/AIR.PA", params={"period": "1mo"}).json()
for bar in eod["data"]:
    print(bar["Date"], bar["Close"])
```

## 2. Un indicateur technique

Les indicateurs sont calculés sur les prix stockés en base de données : ingérez d'abord la cotation (étape 1, ou `POST /historical/ingest?ticker=AIR.PA`). Sans prix, la réponse est `404`.

```bash
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14"
```

```python
rsi = session.get(
    "http://localhost:5000/technical/AIR.PA",
    params={"indicator": "rsi", "period": 14},
).json()
last = rsi["series"][0]["values"][-1]
print(f"RSI(14) on {last['t']}: {last['v']}")
```

Les valeurs sont renvoyées sous forme de chaînes (nombres décimaux), ou `null` tant que l'indicateur a trop peu de barres.

## 3. Données fondamentales

```bash
curl -s -H "$AUTH" "http://localhost:5000/fundamental?ticker=AIR.PA"
```

La réponse est un document unique au format EODHD (`General`, `Highlights`, `Valuation`, …) avec une section `Sources` qui indique la source de chaque chiffre. Voir [Données fondamentales](../api-reference/fundamentals.md).

## 4. Prix en temps réel par WebSocket

Les navigateurs ne peuvent pas définir d'en-têtes sur un WebSocket : passez la clé dans la chaîne de requête (`token`, `api_key` ou `key`).

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "tick") console.log(message.data.close, message.data.timestamp);
};
```

```python
import asyncio
import json
import os

import websockets

async def stream(ticker: str) -> None:
    url = f"ws://localhost:5000/ws/realtime/{ticker}?token={os.environ['FONREX_API_KEY']}"
    async with websockets.connect(url) as ws:
        async for raw in ws:
            message = json.loads(raw)
            if message["type"] in ("snapshot", "tick"):
                print(message["type"], message["data"]["close"])

asyncio.run(stream("AIR.PA"))
```

Avec une clé à accès complet, la connexion démarre le flux TradingView du ticker s'il n'est pas encore diffusé. Une clé en lecture seule n'en démarre jamais : elle reçoit un message `not_streaming`, puis les ticks dès qu'un client à accès complet a abonné le ticker. Voir [Temps réel](../api-reference/realtime.md).
