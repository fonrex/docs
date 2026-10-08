---
id: "app-developer"
title: "Parcours Développeur d'applications"
sidebar_label: "Développeur d'applications"
description: "Intégrer une instance Fonrex dans une application : authentification, routes REST, flux WebSocket, erreurs et cache"
---

# Parcours Développeur d'applications

Ce parcours s'adresse aux développeurs qui appellent une instance Fonrex depuis une application (web, mobile, scripts).

| Protocole | Usage |
|---|---|
| REST (JSON, OpenAPI) | Catalogue, prix, données fondamentales, indicateurs, valorisation, actualités |
| WebSocket | Ticks en temps réel, une connexion par ticker |

## 1. OpenAPI

Votre instance publie sa propre spécification :

- Swagger UI : `http://localhost:5000/docs`
- ReDoc : `http://localhost:5000/redoc`
- OpenAPI JSON : `http://localhost:5000/openapi.json`

Générez un client à partir de `openapi.json` si votre stack le permet.

## 2. Authentification

Envoyez une clé avec chaque requête : `X-API-KEY: <key>` ou `Authorization: Bearer <key>`. `401` signifie aucune clé, `403` une clé inconnue ou une clé en lecture seule sur une route qui modifie quelque chose. Une application de navigateur ou mobile conserve sa clé sur l'appareil de l'utilisateur : donnez-lui une clé **en lecture seule**.

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

## 3. Identifier correctement les instruments

Un ticker n'est pas un identifiant global : un même instrument a plusieurs cotations (devises, places de marché), et un même ticker peut désigner un autre instrument ailleurs. Recherchez les instruments par ISIN (`/assets/by-isin/{isin}`, `/listings?isin=`), et passez `currency` ou `exchange` aux routes de prix quand plusieurs cotations partagent un ticker.

## 4. Temps réel

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

Une connexion par ticker. Les prix arrivent sous forme de chaînes décimales. Une clé en lecture seule ne démarre pas de flux ; abonnez les tickers côté serveur avec `POST /realtime/subscribe`. Voir [Temps réel](../api-reference/realtime.md).

## 5. Erreurs et cache

- Les corps d'erreur sont `{"detail": "..."}`, sauf pour `/eod` (`{"error", "message", "reason"}`).
- `503` signifie qu'un service de l'instance n'est pas disponible (base de données non migrée, Redis arrêté, worker non démarré).
- La plupart des réponses sont mises en cache dans Redis (EOD 24 h, données fondamentales 1 h, DCF 6 h, actualités 30 min…) ; les paramètres `nocache`, `refresh` ou `force_refresh` contournent le cache là où ils existent.
- Les réponses de données fondamentales indiquent leurs sources (`Sources`) ; aucun en-tête de réponse ne nomme le fournisseur.

## Étapes suivantes

- [Actifs et cotations](../api-reference/assets.md)
- [Configuration du temps réel](../guides/configure-realtime.md)
- [Couches et ports](../architecture/hexagonal.md)
