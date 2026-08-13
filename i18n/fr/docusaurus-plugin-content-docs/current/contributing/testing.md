---
id: "testing"
title: "Directives & Exécution des Tests"
sidebar_label: "Directives des Tests"
description: "Comment exécuter les tests unitaires, d'intégration et d'architecture avec pytest"
---


# Directives & Exécution des Tests

Fonrex relies on `pytest` for unit, integration, and architectural verification.

## Exécuter les Tests

Execute the complete test suite:

```bash
pytest
```

### Exécuter des Modules de Test Spécifiques

```bash
# Test technical indicators engine
pytest tests/test_technical_indicators.py

# Test DCF valuation calculations
pytest tests/test_dcf_service.py

# Test Agrégateur d'Actualités & scrapers
pytest tests/test_news_service.py

# Test Provider Monitoring & Validation Layer
pytest tests/test_monitoring.py
```

### Exécuter les Tests avec Rapport de Couverture

```bash
pytest --cov=. --cov-report=term-missing
```

## Écrire des Tests

1. Place unit tests inside `tests/`. Name test files `test_*.py`.
2. Use `pytest-mock` to mock external scraping network requests (`httpx`, `requests`, `yfinance`).
3. Ensure no external web requests are made during unit test execution.
