---
id: "app-developer"
title: "💻 Parcours : Développeur Application"
sidebar_label: "💻 Parcours Développeur"
description: "Guide d'intégration API REST et WebSockets pour les développeurs web et mobile."
---

# 💻 Parcours : Développeur Application

Ce parcours s'adresse aux **Développeurs Software, Web et Mobile** souhaitant intégrer l'API Fonrex dans leurs applications (React, Vue, Node.js, Python, Go, Flutter, etc.).

> [!TIP]
> **Objectif du parcours :** Apprendre à effectuer des requêtes REST optimisées, souscrire à des flux WebSockets en temps réel et gérer la recherche d'actifs.

---

### ⏱️ Durée estimée : 10 minutes

---

## 📌 Étape 1 : Exploration de l'API & Swagger UI

Fonrex fournit une documentation OpenAPI / Swagger interactive générée automatiquement par FastAPI.

Accédez à la documentation Swagger locale :
- `http://localhost:5000/docs` ou `http://localhost:5000/redoc`

---

## 📌 Étape 2 : Première requête REST (Recherche d'actifs)

Recherchez des tickers ou des paires de devises via l'endpoint `/api/v1/assets/search` :

```typescript
// Exemple en TypeScript / JavaScript (fetch)
async function searchAssets(query: string) {
  const response = await fetch(`http://localhost:5000/api/v1/assets/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.results;
}

// Utilisation
searchAssets('Apple').then(results => console.log(results));
```

---

## 📌 Étape 3 : Flux de données en Temps Réel (WebSockets)

Pour afficher des cours en direct sans surcharger le serveur, souscrivez au flux WebSocket alimenté par Redis Pub/Sub :

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/v1/realtime');

ws.onopen = () => {
  console.log('⚡ Connecté au WebSocket Fonrex');
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['AAPL', 'TSLA']
  }));
};

ws.onmessage = (event) => {
  const priceUpdate = JSON.parse(event.data);
  console.log(`📈 Nouveaux cours ${priceUpdate.symbol}: $${priceUpdate.price}`);
};
```

*(Consultez le [Guide de configuration Temps Réel](/docs/guides/configure-realtime) pour la gestion des reconnexions et du multiplexage).*

---

## 📌 Étape 4 : Gestion des erreurs et Fallback multi-providers

Fonrex masque la complexité des API tierces. Si le provider primaire échoue, le moteur de fallback de Fonrex renvoie automatiquement les données du provider secondaire avec le statut HTTP `200 OK` et un header de diagnostic.

```typescript
const res = await fetch('http://localhost:5000/api/v1/fundamentals/income-statement?symbol=AAPL');
const providerUsed = res.headers.get('X-Fonrex-Provider-Source');
console.log(`Données servies par : ${providerUsed}`);
```

---

## 🎯 Prochaines étapes suggérées

- ⚡ [Référence de l'API Realtime & WebSockets](/docs/api-reference/realtime)
- 🔍 [Référence de l'API Assets](/docs/api-reference/assets)
- 🏗️ [Architecture Hexagonale & Ports/Adapters](/docs/architecture/hexagonal)
