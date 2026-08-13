---
id: "docker"
title: "Docker 生产部署"
sidebar_label: "Docker 部署"
description: "生产容器化、反向代理设置及 Docker Compose 部署模式"
---


# Docker 生产部署

本指南概述了使用 Docker、NGINX 和 TLS/SSL 加密在生产环境中部署 Fonrex 的最佳实践。

## Production `docker-compose.yml` Overrides

Create a `docker-compose.prod.yml` file to tune resource limits and restart policies:

```yaml
version: '3.8'

services:
  fonrex-api:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4096M
        reservations:
          cpus: '0.5'
          memory: 1024M

  fonrex-db:
    restart: always
    deploy:
      resources:
        limits:
          memory: 4096M

  fonrex-redis:
    restart: always
    command: redis-server --save 60 1 --loglevel notice --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Running Production Stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## NGINX Reverse Proxy Example

```nginx
server {
    listen 443 ssl http2;
    server_name api.fonrex.io;

    ssl_certificate /etc/letsencrypt/live/api.fonrex.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.fonrex.io/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
