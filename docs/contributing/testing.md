---
id: "testing"
title: "Testing Guidelines & Execution"
sidebar_label: "Testing Guidelines"
description: "How to run unit, integration, and architecture tests with pytest"
---

# Testing Guidelines & Execution

Fonrex relies on `pytest` for unit, integration, and architectural verification.

## Running Tests

Execute the complete test suite:

```bash
pytest
```

### Run Specific Test Modules

```bash
# Test technical indicators engine
pytest tests/test_technical_indicators.py

# Test DCF valuation calculations
pytest tests/test_dcf_service.py

# Test News Aggregator & scrapers
pytest tests/test_news_service.py

# Test Provider Monitoring & Validation Layer
pytest tests/test_monitoring.py
```

### Run Tests with Coverage Report

```bash
pytest --cov=. --cov-report=term-missing
```

## Writing Tests

1. Place unit tests inside `tests/`. Name test files `test_*.py`.
2. Use `pytest-mock` to mock external scraping network requests (`httpx`, `requests`, `yfinance`).
3. Ensure no external web requests are made during unit test execution.
