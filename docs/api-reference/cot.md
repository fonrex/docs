---
id: "cot"
title: "Commitments of Traders API Reference"
sidebar_label: "Commitments of Traders"
description: "The weekly Commitments of Traders reports of the CFTC: positions of speculators and hedgers in the US futures markets (indices, rates, currencies, commodities), net position, COT index"
---

# Commitments of Traders API Reference

Every week, the US Commodity Futures Trading Commission (CFTC) publishes the positions held on the Tuesday in the US futures markets, by type of trader: the [Commitments of Traders](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm) reports. Fonrex reads their free files (no key) and keeps them in your database, week by week.

It is a **sentiment signal**: who holds the market, and how far their position is from its usual range. It moves slowly (one figure a week, known three days later) and is meant for advanced quantitative use.

| Route | What it does |
|---|---|
| `GET /cot/markets` | The markets stored, with their CFTC code and latest name |
| `GET /cot/positions` | The positions of every type of trader in one market, report by report |
| `GET /cot/signals` | The positioning of one type of trader in one market: net position, share of the open interest, change, COT index |
| `GET /cot/extremes` | The latest report of several markets, the most extreme positioning first |
| `POST /cot/refresh` | Reads years of the reports from the CFTC on demand |

## Reports and types of traders

Fonrex reads three reports, futures only:

| `report` | Markets | Since | Types of traders (`category`) |
|---|---|---|---|
| `legacy` | Every market | January 1986 | `noncommercial` (the speculators), `commercial` (the hedgers), `nonreportable` (small traders) |
| `tff` (Traders in Financial Futures) | Financial markets: stock indices, rates, currencies, VIX, bitcoin | June 2006 | `dealer`, `asset_manager`, `leveraged_funds` (hedge funds, CTAs), `other_reportable`, `nonreportable` |
| `disaggregated` | Commodities: energy, metals, agriculture | June 2006 | `producer_merchant`, `swap_dealer`, `managed_money` (hedge funds, CTAs), `other_reportable`, `nonreportable` |

The **speculators** of each report are followed by default: `noncommercial`, `leveraged_funds`, `managed_money`. The CFTC classifies each trader from what it declares; the classification of a trader is not published.

Each type of trader holds **long**, **short** and, for some of them, **spreading** positions (long and short in the same market, in different months), in numbers of contracts. The long positions of all types add up to the open interest, and so do the short ones.

## Markets

A market is its **CFTC contract market code**, six characters: `13874A` for the E-mini S&P 500, `043602` for the 10-year note, `067651` for WTI crude oil, `088691` for gold. The code stays when the name changes (`067651` was `CRUDE OIL, LIGHT SWEET` and is `WTI-PHYSICAL` today); the answers give the latest name. `GET /cot/markets` lists the codes.

A market leaves the report the weeks it has fewer than 20 large traders, and comes back after. The Legacy reports came **twice a month** until September 1992, then every week.

The **key markets** are shown when no market is asked:

| Report | Key markets |
|---|---|
| `tff` | E-mini S&P 500 `13874A`, Nasdaq mini `209742`, Russell 2000 E-mini `239742`, 2-year note `042601`, 10-year note `043602`, euro `099741`, yen `097741`, pound `096742`, VIX `1170E1`, bitcoin `133741` |
| `disaggregated` | WTI `067651`, natural gas `023651`, gold `088691`, silver `084691`, copper `085692`, corn `002602`, soybeans `005602`, wheat `001602` |
| `legacy` | E-mini S&P 500, Nasdaq mini, 10-year note, euro, yen, gold, WTI, natural gas, corn |

## Signals

For one type of trader, report by report:

- **`net`**: long minus short, in contracts;
- **`net_share`**: `net` as a ratio of the open interest (`-0.2116` is -21.16 %);
- **`change`**: the change of `net` since the previous report stored;
- **`cot_index`**: where `net` stands between its lowest (0) and its highest (100) over a **window** of weeks (`window`, 156 by default: three years). The window is a length of time, not a number of reports. The index is empty until the market has reports over the whole window, and when `net` did not move in it. Near 100, the type of trader is as long as it has been over the window; near 0, as short.

### Report date and day of publication

The positions are those of the **Tuesday** (`date`). The CFTC publishes them on **Friday** at 3:30 p.m. in New York: `published_on` gives that Friday. It is an estimate: a holiday moves the publication by a day or two, the reports of before October 1992 came out later, and the CFTC keeps the true dates of the last 13 months only.

:::caution Backtests
A backtest must use `published_on`, not `date`: on the Tuesday, nobody knows the positions of that Tuesday yet.
:::

