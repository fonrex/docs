---
id: "docker"
title: "Déploiement Docker en production"
sidebar_label: "Déploiement Docker"
description: "Exécuter Fonrex sur un serveur : surcharges Compose, reverse proxy avec TLS et WebSocket, ce qu'il faut exposer"
---

# Déploiement Docker en production

Fonrex est une application auto-hébergée pour votre propre usage. Sur un serveur, exécutez le même `docker-compose.yml` qu'en local et placez un reverse proxy avec TLS devant l'API.

## Ce qui est exposé

| Service | Publié sur | Accessible depuis |
|---|---|---|
| `fonrex-api` | `0.0.0.0:5000` | Le reverse proxy uniquement : liez-le à `127.0.0.1` sur un serveur (surcharge ci-dessous) |
| `db` | `127.0.0.1:5432` | L'hôte uniquement |
| `redis` | `127.0.0.1:6379` | L'hôte uniquement (Redis n'a pas de mot de passe) |

Toutes les routes de l'API sauf `/health`, la documentation, les fichiers de découverte OpenBB et `/static` exigent une clé. Donnez aux clients extérieurs à la machine (tableaux de bord, Google Sheets) une clé **en lecture seule**.

## Surcharge Compose

Créez `docker-compose.prod.yml` :

```yaml
services:
  fonrex-api:
    ports: !override
      - "127.0.0.1:5000:5000"
    deploy:
      resources:
        limits:
          memory: 4g

  db:
    deploy:
      resources:
        limits:
          memory: 4g
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

`!override` remplace la liste des ports au lieu d'y ajouter ; il nécessite Docker Compose 2.24 ou plus récent.

Gardez `WEB_CONCURRENCY=1` : les flux temps réel, les clients WebSocket et le canari quotidien vivent dans le processus de l'API, et chaque worker supplémentaire les dupliquerait.

## Reverse proxy (NGINX)

```nginx
server {
    listen 443 ssl http2;
    server_name fonrex.example.com;

    ssl_certificate     /etc/letsencrypt/live/fonrex.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fonrex.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

Gunicorn tourne avec un délai d'expiration de 120 secondes : une première ingestion ou une requête `/fundamental` qui interroge tous les fournisseurs peut prendre plusieurs secondes.

Sans serveur, un tunnel (zrok, Cloudflare Tunnel, Tailscale Funnel) donne une URL HTTPS à une instance locale : voir le [guide Google Sheets](../guides/google-sheets-connector.md).

## Requêtes sortantes

C'est l'adresse IP de votre serveur qui effectue les requêtes vers les sources de données. Les sites protégés par un service anti-bot peuvent refuser une IP de datacenter ; faites passer ces fournisseurs par un proxy :

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
```

## Données et sauvegardes

La base se trouve dans le volume `timescale_data`. Sauvegardez-la avec `pg_dump` (voir [Docker Compose](../getting-started/docker-compose.md#backing-up-the-database)) avant chaque mise à jour, et gardez les dumps hors de Git.
