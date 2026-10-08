---
id: "adding-custom-provider"
title: "自定义数据提供方实现参考"
sidebar_label: "添加自定义数据提供方"
description: "基本面数据提供方的骨架代码及 BaseFinancialProvider 的辅助方法"
---

# 自定义数据提供方实现参考

新数据提供方的相关步骤（注册、单位、canary、测试、覆盖率）请参阅[指南](../guides/adding-providers.md)。本页介绍代码。

## 骨架代码

```python
"""MySite: fundamentals read from https://mysite.example."""

import logging
from typing import Optional

from selectolax.parser import HTMLParser

from financials.models import FinancialMetrics
from financials.numbers import parse_number
from financials.providers.base import BaseFinancialProvider

logger = logging.getLogger(__name__)


class MySiteProvider(BaseFinancialProvider):
    name = "MySite"
    timeout = 10.0

    SEARCH_URL = "https://mysite.example/api/search"
    BASE_URL = "https://mysite.example"

    async def get_financials(self, ticker: str) -> Optional[FinancialMetrics]:
        """``ticker`` is the search term chosen by the runner (mapping, ISIN or ticker)."""
        async with self._session() as client:  # cookies kept between the two requests
            found = await client.get(self.SEARCH_URL, params={"q": ticker})
            if found.status_code != 200 or not found.json().get("results"):
                return None
            path = found.json()["results"][0]["url"]
            page = await client.get(self.BASE_URL + path)
            if page.status_code != 200:
                return None
        metrics = self._parse_page(HTMLParser(page.text), ticker)
        metrics.provider_url = self.BASE_URL + path
        return metrics

    def _parse_page(self, parser: HTMLParser, ticker: str) -> FinancialMetrics:
        metrics = FinancialMetrics(ticker=ticker)
        for row in parser.css("table.key-figures tr"):
            label = row.css_first("th")
            value = row.css_first("td")
            if not label or not value:
                continue
            text = value.text(strip=True)
            match label.text(strip=True):
                case "P/E":
                    metrics.pe_ratio = parse_number(text, decimal=".")
                case "Dividend yield":
                    metrics.dividend_yield = parse_number(text, decimal=".")  # "3.45 %" -> 3.45
                case "ISIN":
                    metrics.isin = text
        return metrics
```

这里的 `dividend_yield` 是显示用的百分数（`3.45`）：请在 `monitoring/units.py` 中为 `MySite` 声明它。

## `FinancialMetrics`

`financials/models.py` 中的字段：`revenue`、`ebitda`、`net_income`、`eps`、`payout_ratio`、`dividend_yield`、`debt_to_equity`、`isin`、`pe_ratio`、`profit_margin`、`operating_margin`、`esg_score`、`risk_level`、`morningstar_rating`、`eligibility`、`piotroski_score`、`beneish_m_score`、`roic`、`gf_score`、`provider_url`、`ticker`。

## `BaseFinancialProvider` 的辅助方法

| 辅助方法 | 用途 |
|---|---|
| `await self._get(url, headers=, params=)` | 页面文本，或 `None` |
| `await self._get_json(url, ...)` / `await self._post_json(url, ...)` | 解码后的 JSON，或 `None` |
| `async with self._session() as client` | 共享 cookie 的多个请求（`client.get`、`client.post`） |
| `self._get_headers(extra)` | 类似浏览器的请求头，User-Agent 轮换 |
| `self._safe_float(value)`、`self._safe_int(value)` | 容错转换 |

类属性：`name`、`timeout`（秒）、`max_retries`（3）、`retry_delay`（1 秒，每次尝试后加倍）、`_semaphore`（特定于该数据提供方的并发限制）。

每个请求都遵循相同的策略：网络错误以及状态码 429、500、502、503、504 会以逐渐增加的暂停时间重试；400、401、403、404 和 410 为最终结果；超过 10 秒的 `Retry-After` 会被截断。每个数据提供方同时最多运行 `FONREX_PROVIDER_MAX_CONCURRENCY` 个请求（4），设置了 `FONREX_PROXY_URL` 时，请求会经由代理发送。

## 数字

```python
from financials.numbers import find_number, parse_number

parse_number("1 234,5 M€", decimal=",")   # 1234500000.0
parse_number("(12.3)", decimal=".")      # -12.3  (accounting parentheses)
parse_number("80,95 Md", decimal=",")     # 80950000000.0
find_number("Dividend yield: 3.45 % (2025)")   # 3.45
```

`decimal` 是页面的小数分隔符：法语页面为 `,`（`parse_number` 的默认值），英语页面为 `.`。如果文本包含数字以外的内容，会被直接拒绝，而不会只解析出一部分。
