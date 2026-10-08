---
id: "adding-providers"
title: "Guide: Adding a Fundamentals Provider"
sidebar_label: "Adding Providers"
description: "Every step a new fundamentals provider needs: code, registration, units, canary, tests and coverage floor"
---

# Guide: Adding a Fundamentals Provider

A provider of `/fundamental` is a class of `financials/providers/` that turns a website or an API into a `FinancialMetrics` object. The repository enforces each step below with a test: a provider that misses one fails `make ci`. The rules come from `AGENTS.md`.

## 1. Write the provider

Create `financials/providers/MySite_provider.py`, a subclass of `BaseFinancialProvider` implementing `get_financials(ticker)`. The [reference page](../providers/adding-custom-provider.md) has a complete skeleton.

- **One HTTP layer.** Never create an HTTP client: use `self._get()`, `self._get_json()`, `self._post_json()` or `async with self._session()` (cookies shared between a search and a page). Retries, pauses, the per-provider concurrency limit and the proxy live there. *(`tests/test_provider_http_policy.py`)*
- **Numbers are read in one place.** Turn a displayed text into a number with `parse_number` (a cell) or `find_number` (a sentence) of `financials/numbers.py`: signs, thousands separators, scales (`k`, `M`, `Md`, `B`) and currencies are handled there. No `float()` on a scraped text. *(`tests/test_numbers.py`)*
- **Return the ISIN when the page shows it.** The runner rejects an answer about another ISIN — a site searched by ticker may return a homonym.

The runner gives your provider, in this order: its `provider_url` mapping, its `provider_ticker` mapping, the ISIN (for providers searched by ISIN), or the ticker.

## 2. Register it

Add a line to `PROVIDER_SPECS` in `main.py`:

```python
PROVIDER_SPECS = (
    ...
    ("MySite", "financials.providers.MySite_provider", "MySiteProvider"),
)
```

A provider that cannot be imported is listed in `providers.unavailable` of `GET /health` instead of disappearing silently. *(`tests/test_docs_consistency.py`)*

## 3. Declare its units

Monitoring ranges are ratios (a 3.45 % yield is `0.0345`). If your provider returns displayed percentages (`3.45`), declare those fields in `PROVIDER_PERCENT_FIELDS` of `monitoring/units.py`; a provider returning ratios is declared with an empty set. *(`tests/test_provider_units.py`)*

## 4. Add it to the canary

Add the provider to `MONITORED_PROVIDERS` and `_PROVIDER_IMPORTS` in `monitoring/canary_catalog.py`, so that the daily canary checks it against the canary assets. An EU-only provider is tested on EU tickers only.

## 5. Test it without network

Tests never reach a real website. Save a reduced copy of a real page in `tests/fixtures/providers/` and serve it with the `fake_network` fixture of `tests/conftest.py`:

```python
async def test_my_site_reads_the_displayed_figures(fake_network):
    page = (FIXTURES / "mysite_airbus.html").read_text(encoding="utf-8")
    fake_network.get("mysite.example/search", httpx.Response(200, json={"url": "/airbus"}))
    fake_network.get("mysite.example/airbus", httpx.Response(200, text=page))

    metrics = await MySiteProvider().get_financials("AIR.PA")

    assert metrics.pe_ratio == pytest.approx(24.1)
    assert fake_network.calls("mysite.example") == 2
```

A request without a canned response fails the test.

## 6. Give it a coverage floor

Every module of `financials/providers/` has a coverage floor in `scripts/check_coverage_distribution.py`. Add yours; floors only go up. *(`tests/test_coverage_gate.py`)*

## 7. Update the documents

The provider count of `README.md` is checked against the code, and `ARCHITECTURE.md` lists the providers. Then run the whole gate:

```bash
make ci
```
