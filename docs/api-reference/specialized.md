---
id: "specialized"
title: "Specialized Providers API Reference"
sidebar_label: "Specialized"
description: "SEC insider transactions, UCITS ETF details from JustETF and index constituents"
---

# Specialized Providers API Reference

Three routes query one specialised source each. Every route accepts `refresh=true` to bypass the cache.

---

## <span className="api-method get">GET</span> `/insider-transactions/{ticker}`

Form 4 insider transactions filed with the US SEC (EDGAR). Cached 12 hours.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ticker` | string | — | A share that files with the SEC (e.g. `AAPL`) |
| `limit` | integer | `20` | Transactions returned |
| `refresh` | boolean | `false` | Ask EDGAR again |

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

`transaction_type` is the reading of the Form 4 code (`P` Buy, `S` Sell, `A` Award, `M` Option Exercise, `G` Gift, `F` Tax Withholding…). Set `SEC_EDGAR_EMAIL` to your own address: the SEC requires a contact in the User-Agent of automated clients. Values are illustrative.

---

## <span className="api-method get">GET</span> `/etf/{isin}/details`

UCITS ETF data from JustETF. Cached 24 hours. An ISIN known as something other than an ETF is refused.

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

The answer is not written to the `etf_details` and `etf_holdings` tables.

---

## <span className="api-method get">GET</span> `/index/{index_name}/constituents`

Members of an index, read from Wikipedia. Cached 7 days.

`index_name` is `SP500`, `CAC40`, `NASDAQ100` or `DAX` (case-insensitive). Another name answers `400`.

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