## Freshness

The CFTC publishes one file per report and year, and one file for every year up to 2016 (Legacy: 23 MB). A year is read the first time a request needs it. After that:

- the **years up to 2016** come together in the history file of their report: read once, never again;
- a **later past year** read from 15 January of the next year on is complete: never asked again;
- the **current year** is read again once its last reading is older than **`COT_REFRESH_HOURS`** hours (24 by default);
- when the CFTC does not answer (a year not published yet answers `404`), the stored reports are given with `load.status` = `failed` and the reason, and the next years of the request are not asked.

A file is read whole or not at all: a changed layout, a date outside the file, a line given twice, or positions that do not add up to the open interest refuse it, and what was stored is kept.

To load the whole history of the three reports at once (a few minutes):

```bash
docker compose exec fonrex-api python scripts/load_cot.py
docker compose exec fonrex-api python scripts/load_cot.py --report tff --start-year 2020 --force
```

The script prints one line per report and exits with `1` when a year could not be read. Every answer of the routes says, in `load`, what was done: `fetched` (a year read now), `fresh` (everything needed was stored) or `failed`, with the years read and the first and last report date stored.

---

## <span className="api-method get">GET</span> `/cot/markets`

The markets stored, by report then code, with their latest name, their contract units and the report dates stored. The current year of each report asked is read first when needed, so that a new instance lists the markets of the latest reports; older years are read by the routes of a market or by `POST /cot/refresh`.

