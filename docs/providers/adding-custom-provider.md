---
id: "adding-custom-provider"
title: "Custom Provider Implementation Reference"
sidebar_label: "Custom Provider Code"
description: "Code reference skeleton for implementing custom BaseFinancialProvider classes"
---

# Custom Provider Implementation Reference

Below is the complete skeleton code for creating custom financial scrapers by extending `BaseFinancialProvider`.

```python
from financials.providers.base import BaseFinancialProvider
import logging

logger = logging.getLogger(__name__)

class CustomFinancialProvider(BaseFinancialProvider):
    name = "CustomProvider"
    timeout = 8.0  # HTTP request timeout in seconds

    async def fetch(self, ticker: str = None, isin: str = None, **kwargs) -> dict:
        """
        Main asynchronous entrypoint called by FinancialProviderRunner.
        """
        search_target = ticker or isin
        if not search_target:
            return {}

        url = f"https://example.com/api/fundamentals/{search_target}"
        try:
            # Use self._get_json() or self._get_html() from BaseFinancialProvider
            data = await self._get_json(url)
            return self._parse(data, search_target)
        except Exception as exc:
            logger.warning("[%s] Scraping error for %s: %s", self.name, search_target, exc)
            return {}

    def _parse(self, data: dict, ticker: str) -> dict:
        """
        Map provider fields to standard Fonrex dictionary keys.
        """
        return {
            "pe_ratio": data.get("pe"),
            "dividend_yield": data.get("divYield"),
            "market_cap": data.get("marketCap"),
            "ebitda": data.get("ebitda"),
            "net_debt": data.get("netDebt")
        }
```
