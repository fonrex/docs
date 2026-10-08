---
id: "adding-providers"
title: "指南：添加基本面数据提供方"
sidebar_label: "添加数据提供方"
description: "新增基本面数据提供方所需的每个步骤：代码、注册、单位、canary、测试和覆盖率下限"
---

# 指南：添加基本面数据提供方

`/fundamental` 的数据提供方是 `financials/providers/` 中的一个类，它把一个网站或 API 转换为 `FinancialMetrics` 对象。仓库通过测试强制执行下面的每个步骤：遗漏任何一步的数据提供方都无法通过 `make ci`。这些规则来自 `AGENTS.md`。

## 1. 编写数据提供方

创建 `financials/providers/MySite_provider.py`，它是 `BaseFinancialProvider` 的子类，实现 `get_financials(ticker)`。[参考页面](../providers/adding-custom-provider.md)提供了完整的骨架代码。

- **只有一个 HTTP 层。** 不要自行创建 HTTP 客户端：请使用 `self._get()`、`self._get_json()`、`self._post_json()` 或 `async with self._session()`（在搜索请求和页面请求之间共享 cookie）。重试、暂停、每个数据提供方的并发限制以及代理都在这一层处理。*（`tests/test_provider_http_policy.py`）*
- **数字在同一个地方解析。** 使用 `financials/numbers.py` 中的 `parse_number`（单元格）或 `find_number`（句子）将显示的文本转换为数字：正负号、千位分隔符、数量级（`k`、`M`、`Md`、`B`）和货币都在那里处理。不要对抓取到的文本使用 `float()`。*（`tests/test_numbers.py`）*
- **页面显示 ISIN 时请返回它。** 运行器会拒绝关于其他 ISIN 的响应：按 ticker 搜索的网站可能返回同名的其他证券。

运行器按以下顺序为您的数据提供方提供输入：其 `provider_url` 映射、其 `provider_ticker` 映射、ISIN（适用于按 ISIN 搜索的数据提供方），或 ticker。

## 2. 注册

在 `main.py` 的 `PROVIDER_SPECS` 中添加一行：

```python
PROVIDER_SPECS = (
    ...
    ("MySite", "financials.providers.MySite_provider", "MySiteProvider"),
)
```

无法导入的数据提供方会列在 `GET /health` 的 `providers.unavailable` 中，而不会悄无声息地消失。*（`tests/test_docs_consistency.py`）*

## 3. 声明单位

监控范围使用比率（3.45 % 的收益率写作 `0.0345`）。如果您的数据提供方返回的是显示用的百分数（`3.45`），请在 `monitoring/units.py` 的 `PROVIDER_PERCENT_FIELDS` 中声明这些字段；返回比率的数据提供方则以空集合声明。*（`tests/test_provider_units.py`）*

## 4. 加入 canary

将数据提供方添加到 `monitoring/canary_catalog.py` 的 `MONITORED_PROVIDERS` 和 `_PROVIDER_IMPORTS` 中，使每日 canary 针对 canary 资产对其进行检查。仅覆盖欧盟市场的数据提供方只在欧盟 ticker 上测试。

## 5. 无网络测试

测试绝不访问真实网站。将真实页面的精简副本保存到 `tests/fixtures/providers/`，并使用 `tests/conftest.py` 中的 `fake_network` fixture 提供该页面：

```python
async def test_my_site_reads_the_displayed_figures(fake_network):
    page = (FIXTURES / "mysite_airbus.html").read_text(encoding="utf-8")
    fake_network.get("mysite.example/search", httpx.Response(200, json={"url": "/airbus"}))
    fake_network.get("mysite.example/airbus", httpx.Response(200, text=page))

    metrics = await MySiteProvider().get_financials("AIR.PA")

    assert metrics.pe_ratio == pytest.approx(24.1)
    assert fake_network.calls("mysite.example") == 2
```

没有预设响应的请求会导致测试失败。

## 6. 设定覆盖率下限

`financials/providers/` 中的每个模块都在 `scripts/check_coverage_distribution.py` 中有覆盖率下限。请添加您的模块；下限只能提高。*（`tests/test_coverage_gate.py`）*

## 7. 更新文档

`README.md` 中的数据提供方数量会与代码进行核对，`ARCHITECTURE.md` 列出了所有数据提供方。然后运行完整的检查：

```bash
make ci
```
