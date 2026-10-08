---
id: "adding-custom-provider"
title: "Custom Provider Implementation Reference"
sidebar_label: "Adding Custom Provider"
description: "Skeleton of a fundamentals provider and the helpers of BaseFinancialProvider"
---

# Custom Provider Implementation Reference

The steps around a new provider (registration, units, canary, tests, coverage) are in the [guide](../guides/adding-providers.md). This page is the code.

## Skeleton

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

`dividend_yield` here is a displayed percentage (`3.45`): declare it for `MySite` in `monitoring/units.py`.

## `FinancialMetrics`

Fields of `financials/models.py`: `revenue`, `ebitda`, `net_income`, `eps`, `payout_ratio`, `dividend_yield`, `debt_to_equity`, `isin`, `pe_ratio`, `profit_margin`, `operating_margin`, `esg_score`, `risk_level`, `morningstar_rating`, `eligibility`, `piotroski_score`, `beneish_m_score`, `roic`, `gf_score`, `provider_url`, `ticker`.

## Helpers of `BaseFinancialProvider`

| Helper | Use |
|---|---|
| `await self._get(url, headers=, params=)` | Text of a page, or `None` |
| `await self._get_json(url, ...)` / `await self._post_json(url, ...)` | Decoded JSON, or `None` |
| `async with self._session() as client` | Several requests sharing cookies (`client.get`, `client.post`) |
| `self._get_headers(extra)` | Browser-like headers with a rotating User-Agent |
| `self._safe_float(value)`, `self._safe_int(value)` | Tolerant conversions |

Class attributes: `name`, `timeout` (seconds), `max_retries` (3), `retry_delay` (1 s, doubled at each attempt), `_semaphore` (a provider-specific concurrency limit).

Every request goes through the same policy: network errors and the statuses 429, 500, 502, 503, 504 are retried with a growing pause; 400, 401, 403, 404 and 410 are final; a `Retry-After` longer than 10 seconds is capped. At most `FONREX_PROVIDER_MAX_CONCURRENCY` requests (4) run at the same time per provider, and `FONREX_PROXY_URL` routes them through a proxy when set.

## Numbers

```python
from financials.numbers import find_number, parse_number

parse_number("1 234,5 M€", decimal=",")   # 1234500000.0
parse_number("(12.3)", decimal=".")      # -12.3  (accounting parentheses)
parse_number("80,95 Md", decimal=",")     # 80950000000.0
find_number("Dividend yield: 3.45 % (2025)")   # 3.45
```

`decimal` is the decimal separator of the page: `,` (the default of `parse_number`) for French pages, `.` for English ones. A text that is more than a number is rejected rather than half read.
