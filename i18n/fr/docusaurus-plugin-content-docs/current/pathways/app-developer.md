---
id: "app-developer"
title: "Parcours Développeur Application"
sidebar_label: "Développeur Application"
description: "Guide d'intégration technique pour développeurs : API REST, WebSockets temps réel et fallbacks multi-providers"
---

# Parcours Développeur Application

Ce parcours fournit un guide d'intégration technique pour les **Développeurs Software, Web et Mobile** intégrant l'API Fonrex dans leurs applications (React, Vue, Node.js, Python, Go, Flutter).

| Protocole d'intégration | Architecture | Usage principal |
|---|---|---|
| **API REST FastAPI** | JSON / OpenAPI | Recherche d'actifs, séries historiques, fondamentaux, DCF |
| **WebSockets Redis** | Streaming Pub/Sub | Souscription aux cours en direct |
| **Moteur Multi-Provider** | Ports & Adapters Hexagonaux | Basculement automatique et fallback provider |

---

## 1. Documentation OpenAPI & Swagger

Fonrex génère automatiquement une spécification OpenAPI / Swagger via FastAPI :

- **Interface Swagger UI** : `http://localhost:5000/docs`
- **Interface ReDoc** : `http://localhost:5000/redoc`
- **Schéma JSON OpenAPI** : `http://localhost:5000/openapi.json`

---

## 2. Intégration API REST (Recherche d'actifs)

Recherchez des symboles ou des paires de devises via l'endpoint de recherche :

```http
GET /api/v1/assets/search?q=Apple
```

Implémentation TypeScript :

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
    throw new Error(`Erreur HTTP! Statut: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}
```

---

## 3. Streaming de données WebSockets en temps réel

Souscrivez aux flux de prix en direct gérés par multiplexage Redis Pub/Sub :

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
  console.log(`Mise à jour cours ${payload.symbol}: $${payload.price}`);
};
```

> **Note** : Pour la stratégie de reconnexion automatique et le multiplexage, consultez le [Guide de configuration Temps Réel](/docs/guides/configure-realtime).

---

## 4. Gestion des erreurs et Fallback Multi-Provider

Fonrex gère automatiquement les défaillances des API tierces. Si le provider primaire échoue, le moteur de fallback renvoie les données du provider secondaire avec un statut HTTP `200 OK` et un en-tête de diagnostic :

```typescript
const res = await fetch('http://localhost:5000/api/v1/fundamentals/income-statement?symbol=AAPL');
const providerSource = res.headers.get('X-Fonrex-Provider-Source');
console.log(`Provider utilisé : ${providerSource}`); // ex: 'fmp', 'sec-edgar', 'yfinance'
```

---

## Prochaines étapes

- Consulter la [Référence API Realtime & WebSockets](/docs/api-reference/realtime)
- Consulter la [Référence API Assets](/docs/api-reference/assets)
- Consulter le document [Spécifications Architecture Hexagonale](/docs/architecture/hexagonal)