| Parameter | Default | Description |
|---|---|---|
| `report` | the three | `legacy`, `tff` or `disaggregated` |
| `q` | — | Part of the name or of the code, in any case (`gold`, `S&P`, `13874`) |
| `key` | `false` | Only the key markets |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/markets?report=tff&q=13874A"
```

```json
{
  "markets": [
    {
      "report": "tff",
      "market": "13874A",
      "name": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
      "contract_units": "($50 X S&P 500 INDEX)",
      "first_date": "2006-06-13",
      "last_date": "2026-10-13",
      "...": "...",
      "key": true
    }
  ],
  "loads": [{ "report": "tff", "status": "fresh", "...": "..." }],
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

`weeks` is the number of report dates stored for the market.

---

## <span className="api-method get">GET</span> `/cot/positions`

The positions of every type of trader in one market, report by report, oldest first.

| Parameter | Default | Description |
|---|---|---|
| `market` | — | CFTC contract market code (required) |
| `report` | `legacy` | `legacy`, `tff` or `disaggregated` |
| `start` | 3 years before `end` | First report date included |
| `end` | today | Last report date included |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/positions?market=088691&report=disaggregated&start=2026-10-13"
```

```json
{
  "report": "disaggregated",
  "market": "088691",
  "name": "GOLD - COMMODITY EXCHANGE INC.",
  "categories": [
    { "code": "producer_merchant", "label": "Producer / merchant / processor / user" },
    { "code": "swap_dealer", "label": "Swap dealers" },
    { "code": "managed_money", "label": "Managed money" },
    { "code": "other_reportable", "label": "Other reportables" },
    { "code": "nonreportable", "label": "Non-reportable" }
  ],
  "start": "2026-10-13",
  "end": "2026-10-18",
  "weeks": [
    {
      "date": "2026-10-13",
      "published_on": "2026-10-16",
      "open_interest": 396345,
      "positions": [
        { "category": "producer_merchant", "long": 18386, "short": 36823, "spreading": null, "net": -18437 },
        { "category": "swap_dealer", "long": 13976, "short": 238070, "spreading": 22057, "net": -224094 },
        { "category": "managed_money", "long": 124747, "short": 17658, "spreading": 33557, "net": 107089 },
        { "category": "other_reportable", "long": 120553, "short": 19763, "spreading": 12338, "net": 100790 },
        { "category": "nonreportable", "long": 50731, "short": 16079, "spreading": null, "net": 34652 }
      ]
    }
  ],
  "load": { "report": "disaggregated", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

---

## <span className="api-method get">GET</span> `/cot/signals`

The positioning of one type of trader in one market, report by report, oldest first. The reports of the window before `start` are read too, so that the COT index of `start` is computed.

| Parameter | Default | Description |
|---|---|---|
| `market` | — | CFTC contract market code (required) |
| `report` | `legacy` | `legacy`, `tff` or `disaggregated` |
| `category` | the speculators of the report | A type of trader of the report |
| `window` | `156` | Weeks of the COT index window (1 to 520) |
| `start` | 3 years before `end` | First report date given |
| `end` | today | Last report date given |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/signals?market=13874A&report=tff&window=52&start=2026-10-01"
```

```json
{
  "report": "tff",
  "market": "13874A",
  "name": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
  "category": { "code": "leveraged_funds", "label": "Leveraged funds" },
  "window_weeks": 52,
  "start": "2026-10-01",
  "end": "2026-10-18",
  "signals": [
    {
      "date": "2026-10-06",
      "published_on": "2026-10-09",
      "open_interest": 1932227,
      "long": 113223,
      "short": 528310,
      "spreading": 48436,
      "net": -415087,
      "net_share": -0.214823,
      "change": -42598,
      "cot_index": 35.6
    },
    {
      "date": "2026-10-13",
      "published_on": "2026-10-16",
      "open_interest": 1931607,
      "long": 121404,
      "short": 530130,
      "spreading": 46956,
      "net": -408726,
      "net_share": -0.211599,
      "change": 6361,
      "cot_index": 37.9
    }
  ],
  "load": { "report": "tff", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

On 13 October 2026, the leveraged funds were short 408,726 E-mini S&P 500 contracts net, 21 % of the open interest: at 37.9 between their lowest and their highest net position of the past 52 weeks.

---

## <span className="api-method get">GET</span> `/cot/extremes`

The latest report of several markets, the COT index farthest from 50 first. A market without index comes last; a market asked without any report stored is listed in `missing`.

| Parameter | Default | Description |
|---|---|---|
| `report` | `legacy` | `legacy`, `tff` or `disaggregated` |
| `market` | the key markets of the report | Up to 20 codes, repeated or separated by commas |
| `category` | the speculators of the report | A type of trader of the report |
| `window` | `156` | Weeks of the COT index window |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/extremes?report=tff&window=52"
```

```json
{
  "report": "tff",
  "category": { "code": "leveraged_funds", "label": "Leveraged funds" },
  "window_weeks": 52,
  "markets": [
    {
      "market": "099741",
      "name": "EURO FX - CHICAGO MERCANTILE EXCHANGE",
      "signal": { "date": "2026-10-13", "net": -68001, "net_share": -0.077756, "change": -23740, "cot_index": 0.0, "...": "..." }
    },
    {
      "market": "133741",
      "name": "BITCOIN - CHICAGO MERCANTILE EXCHANGE",
      "signal": { "date": "2026-10-13", "net": -5844, "net_share": -0.281611, "change": 1008, "cot_index": 95.5, "...": "..." }
    },
    {
      "market": "1170E1",
      "name": "VIX FUTURES - CBOE FUTURES EXCHANGE",
      "signal": { "date": "2026-10-13", "net": 1105, "net_share": 0.002464, "change": -4389, "cot_index": 90.7, "...": "..." }
    }
  ],
  "missing": [],
  "load": { "report": "tff", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

The list is shortened here: the answer gives every key market. On 13 October 2026, the leveraged funds were at their shortest of the past 52 weeks on the euro (index 0).

---

## <span className="api-method post">POST</span> `/cot/refresh`

Reads years of the reports from the CFTC into the database. Needs a full-access key: a read-only key gets `403`.

| Parameter | Default | Description |
|---|---|---|
| `report` | the three | `legacy`, `tff`, `disaggregated`, repeated |
| `start_year`, `end_year` | the current year | Years read (1986 or later) |
| `force` | `false` | Read even the years that are up to date |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/refresh?report=tff&start_year=2006"
```

The answer lists one `load` per report.

## Errors

| Status | When |
|---|---|
| `404` | No report of the market in the period (`GET /cot/markets` lists the markets stored) |
| `422` | Unknown report, a market that is not a CFTC code (six letters, digits or `+`), a type of trader of another report (`managed_money` in `tff`), a window out of 1 to 520, more than 20 markets, `start` after `end` |
| `502` | The CFTC could not be read and nothing is stored |
| `503` | No database |

## OpenBB widgets

- **Fonrex COT Positioning** (`fonrex_cot_positioning`): the net position of a type of trader in one market (area, left axis) and its COT index (dotted, right axis, 0 to 100), over the last 3 years; the leveraged funds on the E-mini S&P 500 by default. `market`, `report`, `category`, `window` and `start` as above.
- **Fonrex COT Extremes** (`fonrex_cot_extremes`): the latest report of the key markets of a report, the most extreme first, with the net position, its share of the open interest, its change and a reading (*Extreme long* at 90 or more, *Extreme short* at 10 or less).

Both are in the *Macro Context* tab of the **Fonrex — Screener & Macro** dashboard, on the TFF report. See the [OpenBB Workspace guide](../guides/openbb-workspace.md).
