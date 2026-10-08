---
id: "realtime"
title: "Référence API Temps réel & WebSocket"
sidebar_label: "Flux temps réel"
description: "Flux de prix WebSocket, instantanés de cotation et abonnements aux flux"
---

# Référence API Temps réel & WebSocket

Le worker temps réel de l'API diffuse des ticks d'une minute depuis TradingView, conserve le dernier tick de chaque ticker dans Redis (`quote:{ticker}`, 60 s), le publie sur le canal Redis `price:{ticker}` et l'enregistre dans l'hypertable `prices_intraday` lorsque l'instrument est dans le catalogue.

Les flux sont démarrés par une clé à accès complet : via `POST /realtime/subscribe`, ou en se connectant au WebSocket. Une **clé en lecture seule ne démarre jamais de flux** ; elle reçoit ce qui est déjà diffusé. Les abonnements des tickers qui désignent un instrument du catalogue sont enregistrés dans `realtime_subscriptions` et restaurés au démarrage de l'API ; les autres tickers sont diffusés mais ne sont pas restaurés après un redémarrage.

---

## <span className="api-method ws">WS</span> `/ws/realtime/{ticker}`

```javascript
const ws = new WebSocket(`ws://localhost:5000/ws/realtime/AIR.PA?token=${FONREX_API_KEY}`);
```

La clé est vérifiée pendant la poignée de main. Un client WebSocket peut l'envoyer dans un en-tête (`Authorization` ou `X-API-KEY`) ou dans la chaîne de requête sous la forme `token`, `api_key` ou `key`. Une clé absente ou erronée ferme la connexion avec le code `1008`.

### Messages envoyés par le serveur

Chaque message a la forme `{"type", "ticker", "data", "error", "ts"}`, sauf `pong`, envoyé sous la forme `{"type": "pong"}`.

| `type` | Quand | `data` |
|---|---|---|
| `not_streaming` | Clé en lecture seule sur un ticker non diffusé (envoyé en premier ; `error` l'explique) | — |
| `snapshot` | Juste après la connexion, lorsqu'un dernier tick est en cache | Le dernier tick |
| `tick` | À chaque nouveau tick | Le tick |
| `pong` | Réponse à un `ping` du client | — |

```json
{
  "type": "tick",
  "ticker": "AIR.PA",
  "data": {
    "ticker": "AIR.PA",
    "timestamp": "2026-10-08T09:31:00Z",
    "open": "155.20",
    "high": "155.48",
    "low": "155.10",
    "close": "155.42",
    "volume": 18250,
    "source": "tradingview",
    "exchange": null,
    "currency": null
  },
  "error": null,
  "ts": "2026-10-08T09:31:02.114Z"
}
```

Les prix sont des nombres décimaux sérialisés en chaînes.

### Messages envoyés par le client

| Texte | Effet |
|---|---|
| `ping` | Le serveur répond `{"type": "pong"}` |
| `unsubscribe` | Le serveur ferme la connexion |

Le symbole TradingView est déduit du suffixe du ticker (`AIR.PA` → `EURONEXT:AIR`, `.DE` → `XETRA`) ; un ticker sans suffixe est traité comme une valeur du NASDAQ.

---

## <span className="api-method get">GET</span> `/quote/{ticker}`

Le dernier prix connu d'un ticker.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `subscribe_if_missing` | boolean | `false` | Démarrer aussi le flux du ticker en arrière-plan. Ignoré pour une clé en lecture seule |

Lorsque le ticker est diffusé, le tick en cache est renvoyé (`is_realtime: true`, `source: "tradingview"`). Sinon Fonrex renvoie le prix différé de Yahoo Finance pour le ticker **tel que saisi** (`is_realtime: false`, `source: "yfinance"`, `delay_seconds: 900`). Si rien n'est trouvé, la réponse est `404`. Un tick ne contient pas de clôture précédente : pour un ticker diffusé, `change` et `change_pct` valent `0` et `previous_close` vaut `null` ; la réponse différée de Yahoo les remplit.

```json
{
  "ticker": "AIR.PA",
  "price": "155.42",
  "open": "155.20",
  "high": "155.48",
  "low": "155.10",
  "close": "155.42",
  "volume": 18250,
  "change": "0",
  "change_pct": "0",
  "previous_close": null,
  "timestamp": "2026-10-08T09:31:00Z",
  "is_realtime": true,
  "source": "tradingview",
  "delay_seconds": 0
}
```

---

## <span className="api-method get">GET</span> `/quotes`

Les cotations de plusieurs tickers : `tickers` est une liste séparée par des virgules, tronquée aux 20 premiers. Un ticker sans cotation vaut `null`. Cette route ne démarre jamais de flux.

```json
{ "count": 2, "tickers": ["AIR.PA", "BNP.PA"], "quotes": { "AIR.PA": { "...": "..." }, "BNP.PA": null } }
```

---

## <span className="api-method post">POST</span> `/realtime/subscribe`

Démarrer le flux de 50 tickers au plus. Clé à accès complet uniquement.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"tickers": ["AIR.PA", "BNP.PA"]}' http://localhost:5000/realtime/subscribe
```

```json
[
  {
    "ticker": "AIR.PA",
    "tv_exchange": "EURONEXT",
    "tv_symbol": "AIR",
    "is_active": true,
    "subscribed_at": "2026-10-08T09:30:00Z",
    "last_tick_at": null,
    "tick_count": 0,
    "is_streaming": true
  }
]
```

---

## <span className="api-method delete">DELETE</span> `/realtime/subscribe/{ticker}`

Arrêter le flux d'un ticker. Clé à accès complet uniquement. Répond `{"status": "unsubscribed", "ticker": "AIR.PA"}`, ou `404` lorsque le ticker n'est pas diffusé.

---

## <span className="api-method get">GET</span> `/realtime/status`

```json
{
  "streaming_count": 1,
  "active_tickers": ["AIR.PA"],
  "ws_connections": { "AIR.PA": 2 },
  "total_ws_clients": 2,
  "stale_tickers": [],
  "worker_running": true
}
```

`stale_tickers` liste les tickers diffusés sans tick récent dans Redis.
