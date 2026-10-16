---
id: "sec-filings"
title: "SEC Filings API Reference (XBRL)"
sidebar_label: "SEC Filings (XBRL)"
description: "Annual statements filed with the SEC, read from the XBRL facts of EDGAR, and the Yahoo statements checked against them"
---

# SEC Filings API Reference (XBRL)

A company listed in the United States files its annual report with the [SEC](https://www.sec.gov/edgar), and each figure of it is published as an **XBRL fact**: a concept (`us-gaap:Revenues`), a unit, a period, a value and the filing it comes from. Fonrex reads these facts (free API, no key), keeps them in your database and uses them as a **source of verification** for the statements stored from Yahoo Finance.

| Route | What it does |
|---|---|
| `GET /sec/{ticker}/statements` | The annual statements filed with the SEC, each figure with its concept and its filing |
| `GET /sec/{ticker}/check` | The Yahoo statements checked against the SEC filings, figure by figure |
| `POST /sec/{ticker}/refresh` | Looks the company up again and reads its facts now |

The Form 4 insider transactions stay on [`GET /insider-transactions/{ticker}`](./specialized.md).

## Which instruments

The SEC files its data by company, under a **CIK** (Central Index Key). Fonrex never guesses it from a ticker: `AIR.PA` is Airbus in Paris, while `AIR` at the SEC is AAR Corp, a US company. A CIK taken from the wrong ticker would give the statements of another company without any error.

- Only a **US listing** of the instrument is looked up: quoted in USD, on a US exchange, with a ticker that names no foreign exchange. `AIR.PA` and `SAP.DE` are never sent to the SEC.
- The ticker must be in the [table of the SEC](https://www.sec.gov/files/company_tickers_exchange.json), and the **name** of the company there must match the name of the instrument in your catalogue.
- The CIK found is kept for the **instrument** (one ISIN): every listing of it shares the same filings. An ADR has an ISIN of its own, so it is an instrument of its own: the NYSE ADR of SAP (`US8030542042`, named *ADR on SAP SE* or *SAP SE ADR*) is found, the German share `SAP.DE` (`DE0007164600`) is not.
- When several instruments share a ticker (`MSFT` for Microsoft and for a Leverage Shares tracker, say), add `isin=` to choose one.
- An instrument without US listing gets `404` with the reason. It is not looked up again for 7 days; `POST /sec/{ticker}/refresh` looks it up at once (after you add a US listing, for instance).
- A CIK you set yourself in `asset_mappings` (provider `SEC`, `source` = `manual`, no listing) is trusted as it is.

## How the statements are read

- **Annual reports only**: forms `10-K` (US companies), `20-F` (foreign companies), `40-F` (Canadian companies) and their amendments.
- **A fiscal year is a period of 350 to 380 days**; a balance sheet figure is a fact at the end of the year. The nine-month figures of a quarterly report are never taken for a year.
- **A restatement wins**: a 10-K repeats the two previous years and may correct them. For each period, the value of the latest filing is kept, and the figure says which filing it comes from.
- **Several concepts for one figure**: revenue is `Revenues` at JPMorgan, `RevenueFromContractWithCustomerExcludingAssessedTax` at Apple, `Revenue` (IFRS) at SAP. Each figure lists its concepts in order and the first one filed for the year is taken; the answer names it.
- **One currency per year**: the currency of the latest annual report. A foreign filer reporting in euros gives euros, never a mix of euros and dollars.
- **Values as filed**: payments (`capex`, `dividends_paid`, `stock_repurchases`) are **positive** amounts, where Yahoo gives negative cash flows. A figure the company does not file is absent: a bank has no `operating_income`.

### Figures

| Statement | Figures |
|---|---|
| Income | `revenue`, `gross_profit`, `operating_income`, `net_income`, `eps_basic`, `eps_diluted`, `shares_basic`, `shares_diluted`, `rd_expense`, `sga_expense`, `interest_expense`, `tax_provision` |
| Balance sheet | `total_assets`, `total_liabilities`, `total_equity`, `cash_and_equivalents`, `short_term_investments`, `accounts_receivable`, `inventory`, `goodwill`, `intangible_assets`, `long_term_debt`, `retained_earnings` |
| Cash flow | `operating_cashflow`, `investing_cashflow`, `financing_cashflow`, `capex`, `dividends_paid`, `stock_repurchases`, `depreciation_amortization` |

The names are those of the columns of `financial_statements`, so a figure of the SEC and the same figure of Yahoo have the same name.

## Freshness

The facts of a company are read from the SEC the first time they are asked, all at once (one file per company, 4 to 8 MB for the largest). After that:

- a company read less than **`SEC_XBRL_REFRESH_HOURS`** hours ago (24 by default) is answered from the database;
- an older one is read again; a new filing adds its years and replaces the values it restates;
- when the SEC does not answer, the stored figures are given with `load.status` = `failed` and the reason.

Every answer says, in `load`, what was done: `fetched` (read now), `fresh` (read recently) or `failed`, with `last_filed` (the latest filing kept) and `facts` (the facts kept).

The SEC asks every automated client to give a contact address. Set **`SEC_EDGAR_EMAIL`** to your own address: the API logs a warning at start-up while it is the address of the example.

---

## <span className="api-method get">GET</span> `/sec/{ticker}/statements`

The annual statements filed with the SEC, most recent fiscal year first.

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `years` | every year | Most recent fiscal years given (1 to 30) |
| `isin` | — | The instrument, when several share the ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/statements?years=1"
```

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "entity_name": "Apple Inc.",
  "source": "SEC EDGAR, XBRL company facts (https://www.sec.gov/edgar)",
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-16T09:00:00Z",
    "last_filed": "2025-10-31",
    "facts": 1240,
    "reason": null
  },
  "years": [
    {
      "period_end": "2025-09-27",
      "currency": "USD",
      "figures": {
        "revenue": {
          "value": 416161000000.0,
          "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
          "taxonomy": "us-gaap",
          "unit": "USD",
          "form": "10-K",
          "filed": "2025-10-31",
          "accession": "0000320193-25-000079",
          "filing_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/"
        },
        "net_income": { "value": 112010000000.0, "concept": "NetIncomeLoss", "...": "..." },
        "eps_diluted": { "value": 7.46, "unit": "USD/shares", "...": "..." },
        "capex": { "value": 12715000000.0, "concept": "PaymentsToAcquirePropertyPlantAndEquipment", "...": "..." }
      }
    }
  ]
}
```

`period_end` is the end of the fiscal year as filed: Apple closes its year on the last Saturday of September. `filing_url` opens the folder of the filing on EDGAR.

---

## <span className="api-method get">GET</span> `/sec/{ticker}/check`

The statements stored from Yahoo checked against the SEC filings. For each fiscal year filed, each figure both sources define alike gets a status:

| `status` | Meaning |
|---|---|
| `match` | Same value within **`SEC_CHECK_TOLERANCE`** (1 % by default) |
| `mismatch` | A gap larger than the tolerance: worth a look |
| `missing_yahoo` | Filed with the SEC, absent at Yahoo |
| `missing_sec` | Given by Yahoo, not filed with the SEC |

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `years` | every year | Most recent fiscal years given (1 to 30) |
| `isin` | — | The instrument, when several share the ticker |

How the two sources are put side by side:

- **A year is matched by its end**, two weeks apart at most: Yahoo dates Apple's year ending on 27 September 2025 at the 30th. `yahoo_period_end` gives the date matched, `null` when Yahoo has no such year.
- **`difference`** is `(yahoo - sec) / |sec|`, as a ratio. Capex, dividends paid and interest expense are compared as **amounts**, their sign left aside.
- **Figures compared**: revenue, gross profit, operating income, net income, EPS and share counts (basic and diluted), interest expense, income tax, total assets, total liabilities, the three cash flows, capex and dividends paid.
- **Not compared**, because the two sources define them differently (listed in `not_compared`): cash (Yahoo may add the short-term investments) and equity (Yahoo includes the minority interests).
- **A year Yahoo does not have** (deep enrichment never run, or Yahoo gives fewer years) and **a year in another currency** are not compared: they have no figures and a `note` that says why.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/check?years=1"
```

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "entity_name": "Apple Inc.",
  "source": "SEC EDGAR, XBRL company facts (https://www.sec.gov/edgar)",
  "tolerance": 0.01,
  "not_compared": {
    "cash_and_equivalents": "Yahoo may add the short-term investments",
    "total_equity": "Yahoo includes the minority interests"
  },
  "load": { "status": "fresh", "...": "..." },
  "years": [
    {
      "period_end": "2025-09-27",
      "yahoo_period_end": "2025-09-30",
      "currency": "USD",
      "yahoo_currency": "USD",
      "note": null,
      "match": 14,
      "mismatch": 1,
      "missing_yahoo": 0,
      "missing_sec": 0,
      "figures": [
        {
          "column": "revenue",
          "statement": "income",
          "status": "match",
          "sec": 416161000000.0,
          "yahoo": 416161000000.0,
          "difference": 0.0,
          "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
          "filing_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/"
        },
        { "column": "capex", "statement": "cashflow", "status": "match", "sec": 12715000000.0, "yahoo": -12715000000.0, "difference": 0.0, "...": "..." }
      ]
    }
  ]
}
```

Values are illustrative. A `mismatch` is not always an error of Yahoo: check the figure in the filing (`filing_url`) before you correct anything.

---

## <span className="api-method post">POST</span> `/sec/{ticker}/refresh`

Looks the CIK of the instrument up again in the table of the SEC and reads the facts of the company now, even if they were read recently. Needs a full-access key: a read-only key gets `403`.

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `isin` | — | The instrument, when several share the ticker |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/refresh"
```

The answer gives `ticker`, `cik`, `entity_name` and the `load` of the reading.

## Errors

| Status | When |
|---|---|
| `404` | Unknown ticker, or no SEC filer for the instrument (the reason is given: no US listing, name that does not match…) |
| `422` | `years` outside 1 to 30 |
| `502` | The SEC could not be read and nothing was stored for the company yet |
| `503` | No database |

## OpenBB widget

**Fonrex SEC Check** (`fonrex_sec_check`) shows the check as a table: one row per year and figure, gaps first, with the SEC and Yahoo values, the gap in percent, the XBRL concept and the link to the filing. Its `years` parameter is 3 by default.

It is not in the pre-assembled dashboards, which follow European tickers without SEC filings: add it to your own dashboard for a US ticker. See the [OpenBB Workspace guide](../guides/openbb-workspace.md).
