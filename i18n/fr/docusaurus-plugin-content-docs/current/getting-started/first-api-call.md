---
id: "first-api-call"
title: "Effectuer votre premier appel API"
sidebar_label: "First API Call"
description: "Apprenez à récupérer des données financières, des indicateurs techniques et des flux en temps réel avec cURL, Python et WebSocket"
---


# Effectuer votre premier appel API

Ce guide montre comment interagir avec Fonrex à l'aide des endpoints REST HTTP et des WebSockets en temps réel.

## 1. Obtenir l'Historique de Prix EOD

Récupérez les prix historiques EOD (OHLCV) pour **Airbus SE (`AIR.PA`)**.

### cURL
```bash
curl -s "http://localhost:5000/eod/AIR.PA?resolution=d&limit=5"
```

### Python
```python
import requests

url = "http://localhost:5000/eod/AIR.PA"
params = {"resolution": "d", "limit": 5}
response = requests.get(url, params=params)

data = response.json()
print(f"Ticker: {data['symbol']}, Total Candles: {len(data['data'])}")
for bar in data['data']:
    print(f"Date: {bar['time']} | Close: {bar['close']} {data['currency']}")
```

### Sample Response
```json
{
  "symbol": "AIR.PA",
  "name": "Airbus SE",
  "currency": "EUR",
  "resolution": "d",
  "count": 5,
  "data": [
    {
      "time": "2026-08-07T00:00:00Z",
      "open": 134.20,
      "high": 136.50,
      "low": 133.80,
      "close": 135.90,
      "adj_close": 135.90,
      "volume": 1245000
    }
  ]
}
```

---

## 2. Calculer des Indicateurs Techniques

Calculez un **RSI (Relative Strength Index)** sur 14 périodes pour **Apple Inc. (`AAPL`)**.

### cURL
```bash
curl -s "http://localhost:5000/technical/AAPL?indicator=rsi&period=14"
```

### Python
```python
import requests

resp = requests.get("http://localhost:5000/technical/AAPL", params={"indicator": "rsi", "period": 14})
rsi_data = resp.json()
latest_rsi = rsi_data["values"][-1]
print(f"AAPL Current RSI(14): {latest_rsi['value']:.2f}")
```

---

## 3. Se Connecter au Stream WebSocket Temps Réel

Abonnez-vous aux bougies d'une minute en temps réel pour **Tesla (`TSLA`)**.

### JavaScript Browser / Node.js
```javascript
const ws = new WebSocket("ws://localhost:5000/ws/realtime/TSLA");

ws.onopen = () => {
  console.log("Connected to Fonrex Realtime Stream for TSLA");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Stream Event:", message.type, message.data);
};
```

### Python WebSocket Client
```python
import asyncio
import websockets
import json

async def stream_quote():
    async with websockets.connect("ws://localhost:5000/ws/realtime/TSLA") as websocket:
        while True:
            msg = await websocket.recv()
            data = json.loads(msg)
            print(f"[{data['type']}] Close: {data['data'].get('close')} Volume: {data['data'].get('volume')}")

asyncio.run(stream_quote())
```
