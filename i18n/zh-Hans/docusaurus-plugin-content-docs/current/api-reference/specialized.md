---
id: "specialized"
title: "专项数据提供方 API 参考"
sidebar_label: "专项数据"
description: "SEC 内部人交易、来自 JustETF 的 UCITS ETF 详情以及指数成分股"
---

# 专项数据提供方 API 参考

有三个路由，各自查询一个专项数据源。每个路由都接受 `refresh=true` 以绕过缓存。

---

## <span className="api-method get">GET</span> `/insider-transactions/{ticker}`

向美国 SEC（EDGAR）提交的 Form 4 内部人交易。缓存 12 小时。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ticker` | string | — | 向 SEC 提交文件的股票（例如 `AAPL`） |
| `limit` | integer | `20` | 返回的交易数 |
| `refresh` | boolean | `false` | 重新查询 EDGAR |

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

`transaction_type` 是对 Form 4 代码的解读（`P` 买入 Buy、`S` 卖出 Sell、`A` 授予 Award、`M` 行权 Option Exercise、`G` 赠与 Gift、`F` 代扣税 Tax Withholding……）。请将 `SEC_EDGAR_EMAIL` 设置为你自己的地址：SEC 要求自动化客户端在 User-Agent 中提供联系方式。示例中的数值仅作说明。

---

## <span className="api-method get">GET</span> `/etf/{isin}/details`

来自 JustETF 的 UCITS ETF 数据。缓存 24 小时。已知为非 ETF 的 ISIN 会被拒绝。

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

响应不会写入 `etf_details` 和 `etf_holdings` 表。

---

## <span className="api-method get">GET</span> `/index/{index_name}/constituents`

指数成分股，从 Wikipedia 读取。缓存 7 天。

`index_name` 可取 `SP500`、`CAC40`、`NASDAQ100` 或 `DAX`（不区分大小写）。其他名称返回 `400`。

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
