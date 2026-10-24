---
id: "esef-filings"
title: "ESEF Filings API Reference (European annual reports)"
sidebar_label: "ESEF Filings (Europe)"
description: "Annual statements of European listed companies, read from their ESEF filings on filings.xbrl.org, and the Yahoo statements checked against them"
---

# ESEF Filings API Reference (European annual reports)

Since the fiscal years starting in 2020, a company listed on a regulated market of the European Union files its annual report in the **European Single Electronic Format** (ESEF): an XHTML document whose figures are tagged in XBRL with the IFRS taxonomy. [filings.xbrl.org](https://filings.xbrl.org), run by XBRL International, collects these filings and converts each one to xBRL-JSON. Fonrex reads them (free, no key), keeps their figures in your database and uses them, as it uses the [SEC filings](./sec-filings.md) for US companies, as a **source of verification** for the statements stored from Yahoo Finance.

| Route | What it does |
|---|---|
| `GET /esef/{ticker}/statements` | The annual statements filed in ESEF, each figure with its concept, its filing and a link to it |
| `GET /esef/{ticker}/check` | The Yahoo statements checked against the ESEF filings, figure by figure |
| `GET /esef/{ticker}/filings` | The filings of the company in the index, and what their reading found |
| `POST /esef/{ticker}/refresh` | Asks GLEIF for the company again, and reads every filing now |

:::caution Coverage
filings.xbrl.org states that its index is **not complete**. No filing of a German company is found (SAP has none), and Ireland is badly covered. Only annual reports are filed in ESEF; a few companies (Novo Nordisk) also file their half-years and quarters, which Fonrex stores but never takes for a fiscal year.
:::

## Which instruments

The filings are kept by **LEI** (Legal Entity Identifier), not by ticker. Fonrex asks [GLEIF](https://www.gleif.org), the official registry of LEIs, for the LEI of the **ISIN** of the instrument, never of its ticker: `NL0000235190` is one security issued by Airbus, whatever `AIR` means on another exchange.

- An instrument **without ISIN**, or of a type that files no annual report (ETF, fund, index, currency), is not asked about.
- The entity GLEIF gives must bear the **name** of the instrument in your catalogue, its legal name or one of its other names, the legal forms left out (`S.A.`, `SE`, `N.V.`, `S.p.A.`, `A/S`, `AB (publ)`…). `Novo Nordisk B` is `NOVO NORDISK A/S`; `Air Liquide` is found in its long legal name `L'AIR LIQUIDE SOCIETE ANONYME POUR L'ETUDE…`. A name that does not match is refused with the name GLEIF gives: `Total` is not `TotalEnergies SE`.
- The LEI found is kept for the **instrument**: every listing of it shares the same filings. A LEI you set yourself in `asset_mappings` (provider `LEI`, `source` = `manual`, no listing) is trusted as it is.
- An instrument for which no LEI was found is not asked again for 30 days; `POST /esef/{ticker}/refresh` asks at once.
- When several instruments share a ticker, add `isin=` to choose one.

## How the filings are read

- **One filing per period.** The index may hold one filing per language (TotalEnergies files in French and in English) or a second version (BNP Paribas, `-0` and `-1`). Of the filings listed at the same period, only the one the index processed last is read; the others stay in the index, unread.
- **A filing is read once.** A filing read, refused or without xBRL-JSON is not read again, unless its file changes or you ask for it (`refresh`). A filing that filings.xbrl.org did not give is asked again at the next reading.
- **Totals only.** A filing tags hundreds of figures; Fonrex keeps the totals, never a breakdown by segment or component of equity, nor the texts of the notes, which make most of the 0.1 to 32 MB of a filing.
- **The period comes from the figures.** The period the index gives a filing can be wrong: Pernod Ricard's filing listed at 31 December 2021 holds the fiscal year ended 30 June 2021. Fonrex dates every figure by its own period.
- **A restatement wins**: a filing repeats the previous year and may correct it. For each period, the value of the latest filing is kept, and the figure says which filing it comes from.
- **A fiscal year is a period of 350 to 380 days**; a balance sheet figure is a value at the end of the year. Half-years and quarters are stored and left out of the statements.
- **One currency per year**: the currency of the latest report. TotalEnergies, a French company, reports in **US dollars**: its figures are in dollars.
- **A file is read whole or not at all**: a figure of another company, a period that is not a date or a value that is not a number refuse the filing, and `/filings` gives the reason. Two values for the same figure drop that figure only.

### Figures

The figures are those of the [SEC filings](./sec-filings.md#figures), with the same names: the names of the columns of `financial_statements`. Their IFRS concepts, in order:

| Figure | IFRS concepts |
|---|---|
| `revenue` | `Revenue` (Airbus, Novo Nordisk), `RevenueFromContractsWithCustomers` (TotalEnergies, Pernod Ricard), `RevenueFromSaleOfGoods` |
| `net_income` | `ProfitLossAttributableToOwnersOfParent`, then `ProfitLoss` for a company without minority interests (Novo Nordisk) |
| `total_equity` | `EquityAttributableToOwnersOfParent`, then `Equity` |
| `operating_income` | `ProfitLossFromOperatingActivities` |
| `total_assets` | `Assets` |
| `operating_cashflow` | `CashFlowsFromUsedInOperatingActivities` |

A figure the company does not tag is absent. The weighted average number of shares is seldom tagged in ESEF, and a bank has no revenue: in practice 14 to 21 of the 30 figures are filled, depending on the company.

## Freshness

The filings of a company are listed and read the first time they are asked. After that:

- a company read less than **`ESEF_REFRESH_HOURS`** hours ago (24 by default) is answered from the database;
- an older one has its index read again, and only its new filings are read;
- when filings.xbrl.org does not answer, the stored figures are given with `load.status` = `failed` and the reason.

Every answer says, in `load`, what was done: `fetched` (read now), `fresh` (read recently) or `failed`, with `filings` (in the index), `last_report_end` (the latest period read), `facts` (the values kept), and, for a reading done now, the filings `read` and `refused`.

To read the filings of every share of your catalogue at once:

```bash
docker compose exec fonrex-api python scripts/load_esef.py
docker compose exec fonrex-api python scripts/load_esef.py --ticker AIR.PA TTE.PA --force
```

One line per share: its status, its LEI and what was read. The funds and the shares without ISIN are left out. The first reading of a large catalogue takes a while; the next ones only read the new filings.

---

## <span className="api-method get">GET</span> `/esef/{ticker}/statements`

The annual statements filed in ESEF, most recent fiscal year first.

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `years` | every year | Most recent fiscal years given (1 to 30) |
| `isin` | — | The instrument, when several share the ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/statements?years=1"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "source": "ESEF annual reports, filings.xbrl.org (XBRL International, https://filings.xbrl.org); LEI from GLEIF (https://www.gleif.org)",
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-21T07:00:00Z",
    "filings": 5,
    "last_report_end": "2025-12-31",
    "facts": 1310,
    "read": [],
    "refused": {},
    "reason": null
  },
  "years": [
    {
      "period_end": "2025-12-31",
      "currency": "EUR",
      "figures": {
        "revenue": {
          "value": 73420000000.0,
          "concept": "Revenue",
          "taxonomy": "ifrs-full",
          "unit": "EUR",
          "fxo_id": "MINO79WLOO247M1IL051-2025-12-31-ESEF-NL-0",
          "report_end": "2025-12-31",
          "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/MINO79WLOO247M1IL051-2025-12-31-1-en/reports/ixbrlviewer.html"
        },
        "net_income": { "value": 5221000000.0, "concept": "ProfitLossAttributableToOwnersOfParent", "...": "..." },
        "total_assets": { "value": 134939000000.0, "concept": "Assets", "...": "..." },
        "eps_diluted": { "value": 6.6, "unit": "EUR/shares", "...": "..." }
      }
    }
  ]
}
```

`fxo_id` names the filing of the figure, and `viewer_url` opens it in the viewer of filings.xbrl.org, where the tagged figure can be found in the report itself.

---

## <span className="api-method get">GET</span> `/esef/{ticker}/check`

The statements stored from Yahoo checked against the ESEF filings, with the rules of the [SEC check](./sec-filings.md#get-sectickercheck): the same figures compared, the same tolerance (**`SEC_CHECK_TOLERANCE`**, 1 % by default), a year matched by its end within two weeks, payments compared as amounts, cash and equity not compared.

| `status` | Meaning |
|---|---|
| `match` | Same value within the tolerance |
| `mismatch` | A gap larger than the tolerance: worth a look |
| `missing_yahoo` | In the ESEF filing, absent at Yahoo |
| `missing_esef` | Given by Yahoo, not tagged in the ESEF filing |

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `years` | every year | Most recent fiscal years given (1 to 30) |
| `isin` | — | The instrument, when several share the ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/check?years=1"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "tolerance": 0.01,
  "not_compared": {
    "cash_and_equivalents": "Yahoo may add the short-term investments",
    "total_equity": "Yahoo includes the minority interests"
  },
  "load": { "status": "fresh", "...": "..." },
  "years": [
    {
      "period_end": "2025-12-31",
      "yahoo_period_end": "2025-12-31",
      "currency": "EUR",
      "yahoo_currency": "EUR",
      "note": null,
      "match": 9,
      "mismatch": 1,
      "missing_yahoo": 2,
      "missing_esef": 2,
      "figures": [
        {
          "column": "revenue",
          "statement": "income",
          "status": "match",
          "esef": 73420000000.0,
          "yahoo": 73420000000.0,
          "difference": 0.0,
          "concept": "Revenue",
          "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/…/ixbrlviewer.html"
        }
      ]
    }
  ]
}
```

Values are illustrative. A year in another currency is not compared, and its `note` says so: Yahoo may give TotalEnergies in euros, its filing in dollars. A `mismatch` is not always an error of Yahoo: open the filing (`viewer_url`) before you correct anything.

---

## <span className="api-method get">GET</span> `/esef/{ticker}/filings`

The filings of the company in the index of filings.xbrl.org, latest period first, with what their reading found.

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `isin` | — | The instrument, when several share the ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/filings"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "load": { "status": "fresh", "...": "..." },
  "filings": [
    {
      "fxo_id": "MINO79WLOO247M1IL051-2025-12-31-ESEF-NL-0",
      "listed_period_end": "2025-12-31",
      "report_end": "2025-12-31",
      "country": "NL",
      "read_status": "read",
      "read_reason": null,
      "facts": 269,
      "breakdowns": 171,
      "conflicts": 0,
      "error_count": 0,
      "warning_count": 2,
      "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/…/ixbrlviewer.html",
      "json_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/MINO79WLOO247M1IL051-2025-12-31-1-en.json",
      "...": "..."
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `listed_period_end` | The period the index gives the filing: it can be wrong |
| `report_end` | The end of the latest period of its figures, once read: the true period |
| `read_status` | `read`; `refused` (`read_reason` says why); `missing` (no xBRL-JSON); `null` when not read: another filing of the same period was read, or it was not given yet |
| `facts`, `breakdowns`, `conflicts` | Values kept, breakdowns left out, figures given twice with two values and dropped |
| `error_count`, `warning_count`, `inconsistency_count` | The validation of the filing by filings.xbrl.org |

---

## <span className="api-method post">POST</span> `/esef/{ticker}/refresh`

Asks GLEIF for the LEI of the instrument again, lists its filings and reads every period again now, even if it was read recently. Needs a full-access key: a read-only key gets `403`.

| Parameter | Default | Description |
|---|---|---|
| `ticker` | — | A ticker of your catalogue |
| `isin` | — | The instrument, when several share the ticker |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/refresh"
```

The answer gives `ticker`, `lei`, `entity_name` and the `load` of the reading, with the filings `read` and `refused`.

## Errors

| Status | When |
|---|---|
| `404` | Unknown ticker, or no ESEF filer for the instrument (the reason is given: no ISIN, a fund, a name GLEIF does not confirm…) |
| `422` | `years` outside 1 to 30 |
| `502` | filings.xbrl.org could not be read and nothing was stored for the company yet |
| `503` | No database |

## OpenBB widget

**Fonrex ESEF Check** (`fonrex_esef_check`) shows the check as a table: one row per year and figure, gaps first, with the ESEF and Yahoo values, the gap in percent, the IFRS concept and the link to the filing in the viewer. Its `years` parameter is 3 by default. Add it to your own dashboard; see the [OpenBB Workspace guide](../guides/openbb-workspace.md).
