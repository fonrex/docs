---
id: "news-providers"
title: "新闻聚合数据提供方"
sidebar_label: "新闻数据提供方"
description: "7 个新闻数据提供方、其映射以及文章去重"
---

# 新闻聚合数据提供方

对于 `GET /news/{ticker}`，`NewsService`（`news/news_service.py`）会并行查询 `news/providers/` 中的七个数据提供方。

| 模块 | 来源 | 方式 | 语言 |
|---|---|---|---|
| `yfinance_news.py` | Yahoo Finance | `yfinance`（`ticker.news`），按输入的 ticker | `en` |
| `google_finance_news.py` | Google Finance | 内嵌 JSON，HTML 作为回退 | 根据 ticker 后缀推断 |
| `zonebourse_news.py` | ZoneBourse | HTML | `fr` |
| `boursorama_news.py` | Boursorama | HTML | `fr` |
| `investing_news.py` | Investing.com | HTML，需要映射 | `en` |
| `marketwatch_news.py` | MarketWatch | HTML | `en` |
| `msn_finance_news.py` | MSN Finance | JSON 端点，HTML 作为回退 | `en` |

## 映射

有三个数据提供方会读取金融工具的映射，映射按小写的数据提供方名称查找：ZoneBourse（`zonebourse`）和 Boursorama（`boursorama`）与同名的基本面数据提供方共用映射；Investing.com 需要一个名为 `investing_com` 的映射，没有该映射时不返回任何内容。其余四个数据提供方根据 ticker 构建请求。

## 去重

1. **URL** — 转为小写，移除 `utm_*` 参数、片段和末尾斜杠；保留最先收到的文章。
2. **标题** — 对规范化后的标题（小写、去除标点）使用 `difflib.SequenceMatcher`；相似度达到或超过 `NEWS_DEDUP_SIMILARITY`（0.85）时，保留最新的文章。

指定 `language` 时，语言已知且不同的文章会在去重之前被移除。文章按从新到旧排序并截取到 `limit` 篇；向每个数据提供方请求的数量是该值的两倍。

## 存储

属于目录中金融工具的文章会被 upsert 到 `news_articles` 中（`ON CONFLICT (url) DO UPDATE`）；`GET /news/feed` 和 `GET /news/stats` 读取该表。旧文章不会被自动清除。

失败的数据提供方返回空列表，不会阻塞其他数据提供方。
