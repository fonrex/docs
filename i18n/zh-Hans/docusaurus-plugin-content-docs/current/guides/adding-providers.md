---
id: "adding-providers"
title: "指南：添加自定义金融数据提供商"
sidebar_label: "添加自定义提供商"
description: "创建、注册及测试自定义金融数据提供商的循序渐进教程"
---


# 指南：添加自定义金融数据提供商

本指南引导您在 Fonrex 中实现一个新的异步金融提供商。

## 1. Create Provider File

Create a new file under `financials/providers/myprovider_provider.py`:

```python
import logging
from financials.providers.base import BaseFinancialProvider

logger = logging.getLogger(__name__)

class MyProviderProvider(BaseFinancialProvider):
    name = "MyProvider"
    timeout = 8.0  # Network timeout in seconds

    async def fetch(self, ticker: str = None, isin: str = None, **kwargs) -> dict:
        """
        Fetch fundamental metrics for a given ticker or ISIN.
        Return a normalized dictionary of financial indicators.
        """
        search_term = ticker or isin
        if not search_term:
            return {}

        url = f"https://api.example.com/data/{search_term}"
        try:
            response_json = await self._get_json(url)
            return self._parse(response_json)
        except Exception as exc:
            logger.warning("[%s] Failed to fetch data for %s: %s", self.name, search_term, exc)
            return {}

    def _parse(self, data: dict) -> dict:
        return {
          "pe_ratio": data.get("pe"),
          "dividend_yield": data.get("div_yield"),
          "market_cap": data.get("mcap")
        }
```

## 2. Register Provider in `main.py`

Open `main.py` and register your new provider in the `configure_application_state` function:

```python
provider_specs = (
    ("ZoneBourse", "financials.providers.ZoneBourse_provider", "ZoneBourseProvider"),
    ("MyProvider", "financials.providers.myprovider_provider", "MyProviderProvider"),  # Added
    ...
)
```

## 3. Register Canary Health Test

Add a synthetic test ticker to `monitoring/canary_catalog.py` to ensure your new provider is automatically checked every morning at 06:00 UTC by `CanaryMonitor`.

## 4. Add Unit Tests

Create a unit test in `tests/test_myprovider.py` mocking the HTTP client call:

```python
import pytest
from financials.providers.myprovider_provider import MyProviderProvider

@pytest.mark.asyncio
async def test_myprovider_fetch(mocker):
    provider = MyProviderProvider()
    mocker.patch.object(provider, "_get_json", return_value={"pe": 15.4, "div_yield": 0.03})
    
    result = await provider.fetch(ticker="AAPL")
    assert result["pe_ratio"] == 15.4
    assert result["dividend_yield"] == 0.03
```
