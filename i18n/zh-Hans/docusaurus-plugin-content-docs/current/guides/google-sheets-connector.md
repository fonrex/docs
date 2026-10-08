---
id: google-sheets-connector
title: Google Sheets 连接器
sidebar_label: Google Sheets 连接器
description: "使用您自己的 Fonrex 实例中的基本面数据、DCF 估值和技术指标填充 Google Sheets 模板"
---

# Google Sheets 连接器

Fonrex Sheets 模板会使用从**您自己的 Fonrex 实例**读取的基本面数据、DCF 估值和技术指标填充电子表格。数据不经过任何由 Fonrex 运营的服务，也不涉及任何付费套餐。

![Fonrex Sheets 连接器预览](/img/template-preview.png)

:::info
**本模板显示的原始财务数据仅供参考。** 不构成投资建议。所有显示的数值（包括 DCF 估值）均为分析输出结果。在做出任何投资决策之前，请务必自行研究。
:::

## 工作原理

Google 在自己的服务器上运行电子表格的脚本，而这些服务器无法访问 `localhost`。您需要通过隧道公开您的实例，为其提供一个公共 HTTPS URL，电子表格会使用您提供给它的密钥调用该 URL。

## 前提条件

- 一个正在运行的 Fonrex 实例（[安装](../getting-started/installation.md)）
- 一条为其提供 HTTPS URL 的隧道（zrok、Cloudflare Tunnel、Tailscale Funnel、ngrok…）
- 一个 Google 账号

## 第 1 步 — 为电子表格创建只读密钥

该密钥将存储在您的 Google 账号中，位于运行 Fonrex 的机器之外：请为电子表格提供一个可以读取数据、但不能清除缓存、清理数据库或触发数据导入的密钥。

```bash
echo "frx_live_$(openssl rand -hex 24)"
```

在您实例的 `.env` 中：

```
FONREX_READ_ONLY_API_KEYS=frx_live_<the generated value>
```

然后重启 API：`docker compose up -d`。

## 第 2 步 — 通过隧道公开您的实例

