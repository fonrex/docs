---
id: "adding-providers"
title: "Guide : ajouter un fournisseur de données fondamentales"
sidebar_label: "Ajouter des fournisseurs"
description: "Toutes les étapes nécessaires à un nouveau fournisseur de données fondamentales : code, enregistrement, unités, canary, tests et seuil de couverture"
---

# Guide : ajouter un fournisseur de données fondamentales

Un fournisseur de `/fundamental` est une classe de `financials/providers/` qui transforme un site web ou une API en objet `FinancialMetrics`. Le dépôt impose chacune des étapes ci-dessous par un test : un fournisseur qui en manque une fait échouer `make ci`. Les règles viennent de `AGENTS.md`.

## 1. Écrire le fournisseur

Créez `financials/providers/MySite_provider.py`, une sous-classe de `BaseFinancialProvider` qui implémente `get_financials(ticker)`. La [page de référence](../providers/adding-custom-provider.md) contient un squelette complet.

- **Une seule couche HTTP.** Ne créez jamais de client HTTP : utilisez `self._get()`, `self._get_json()`, `self._post_json()` ou `async with self._session()` (cookies partagés entre une recherche et une page). Les nouvelles tentatives, les pauses, la limite de concurrence par fournisseur et le proxy s'y trouvent. *(`tests/test_provider_http_policy.py`)*
- **Les nombres sont lus en un seul endroit.** Transformez un texte affiché en nombre avec `parse_number` (une cellule) ou `find_number` (une phrase) de `financials/numbers.py` : les signes, les séparateurs de milliers, les échelles (`k`, `M`, `Md`, `B`) et les devises y sont gérés. Pas de `float()` sur un texte scrapé. *(`tests/test_numbers.py`)*
- **Renvoyez l'ISIN quand la page l'affiche.** L'exécuteur rejette une réponse portant sur un autre ISIN : un site interrogé par ticker peut renvoyer un homonyme.

L'exécuteur transmet à votre fournisseur, dans cet ordre : sa correspondance `provider_url`, sa correspondance `provider_ticker`, l'ISIN (pour les fournisseurs interrogés par ISIN), ou le ticker.

## 2. L'enregistrer

Ajoutez une ligne à `PROVIDER_SPECS` dans `main.py` :

```python
PROVIDER_SPECS = (
    ...
    ("MySite", "financials.providers.MySite_provider", "MySiteProvider"),
)
```

Un fournisseur qui ne peut pas être importé est listé dans `providers.unavailable` de `GET /health` au lieu de disparaître silencieusement. *(`tests/test_docs_consistency.py`)*

## 3. Déclarer ses unités

Les plages de surveillance sont des ratios (un rendement de 3,45 % vaut `0.0345`). Si votre fournisseur renvoie des pourcentages affichés (`3.45`), déclarez ces champs dans `PROVIDER_PERCENT_FIELDS` de `monitoring/units.py` ; un fournisseur qui renvoie des ratios est déclaré avec un ensemble vide. *(`tests/test_provider_units.py`)*

## 4. L'ajouter au canary

Ajoutez le fournisseur à `MONITORED_PROVIDERS` et `_PROVIDER_IMPORTS` dans `monitoring/canary_catalog.py`, pour que le canary quotidien le vérifie sur les actifs du canary. Un fournisseur limité à l'UE n'est testé que sur des tickers de l'UE.

## 5. Le tester sans réseau

Les tests n'atteignent jamais un vrai site web. Enregistrez une copie réduite d'une vraie page dans `tests/fixtures/providers/` et servez-la avec la fixture `fake_network` de `tests/conftest.py` :

```python
async def test_my_site_reads_the_displayed_figures(fake_network):
    page = (FIXTURES / "mysite_airbus.html").read_text(encoding="utf-8")
    fake_network.get("mysite.example/search", httpx.Response(200, json={"url": "/airbus"}))
    fake_network.get("mysite.example/airbus", httpx.Response(200, text=page))

    metrics = await MySiteProvider().get_financials("AIR.PA")

    assert metrics.pe_ratio == pytest.approx(24.1)
    assert fake_network.calls("mysite.example") == 2
```

Une requête sans réponse préenregistrée fait échouer le test.

## 6. Lui donner un seuil de couverture

Chaque module de `financials/providers/` a un seuil de couverture dans `scripts/check_coverage_distribution.py`. Ajoutez le vôtre ; les seuils ne font que monter. *(`tests/test_coverage_gate.py`)*

## 7. Mettre à jour les documents

Le nombre de fournisseurs indiqué dans `README.md` est vérifié par rapport au code, et `ARCHITECTURE.md` liste les fournisseurs. Lancez ensuite l'ensemble des contrôles :

```bash
make ci
```
