---
id: "fundamentals"
title: "Référence API Fondamentaux Financiers"
sidebar_label: "Fondamentaux"
description: "Endpoints pour les métriques fondamentales multi-providers, états financiers et ratios de valorisation"
---


# Référence API Fondamentaux Financiers

L'API des fondamentaux agrège les métriques financières, statistiques clés, bilans, comptes de résultat, flux de trésorerie et consensus d'analystes à travers plus de 14 providers fondamentaux.

---

## <span className="api-method get">GET</span> `/fundamental`

Agréger les statistiques financières clés (Ratio PER, rendement du dividende, capitalisation boursière, valeur d'entreprise, Beta, scores ESG) entre providers.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ❌ | — | Symbole ticker (ex. `TSLA`) |
| `isin` | `string` | ❌ | — | Code ISIN (e.g. `US88160R1014`) |
| `exchange` | `string` | ❌ | — | Code de place financière |
| `currency` | `string` | ❌ | — | Filtre par devise |
| `provider` | `string` | ❌ | — | Surcharge spécifique de provider (ex. `ZoneBourse`, `Gurufocus`, `YahooFinance`) |

### Exemple de Réponse

```json
{
  "asset_profile": {
    "isin": "US88160R1014",
    "name": "Tesla, Inc.",
    "ticker": "TSLA",
    "sector": "Consumer Cyclical"
  },
  "metrics": {
    "market_cap": 750230000000,
    "pe_ratio": 62.4,
    "forward_pe": 48.1,
    "dividend_yield": 0.0,
    "beta": 2.34,
    "price_to_sales": 7.82,
    "roe": 0.194
  },
  "providers_used": ["ZoneBourse", "Gurufocus", "YahooFinance"]
}
```

### Exemples

#### cURL
```bash
curl -s "http://localhost:5000/fundamental?ticker=TSLA"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/fundamental", params={"ticker": "TSLA"})
data = resp.json()
print("Market Cap:", data["metrics"]["market_cap"])
```

---

## <span className="api-method get">GET</span> `/fundamental/deep`

Récupérer des données financières structurées approfondies incluant snapshots quotidiens, états financiers, historique du bénéfice par action (EPS) et recommandations consensus des analystes.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Symbole ticker (e.g. `AIR.PA`) |

### Exemple de Réponse

```json
{
  "highlights": {
    "pe_ratio": 28.5,
    "enterprise_value": 110500000000,
    "roe": 0.162,
    "roa": 0.054
  },
  "financial_statements": [
    {
      "statement_type": "income",
      "period_type": "annual",
      "period_end": "2025-12-31",
      "revenue": 65400000000,
      "net_income": 4200000000
    }
  ],
  "analyst_ratings": {
    "consensus": "Buy",
    "target_mean": 165.0,
    "strong_buy": 12,
    "buy": 8,
    "hold": 4,
    "sell": 1
  }
}
```
