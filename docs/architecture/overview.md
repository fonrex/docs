---
id: "overview"
title: "Architecture Overview"
sidebar_label: "System Overview"
description: "High-level architectural overview and data flow diagrams of the Fonrex system"
---

# Architecture Overview

Fonrex is designed as a modular financial data processing pipeline. It decouples market data providers, business logic, storage engines, and client transport protocols.

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client Space
        Client[HTTP / WebSocket Clients]
    end

    subgraph API [FastAPI Service Layer]
        Main[main.py]
        CM[ConnectionManager]
        Worker[RealtimePriceWorker]
        VL[ValidationLayer]
        Canary[CanaryMonitor]
        NS[NewsService]
        DCF[DCFService]
    end

    subgraph External Data Sources
        TV[TradingView WS]
        YF[yfinance / Yahoo]
        P1[ZoneBourse / Gurufocus]
        P2[SEC EDGAR / JustETF]
        NP[7x News Web Scrapers]
    end

    subgraph Storage & Cache
        Redis[(Redis 7 Cache / PubSub)]
        DB[(PostgreSQL / TimescaleDB)]
    end

    Client -- REST HTTP --> Main
    Client -- WebSocket --> CM
    CM -- Subscribes --> Redis
    
    Worker -- Streams ticks --> TV
    Worker -- Cache & Publish --> Redis
    Worker -- Persist 1min candles --> DB

    Main --> DB
    Main --> Redis
    Main --> YF
    Main --> P1
    Main --> P2

    NS --> NP
    NS --> Redis
    NS --> DB

    VL --> DB
    Canary --> P1
    Canary --> DB
```

## Key Components

1. **FastAPI Transport Layer (`routers/`)**: Receives incoming REST and WebSocket requests, converts transport DTOs to internal business entities, and handles status codes.
2. **Use Case Layer (`use_cases/`)**: Contains pure application business rules. Free from FastAPI or SQLAlchemy dependencies.
3. **Storage & Services (`database/`, `cache/`, `historical/`)**: Interfaces with TimescaleDB hypertables for OHLCV bars and Redis for volatile caches.
4. **Scraping & Providers (`financials/providers/`, `news/providers/`)**: Asynchronous connectors scraping financial metrics, insider trades, and financial news.
5. **Quality Assurance (`monitoring/`)**: Performs real-time consensus checking and automated daily canary synthetic queries against upstream providers.
