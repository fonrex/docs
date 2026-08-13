---
id: "specialized"
title: "Référence API Providers Spécialisés"
sidebar_label: "Providers Spécialisés"
description: "Endpoints pour les transactions d'initiés SEC EDGAR, métadonnées JustETF et listes de composants d'indices"
---


# Référence API Providers Spécialisés

L'API des providers spécialisés expose des endpoints ciblés pour les transactions d'initiés SEC EDGAR, les détails JustETF et les composants d'indices boursiers.

---

## <span className="api-method get">GET</span> `/insider-transactions/{ticker}`

Récupérer les déclarations de transactions d'initiés Form 4 déposées auprès de la SEC américaine (SEC EDGAR). Mis en cache pendant 12 heures.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker action américaine (ex. `AAPL`, `TSLA`) |

### Exemple de Réponse

```json
{
  "ticker": "AAPL",
  "source": "SEC_EDGAR",
  "count": 1,
  "transactions": [
    {
      "filing_date": "2026-08-01",
      "reporting_owner": "COOK TIMOTHY D",
      "officer_title": "Chief Executive Officer",
      "transaction_type": "P - Purchase",
      "shares": 50000,
      "price_per_share": 220.50,
      "total_value": 11025000
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/etf/{isin}/details`

Extraire les métadonnées ETF, le ratio de frais (TER), les actifs sous gestion (AUM) et les 10 premières positions depuis JustETF.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `isin` | `string` | ✅ | — | Code ISIN d'un ETF européen (ex. `IE00B4L5Y983`) |

### Exemple de Réponse

```json
{
  "isin": "IE00B4L5Y983",
  "name": "iShares Core MSCI World UCITS ETF",
  "ter_pct": 0.20,
  "aum_eur": 65000000000,
  "replication": "Physical",
  "top_holdings": [
    { "name": "Apple Inc.", "weight_pct": 4.85 },
    { "name": "Microsoft Corp.", "weight_pct": 4.20 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/index/{index_name}/constituents`

Récupérer les actions composant les grands indices de marchés financiers (`sp500`, `cac40`, `nasdaq100`, `dax`).

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `index_name` | `string` | ✅ | — | Nom de l'indice (`sp500`, `cac40`, `nasdaq100`, `dax`) |
