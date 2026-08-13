---
id: "adding-providers"
title: "Guide : Ajouter un Provider Financier Personnalisé"
sidebar_label: "Ajouter un Provider Personnalisé"
description: "Tutoriel étape par étape pour créer, enregistrer et tester un provider de données financières personnalisé"
---


# Guide : Ajouter un Provider Financier Personnalisé

Ce guide vous accompagne dans l'implémentation d'un nouveau provider financier asynchrone dans Fonrex.

## 1. Créer le Fichier du Provider

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

## 2. Enregistrer le Provider dans `main.py`

Open `main.py` and register your new provider in the `configure_application_state` function:

```python
provider_specs = (
    ("ZoneBourse", "financials.providers.ZoneBourse_provider", "ZoneBourseProvider"),
    ("MyProvider", "financials.providers.myprovider_provider", "MyProviderProvider"),  # Added
    ...
)
```

## 3. Enregistrer le Test de Santé Canary

Add a synthetic test ticker to `monitoring/canary_catalog.py` to ensure your new provider is automatically checked every morning at 06:00 UTC by `CanaryMonitor`.

## 4. Ajouter des Tests Unitaires

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
