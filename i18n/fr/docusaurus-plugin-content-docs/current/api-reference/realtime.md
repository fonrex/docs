---
id: "realtime"
title: "Référence API Temps Réel & WebSockets"
sidebar_label: "Temps Réel & WebSockets"
description: "Streaming de prix temps réel via WebSockets, snapshots de quote REST et gestion des abonnements"
---


# Référence API Temps Réel & WebSockets

L'API temps réel diffuse les ticks de marché 1 minute en direct via WebSockets grâce à des connexions bridge TradingView et Redis Pub/Sub, et expose des snapshots REST à haute vitesse.

---

## <span className="api-method ws">WS</span> `/ws/realtime/{ticker}`

Ouvrir un canal de streaming WebSocket persistant pour les mises à jour de ticks en temps réel sur un ticker donné.

### Protocole de Connexion

```javascript
const ws = new WebSocket("ws://localhost:5000/ws/realtime/AIR.PA");
```

### Messages d'Événements

À la connexion, le serveur envoie un message `snapshot` initial suivi d'événements `tick` en temps réel :

#### Événement Snapshot Initial
```json
{
  "type": "snapshot",
  "ticker": "AIR.PA",
  "data": {
    "close": 135.90,
    "open": 134.20,
    "high": 136.50,
    "low": 133.80,
    "volume": 1245000,
    "timestamp": "2026-08-11T10:15:00Z"
  }
}
```

#### Événement Tick en Direct
```json
{
  "type": "tick",
  "ticker": "AIR.PA",
  "data": {
    "close": 136.10,
    "change": 0.20,
    "change_pct": 0.147,
    "volume": 1246500,
    "timestamp": "2026-08-11T10:16:00Z"
  }
}
```

---

## <span className="api-method get">GET</span> `/quote/{ticker}`

Récupérer le dernier snapshot de cotation depuis le cache volatile Redis. Déclenche automatiquement l'abonnement streaming si `REALTIME_AUTO_SUBSCRIBE=true`.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Symbole ticker (ex. `AAPL`) |

### Exemple de Réponse

```json
{
  "ticker": "AAPL",
  "price": 224.50,
  "open": 222.10,
  "high": 225.00,
  "low": 221.80,
  "volume": 45200000,
  "change": 2.40,
  "change_pct": 1.08,
  "source": "tradingview_stream",
  "timestamp": "2026-08-11T10:15:30Z"
}
```

---

## <span className="api-method get">GET</span> `/quotes`

Récupération par lot de snapshots de cotations pour plusieurs tickers.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `tickers` | `string` | ✅ | — | Liste de tickers séparés par des virgules (ex. `AAPL,MSFT,TSLA`) |

---

## <span className="api-method post">POST</span> `/realtime/subscribe`

Abonner explicitement un ticker au worker de streaming en arrière-plan `RealtimePriceWorker`.

### Corps de la Requête

```json
{
  "ticker": "NVDA"
}
```

---

## <span className="api-method delete">DELETE</span> `/realtime/subscribe/{ticker}`

Désabonner un ticker du streaming en direct en arrière-plan.

---

## <span className="api-method get">GET</span> `/realtime/status`

Lister tous les abonnements actifs aux workers de streaming de marché.

### Exemple de Réponse

```json
{
  "active_subscriptions": 3,
  "subscriptions": [
    {
      "ticker": "AIR.PA",
      "subscribed_at": "2026-08-11T08:00:00Z",
      "last_tick_at": "2026-08-11T10:15:30Z",
      "tick_count": 1350
    }
  ]
}
```