以 [zrok](https://zrok.io) 为例，在启用您的环境（`zrok2 enable <token>`）之后：

```bash
# temporary URL, valid until you stop the command
zrok2 share public localhost:5000

# or a stable URL: reserve a name once, then share with it
zrok2 create name -n public myfonrex
zrok2 share public localhost:5000 -n public:myfonrex
# → https://myfonrex.share.zrok.io
```

使用 zrok 1.x 时，命令是 `zrok` 而不是 `zrok2`。建议使用稳定的 URL：如果使用临时 URL，每次隧道重启时都需要重新配置电子表格。请从另一个网络检查该 URL：

```bash
curl https://myfonrex.share.zrok.io/health
```

:::warning
隧道运行期间，您的实例可以从 Internet 访问。只有 `/health`、API 文档、OpenBB 发现文件和静态文件无需密钥即可响应。请保持 `FONREX_AUTH_REQUIRED` 处于启用状态，切勿共享完全访问密钥，并在不需要电子表格时停止隧道。
:::

## 第 3 步 — 复制模板

👉 **[打开 Fonrex Sheets 模板](https://docs.google.com/spreadsheets/d/1PUBLISHED_TEMPLATE_ID_XYZ_1234567890/copy)**

您会在 Google Drive 中获得一份个人副本；原始模板永远不会被修改。

## 第 4 步 — 连接电子表格

1. 在您的副本中，打开 **Fonrex** 菜单（位于 "Help" 旁边）。
2. **Configure Instance URL** → 粘贴您隧道的 HTTPS URL。
3. **Configure API Key** → 粘贴第 1 步中的只读密钥。

URL 和密钥存储在您 Google 账号的 Apps Script *用户属性*（user properties）中：绝不会写入单元格，在您共享文档时也不会被共享。

然后在 **Watchlist** 工作表的 A 列中添加 ticker（从第 2 行开始：`AAPL`、`AIR.PA`、`MC.PA`…），或使用 **Fonrex > Add Ticker to Watchlist** 添加，然后刷新：

- **Fonrex > Refresh Fundamentals** → *Fundamentals* 工作表
- **Fonrex > Refresh DCF Valuations** → *DCF* 工作表
- **Fonrex > Refresh Technical Indicators** → *Technicals* 工作表

## 模板工作表

| 工作表 | 内容 |
|---|---|
| **Config** | 连接状态、最近刷新日期、法律声明 |
| **Watchlist** | 跟踪的 ticker（A 列，从第 2 行开始） |
| **Fundamentals** | 市盈率（P/E）、ROE、ROA、市值、股息收益率、beta、52 周最高/最低价… |
| **DCF** | 共识价值、当前价格、共识上涨空间、WACC、FCF 价值 |
| **Technicals** | RSI 14、MACD、SMA 50/200、EMA 20、布林带、ATR 14 |
| **Charts** | 基于导入数据的原生图表 |

## 自定义公式

| 公式 | 说明 |
|---|---|
| `=FONREX_PE("AIR.PA")` | 市盈率（P/E） |
| `=FONREX_DIVIDEND_YIELD("AIR.PA")` | 股息收益率（比率） |
| `=FONREX_INTRINSIC_VALUE("AIR.PA")` | DCF 共识价值 |
| `=FONREX_RSI("AAPL")` | 14 周期 RSI |

Google 会将自定义公式的结果缓存 30 分钟；如需最新数据，请使用 **Refresh** 菜单项。

## 脚本调用了什么

仅向您的实例发送带有 `Authorization: Bearer <key>` 的 `GET` 请求：菜单刷新调用 `/fundamental/deep`、`/dcf/{ticker}` 和 `/technical/{ticker}/multi`，其中两个公式调用 `/fundamental`。DCF 需要该 ticker 的深度基本面数据：请先刷新 *Fundamentals* 工作表。

## 限制

| 限制 | 详情 |
|---|---|
| **手动刷新** | 没有实时更新：Apps Script 不支持 WebSocket |
| **公式缓存** | 30 分钟，由 Google 强制设定 |
| **实例和隧道必须运行** | 任一方停止时刷新都会失败 |
| **每个 ticker 和路由各调用一次** | 每次刷新都会让您的实例为每个 ticker 查询其数据提供方 |

## 故障排查

| 错误 | 可能原因 | 解决方法 |
|---|---|---|
| `Configure your instance URL first` | 未配置 URL | Fonrex > Configure Instance URL |
| `Configure API key first` | 未配置密钥 | Fonrex > Configure API Key |
| `API key refused by your instance` | 密钥不在 `.env` 中，或 API 未重启 | 检查 `FONREX_READ_ONLY_API_KEYS`，然后运行 `docker compose up -d` |
| `Instance unreachable` | 隧道已停止或 URL 已更改 | 重启隧道，更新 URL |
| `The tunnel answered instead of Fonrex` | 隧道在运行，但实例未运行 | `docker compose ps`，然后 `docker compose up -d` |
| `Instance error or tunnel down (status 5xx)` | 实例出错，或隧道没有后端 | `docker compose logs fonrex-api` |
| `Ticker not found` | API 无法识别该代码 | 检查格式（`AIR.PA`，而不是 `AIR`） |
| 缺少 "Fonrex" 菜单 | 脚本未获授权 | 重新加载页面，接受权限请求 |

## 安全

- 脚本只通过 HTTPS 以 `GET` 请求调用**您**配置的 URL。
- 清单文件（`appsscript.json`）请求访问当前电子表格和外部请求的权限；它没有固定的域名列表，因为隧道的 URL 由您自己决定。
- 使用只读密钥时，即使密钥泄露，也无法清除缓存、清理数据库、触发数据导入或修改订阅。
