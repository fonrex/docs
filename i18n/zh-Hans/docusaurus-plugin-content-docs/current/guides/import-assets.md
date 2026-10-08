---
id: "import-assets"
title: "资产 CSV 导入流程指南"
sidebar_label: "导入资产"
description: "使用 import_assets.py 从 CSV 文件导入金融工具和上市品种"
---

# 资产 CSV 导入流程指南

`import_assets.py` 将金融工具及其上市品种（listing）从 CSV 文件加载到目录中。它是幂等的：同一个文件导入两次只会更新行，而不会产生重复。

## CSV 格式

```csv
name,ticker,isin,productType,currency
Airbus SE,AIR.PA,NL0000235190,STOCK,EUR
Apple Inc,AAPL,US0378331005,STOCK,USD
Apple Inc,APC.DE,US0378331005,STOCK,EUR
iShares Core MSCI World UCITS ETF,EUNL.DE,IE00B4L5Y983,ETF,EUR
```

| 列 | 规则 |
|---|---|
| `name` | 不能为空 |
| `ticker` | 最多 20 个字符 |
| `isin` | 12 个字符，`[A-Z]{2}[A-Z0-9]{10}` |
| `productType` | `STOCK` 或 `ETF` |
| `currency` | 3 个大写字母 |

行按 `(isin, ticker, currency)` 去重。上市品种的交易所根据 ticker 后缀推断（`AIR.PA` → `XPAR`，`BMW.DE` → `XETR`）；没有后缀的 ticker 不会被分配交易所。

镜像中附带两个目录文件：`data/etf.csv` 和 `data/stocks.csv`。

## 导入会写入什么

```
CSV file
  │ parse_csv(): validation, deduplication
  ▼
AssetImporter.run()  — batches of 200 rows
  ├─ one row of assets per ISIN
  ├─ one row of asset_listings per (instrument, ticker, exchange, currency)
  └─ default mappings: YahooFinance and GoogleFinance
```

- 金融工具的第一个上市品种是其**主**上市品种；如果尚无主上市品种，则以 USD、GBP、JPY、CHF、CAD 或 AUD 计价的上市品种成为主上市品种。
- 导入过程**不发起任何网络请求**。它写入的 Yahoo Finance 映射就是文件中的 ticker，未经验证：该上市品种的首次数据导入或基本面请求会将其替换为根据 ISIN 和货币验证过的 Yahoo 代码。

## 命令

```bash
# One file
docker compose exec fonrex-api python import_assets.py --file data/etf.csv

# Simulation, nothing written
docker compose exec fonrex-api python import_assets.py --file data/etf.csv --dry-run

# Every CSV file of a directory
docker compose exec fonrex-api python import_assets.py --dir data/isin_data

# Without --file or --dir: data/etf.csv and data/stocks.csv
docker compose exec fonrex-api python import_assets.py
```

选项：`--batch-size`（每个事务的行数，200）、`--verbose`。

简单文件名会先在 `data/isin_data/` 中查找，然后在应用程序文件夹中查找；相对路径或绝对路径则按原样使用。

## 通过 Yahoo Finance 补充信息

深度补充（关键指标、财务报表、盈利、分析师评级）是一个单独的步骤：

```bash
# One instrument
docker compose exec fonrex-api python import_assets.py --enrich-only --isin US0378331005

# The instruments of a file
docker compose exec fonrex-api python import_assets.py --enrich-only --file data/etf.csv --limit 100
```

`--enrich-only` 需要配合 `--isin` 或 `--file` 使用。向 Yahoo 查询时使用为主上市品种验证过的代码；没有已验证代码的金融工具会被跳过，日志会说明原因。`GET /fundamental/deep?ticker=...&refresh=true` 可通过 API 对单个金融工具执行相同操作。

`make db-seed` 导入默认目录并补充信息（`scripts/seed_database.py --enrich`）。

## 删除重复的 ISIN

在 ISIN 唯一性规则出现之前创建的数据库可能包含重复的 ISIN。`scripts/clean_isin_duplicates.py` 会将它们合并到最早的那一行：

```bash
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --diagnose-only   # read only
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --dry-run         # run, then roll back
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --create-index    # clean + unique index
```

## 下一步

采集已导入上市品种的价格，请参阅[采集历史数据](ingest-historical-data.md)。
