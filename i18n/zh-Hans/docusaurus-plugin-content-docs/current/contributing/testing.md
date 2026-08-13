---
id: "testing"
title: "测试指南与执行"
sidebar_label: "测试指南"
description: "如何使用 pytest 运行单元测试、集成测试及架构测试"
---


# 测试指南与执行

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

# Test 新闻聚合器 & scrapers
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
