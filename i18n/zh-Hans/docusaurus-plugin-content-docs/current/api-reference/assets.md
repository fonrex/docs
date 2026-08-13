---
id: "assets"
title: "资产与上市 API 参考"
sidebar_label: "资产与上市"
description: "资产身份解析、上市信息及 EOD 历史数据 Endpoint 文档"
---


# 资产与上市 API 参考

资产 API 用于管理金融工具标识、交易所上市信息以及多格式 EOD 历史数据的获取。

---

## <span className="api-method get">GET</span> `/assets/by-isin/{isin}`

通过 ISIN 代码获取规范的资产工具及其所有活跃的交易所上市信息。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `isin` | `string` | ✅ | — | 12 位字符的 ISIN 代码（例如 `NL0000235190`） |

### 响应示例

```json
{
  "id": 42,
  "isin": "NL0000235190",
  "name": "Airbus SE",
  "sector": "Industrials",
  "industry": "Aerospace & Defense",
  "quote_type": "EQUITY",
  "listings": [
    {
      "id": 101,
      "ticker": "AIR.PA",
      "exchange": "XPAR",
      "currency": "EUR",
      "is_primary": true
    },
    {
      "id": 102,
      "ticker": "AIR.DE",
      "exchange": "XETR",
      "currency": "EUR",
      "is_primary": false
    }
  ]
}
```

### 使用示例

#### cURL
```bash
curl -s "http://localhost:5000/assets/by-isin/NL0000235190"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/assets/by-isin/NL0000235190")
data = resp.json()
print(f"Asset Name: {data['name']}, Listings Count: {len(data['listings'])}")
```

---

## <span className="api-method get">GET</span> `/listings`

按代码 (ticker)、ISIN、交易所或货币搜索上市信息。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ❌ | — | 股票代码（例如 `AAPL`） |
| `isin` | `string` | ❌ | — | ISIN 代码 |
| `exchange` | `string` | ❌ | — | 交易所代码（例如 `XPAR`、`NASDAQ`） |
| `currency` | `string` | ❌ | — | 3 位字母货币代码（例如 `EUR`、`USD`） |
| `limit` | `integer` | ❌ | `50` | 要返回的最大结果数 |

---

## <span className="api-method get">GET</span> `/eod/{ticker}`

获取 JSON 或 CSV 格式的日终 (EOD) 历史价格。如果本地数据缺失，将自动触发历史数据摄取。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | 股票代码（例如 `AIR.PA`、`AAPL`） |
| `resolution` | `string` | ❌ | `d` | K 线周期 (`d`, `w`, `m`) |
| `format` | `string` | ❌ | `json` | 输出格式 (`json`, `csv`) |
| `limit` | `integer` | ❌ | `100` | 要返回的历史 K 线数量 |
| `order` | `string` | ❌ | `asc` | 按日期的排序顺序 (`asc`, `desc`) |

### 状态码

| 状态码 | 说明描述 |
|---|---|
| 200 | Success |
| 404 | Asset/Listing not found |
| 422 | Invalid parameter input |
