---
id: "configure-realtime"
title: "Streaming temps réel et configuration WebSocket"
sidebar_label: "Configurer le temps réel"
description: "Démarrer des flux TradingView, recevoir les ticks par WebSocket et régler le worker temps réel"
---

# Streaming temps réel et configuration WebSocket

Le worker temps réel s'exécute dans le processus de l'API. Il garde ouverts les flux WebSocket TradingView des tickers abonnés et diffuse chaque tick d'une minute via Redis.

```
TradingView WebSocket
        │
        ▼
RealtimePriceWorker (API process)
        ├─► Redis key quote:{ticker}       last tick, 60 s      ──► GET /quote/{ticker}
        ├─► Redis channel price:{ticker}   each tick            ──► WS /ws/realtime/{ticker}
        └─► prices_intraday (TimescaleDB)  1-minute candles, kept 30 days
```

## 1. Abonner des tickers

Les flux sont démarrés avec une clé **à accès complet** :

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"tickers": ["AIR.PA", "BNP.PA"]}' http://localhost:5000/realtime/subscribe
```

Se connecter à `WS /ws/realtime/{ticker}` avec une clé à accès complet démarre aussi le flux d'un ticker qui n'est pas diffusé. Les abonnements sont enregistrés dans `realtime_subscriptions` et restaurés au redémarrage de l'API.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/realtime/status
curl -s -X DELETE -H "X-API-KEY: $FONREX_API_KEY" http://localhost:5000/realtime/subscribe/BNP.PA
```

## 2. Recevoir les ticks

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === "snapshot" || type === "tick") console.log(type, data.close);
};
```

Le dépôt contient aussi un exemple de client Python : `make example-client` (`scripts/example_realtime_client.py`).

**Les clés en lecture seule** (pour un tableau de bord ou tout client hors de votre machine) ne démarrent jamais de flux. Elles reçoivent un message `not_streaming` pour un ticker qui n'est pas diffusé, puis ses ticks dès qu'un client à accès complet l'abonne. `GET /quote/{ticker}` et `GET /openbb/quote/{ticker}` ne démarrent jamais de flux non plus : sans flux, ils renvoient le prix différé de Yahoo Finance.

## 3. Paramètres

```env
# Simultaneous TradingView connections
TV_MAX_CONNECTIONS=10
# First reconnection delay in seconds, doubled after each failure up to 60
TV_RECONNECT_DELAY=5
# Lifetime of the last tick in Redis, in seconds
REALTIME_QUOTE_TTL=60
```

## À savoir

- **Un seul processus.** Les flux, les abonnements et les clients WebSocket vivent dans la mémoire du processus de l'API. Gardez `WEB_CONCURRENCY=1` : chaque worker Gunicorn supplémentaire ouvrirait ses propres flux.
- **Symbole TradingView.** Il est déduit du suffixe du ticker (`AIR.PA` → `EURONEXT:AIR`, `.DE` → `XETRA`) ; un ticker sans suffixe est considéré comme une ligne NASDAQ. Contrairement à l'ingestion des cours de clôture, le chemin temps réel ne vérifie pas la ligne par rapport à l'ISIN et à la devise d'une cotation.
- **Stockage intrajournalier.** Les bougies d'une minute sont enregistrées par instrument (et non par cotation) quand le ticker est dans le catalogue, et purgées au bout de 30 jours par une politique de rétention TimescaleDB.
- **Reverse proxy.** Un proxy placé devant l'API doit transmettre l'upgrade WebSocket : voir [Déploiement Docker en production](../deployment/docker.md).
