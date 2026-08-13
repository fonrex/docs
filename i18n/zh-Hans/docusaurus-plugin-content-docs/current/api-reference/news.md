---
id: "news"
title: "新闻聚合器 API 参考"
sidebar_label: "新闻聚合"
description: "多源金融新闻订阅、特定代码文章及后台摄取 Endpoint"
---


# 新闻聚合器 API 参考

新闻聚合器 API 通过 7 个抓取器收集、去重和分类金融新闻文章：Yahoo Finance、Google Finance、ZoneBourse、Boursorama、Investing.com、MarketWatch 和 MSN Finance。

---

## <span className="api-method get">GET</span> `/news/{ticker}`

获取提及特定股票代码的金融新闻文章。结果在 Redis 中缓存 30 分钟。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Financial ticker (e.g. `AIR.PA`, `AAPL`) |
| `limit` | `integer` | ❌ | `20` | Number of articles |
| `lang` | `string` | ❌ | — | Language filter (`en`, `fr`) |

### 响应示例

```json
{
  "ticker": "AIR.PA",
  "count": 2,
  "articles": [
    {
      "id": 842,
      "title": "Airbus Delivers 65 Aircraft in July, Reaffirms Full-Year Target",
      "summary": "Airbus reported strong commercial airplane deliveries for July...",
      "url": "https://www.marketwatch.com/story/airbus-delivers-65-aircraft-2026",
      "source": "MarketWatch",
      "provider": "marketwatch_news",
      "author": "Financial Desk",
      "published_at": "2026-08-10T14:30:00Z",
      "sentiment": "POSITIVE",
      "sentiment_score": 0.78,
      "language": "en"
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/news/feed`

获取覆盖所有资产的全局金融新闻订阅。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `limit` | `integer` | ❌ | `20` | Maximum items to return |
| `lang` | `string` | ❌ | — | Filter by language (`en`, `fr`) |
| `provider` | `string` | ❌ | — | Filter by provider (e.g. `zonebourse_news`) |

---

## <span className="api-method post">POST</span> `/news/{ticker}/refresh`

触发股票代码新闻抓取器的后台异步刷新，而不会阻塞请求。

---

## <span className="api-method get">GET</span> `/news/stats`

获取全局新闻聚合器统计数据（索引的文章总数、提供商分布、语言计数）。
