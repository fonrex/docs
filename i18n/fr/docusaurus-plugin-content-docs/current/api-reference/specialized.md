---
id: "specialized"
title: "Référence API Fournisseurs spécialisés"
sidebar_label: "Spécialisés"
description: "Transactions d'initiés SEC, détails des ETF UCITS via JustETF et composition des indices"
---

# Référence API Fournisseurs spécialisés

Trois routes interrogent chacune une source spécialisée. Chaque route accepte `refresh=true` pour contourner le cache.

---

## <span className="api-method get">GET</span> `/insider-transactions/{ticker}`

Les transactions d'initiés Form 4 déposées auprès de la SEC américaine (EDGAR). Mises en cache 12 heures.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `ticker` | string | — | Une action qui dépose auprès de la SEC (ex. `AAPL`) |
| `limit` | integer | `20` | Nombre de transactions renvoyées |
| `refresh` | boolean | `false` | Interroger à nouveau EDGAR |

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "company_name": "Apple Inc.",
  "transactions": [
    {
      "filing_date": "2026-10-02",
      "insider_name": "COOK TIMOTHY D",
      "insider_title": "Chief Executive Officer",
      "transaction_date": "2026-10-01",
      "transaction_type": "Sell",
      "transaction_code": "S",
      "shares": 50000,
      "price_per_share": 226.1,
      "total_value": 11305000.0,
      "shares_owned_after": 3280000,
      "sec_filing_url": "https://www.sec.gov/Archives/edgar/data/..."
    }
  ],
  "total_count": 1,
  "source": "SEC EDGAR"
}
```

`transaction_type` est la lecture du code Form 4 (`P` Buy, `S` Sell, `A` Award, `M` Option Exercise, `G` Gift, `F` Tax Withholding…). Renseignez `SEC_EDGAR_EMAIL` avec votre propre adresse : la SEC exige un contact dans le User-Agent des clients automatisés. Les valeurs sont données à titre d'illustration.

---

## <span className="api-method get">GET</span> `/etf/{isin}/details`

Les données des ETF UCITS issues de JustETF. Mises en cache 24 heures. Un ISIN connu comme autre chose qu'un ETF est refusé.

```json
{
  "isin": "IE00B4L5Y983",
  "name": "iShares Core MSCI World UCITS ETF USD (Acc)",
  "ticker": "EUNL",
  "net_expense_ratio": "0.0020",
  "total_net_assets": "...",
  "domicile": "Ireland",
  "replication_method": "...",
  "distribution_policy": "Accumulating",
  "index_tracked": "MSCI World",
  "inception_date": "2009-09-25",
  "nb_holdings": 1400,
  "performance": { "...": "..." },
  "top_holdings": [ { "...": "..." } ],
  "allocation": { "...": "..." },
  "provider_url": "https://www.justetf.com/..."
}
```

La réponse n'est pas écrite dans les tables `etf_details` et `etf_holdings`.

---

## <span className="api-method get">GET</span> `/index/{index_name}/constituents`

Les membres d'un indice, lus sur Wikipédia. Mis en cache 7 jours.

`index_name` vaut `SP500`, `CAC40`, `NASDAQ100` ou `DAX` (insensible à la casse). Un autre nom répond `400`.

```json
{
  "index_name": "CAC40",
  "constituents": [
    { "ticker": "AIR.PA", "isin": "NL0000235190", "name": "Airbus", "sector": "Industrie", "sub_sector": null, "weight": null, "country": null, "cik": null }
  ],
  "total_count": 40,
  "source_url": "https://fr.wikipedia.org/wiki/CAC_40",
  "source": "Wikipedia"
}
```
