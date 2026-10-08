---
id: "news"
title: "新闻聚合 API 参考"
sidebar_label: "新闻"
description: "来自 7 个数据提供方并经过去重的代码相关新闻，以及已存储文章的全局信息流"
---

# 新闻聚合 API 参考

`GET /news/{ticker}` 并行查询七个数据提供方——Yahoo Finance、Google Finance、ZoneBourse、Boursorama、Investing.com、MarketWatch 和 MSN Finance——去除重复内容，并将目录中金融工具的文章存储到 `news_articles`。参见[新闻数据提供方](../providers/news-providers.md)。

---

## <span className="api-method get">GET</span> `/news/{ticker}`

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ticker` | string | — | 代码（例如 `AIR.PA`） |
| `limit` | integer | `20` | 返回的文章数（最多 `NEWS_MAX_LIMIT`，即 100） |
| `language` | string | — | 仅保留该语言（`en`、`fr`……）；语言未知的文章会保留。`all` 表示不筛选 |
| `force_refresh` | boolean | `false` | 忽略已缓存的响应 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/news/AIR.PA?limit=5&language=fr"
```

```json
{
  "ticker": "AIR.PA",
  "isin": "NL0000235190",
  "count": 1,
  "providers": ["boursorama"],
  "cached": false,
  "articles": [
    {
      "title": "Airbus : livraisons en hausse en septembre",
      "summary": "...",
      "url": "https://www.boursorama.com/bourse/actualites/...",
      "image_url": null,
      "source": "Boursorama",
      "provider": "boursorama",
      "author": null,
      "published_at": "2026-10-08T07:45:00Z",
      "related_tickers": [],
      "language": "fr"
    }
  ]
}
```

每个响应缓存 30 分钟（`NEWS_CACHE_TTL`），按每个 `limit` 和语言分别缓存。失败的数据提供方不返回任何内容，但不会阻塞其他数据提供方。

### 去重

1. **URL**：转为小写，移除 `utm_*` 参数、片段和末尾斜杠。保留最先收到的文章。
2. **标题相似度**：对规范化后的标题使用 `difflib.SequenceMatcher`；相似度达到或超过 `NEWS_DEDUP_SIMILARITY`（0.85）时，保留最新的文章。

随后文章按最新的在前排序，并截取为 `limit` 篇（向每个数据提供方请求的数量是该值的两倍）。

---

## <span className="api-method get">GET</span> `/news/feed`

`news_articles` 中存储的最新文章，涵盖所有金融工具。不会从数据提供方获取任何内容。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `limit` | integer | `50` | 返回的文章数 |
| `language` | string | — | 语言筛选（`all` = 不筛选） |
| `tickers` | string | — | 以逗号分隔的代码；保留与其中任一代码相关的文章 |

```json
{ "count": 0, "from_date": null, "to_date": null, "articles": [] }
```

---

## <span className="api-method post">POST</span> `/news/{ticker}/refresh`

在后台重新获取某个代码的新闻并立即返回：`{"status": "queued", "ticker": "AIR.PA"}`。仅限完全访问密钥。

---

## <span className="api-method get">GET</span> `/news/stats`

```json
{
  "total_articles": 0,
  "by_provider": {},
  "by_language": {},
  "last_fetched_at": null,
  "top_assets": {}
}
```
