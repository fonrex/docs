---
id: "docker"
title: "Docker 生产部署"
sidebar_label: "Docker 部署"
description: "在服务器上运行 Fonrex：Compose 覆盖配置、支持 TLS 和 WebSocket 的反向代理、需要暴露哪些服务"
---

# Docker 生产部署

Fonrex 是一个供你自用的自托管应用。在服务器上，运行与本地相同的 `docker-compose.yml`，并在 API 前面放置一个支持 TLS 的反向代理。

## 暴露的服务

| 服务 | 发布地址 | 访问来源 |
|---|---|---|
| `fonrex-api` | `0.0.0.0:5000` | 仅限反向代理——在服务器上将其绑定到 `127.0.0.1`（见下方覆盖配置） |
| `db` | `127.0.0.1:5432` | 仅限宿主机 |
| `redis` | `127.0.0.1:6379` | 仅限宿主机（Redis 没有密码） |

除 `/health`、文档、OpenBB 发现文件和 `/static` 之外，所有 API 路由都需要密钥。请为本机以外的客户端（仪表板、Google Sheets）提供**只读**密钥。

## Compose 覆盖配置

创建 `docker-compose.prod.yml`：

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

`!override` 会替换端口列表，而不是向其追加；它需要 Docker Compose 2.24 或更高版本。

保持 `WEB_CONCURRENCY=1`：实时数据流、WebSocket 客户端和每日金丝雀都位于 API 进程中，每增加一个 worker 都会将它们复制一份。

## 反向代理（NGINX）

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

Gunicorn 以 120 秒超时运行：首次采集或查询所有数据提供方的 `/fundamental` 请求可能需要数秒。

如果没有服务器，可以使用隧道（zrok、Cloudflare Tunnel、Tailscale Funnel）为本地实例提供 HTTPS URL——参见 [Google Sheets 指南](../guides/google-sheets-connector.md)。

## 出站请求

向数据源发出请求的是你服务器的 IP 地址。受反机器人服务保护的网站可能会拒绝数据中心 IP；请让这些数据提供方通过代理访问：

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
```

## 数据与备份

数据库位于 `timescale_data` 卷中。每次升级前，请使用 `pg_dump` 进行备份（参见 [Docker Compose](../getting-started/docker-compose.md#backing-up-the-database)），并且不要将转储文件纳入 Git。
