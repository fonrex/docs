---
id: "adding-custom-provider"
title: "Référence d'implémentation d'un fournisseur personnalisé"
sidebar_label: "Ajouter un fournisseur personnalisé"
description: "Squelette d'un fournisseur de données fondamentales et utilitaires de BaseFinancialProvider"
---

# Référence d'implémentation d'un fournisseur personnalisé

Les étapes autour d'un nouveau fournisseur (enregistrement, unités, canary, tests, couverture) se trouvent dans le [guide](../guides/adding-providers.md). Cette page présente le code.

## Squelette

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

Ici, `dividend_yield` est un pourcentage affiché (`3.45`) : déclarez-le pour `MySite` dans `monitoring/units.py`.

## `FinancialMetrics`

Champs de `financials/models.py` : `revenue`, `ebitda`, `net_income`, `eps`, `payout_ratio`, `dividend_yield`, `debt_to_equity`, `isin`, `pe_ratio`, `profit_margin`, `operating_margin`, `esg_score`, `risk_level`, `morningstar_rating`, `eligibility`, `piotroski_score`, `beneish_m_score`, `roic`, `gf_score`, `provider_url`, `ticker`.

## Utilitaires de `BaseFinancialProvider`

| Utilitaire | Usage |
|---|---|
| `await self._get(url, headers=, params=)` | Texte d'une page, ou `None` |
| `await self._get_json(url, ...)` / `await self._post_json(url, ...)` | JSON décodé, ou `None` |
| `async with self._session() as client` | Plusieurs requêtes partageant les cookies (`client.get`, `client.post`) |
| `self._get_headers(extra)` | En-têtes de type navigateur avec un User-Agent tournant |
| `self._safe_float(value)`, `self._safe_int(value)` | Conversions tolérantes |

Attributs de classe : `name`, `timeout` (secondes), `max_retries` (3), `retry_delay` (1 s, doublé à chaque tentative), `_semaphore` (une limite de concurrence propre au fournisseur).

Chaque requête suit la même politique : les erreurs réseau et les statuts 429, 500, 502, 503, 504 sont retentés avec une pause croissante ; 400, 401, 403, 404 et 410 sont définitifs ; un `Retry-After` supérieur à 10 secondes est plafonné. Au plus `FONREX_PROVIDER_MAX_CONCURRENCY` requêtes (4) s'exécutent en même temps par fournisseur, et `FONREX_PROXY_URL`, s'il est défini, les fait passer par un proxy.

## Nombres

```python
from financials.numbers import find_number, parse_number

parse_number("1 234,5 M€", decimal=",")   # 1234500000.0
parse_number("(12.3)", decimal=".")      # -12.3  (accounting parentheses)
parse_number("80,95 Md", decimal=",")     # 80950000000.0
find_number("Dividend yield: 3.45 % (2025)")   # 3.45
```

`decimal` est le séparateur décimal de la page : `,` (la valeur par défaut de `parse_number`) pour les pages françaises, `.` pour les pages anglaises. Un texte qui contient plus qu'un nombre est rejeté plutôt qu'à moitié lu.
