---
id: "valuation-dcf"
title: "Référence API Valorisation DCF"
sidebar_label: "Valorisation & DCF"
description: "Valeur intrinsèque avec trois modèles DCF, WACC dynamique, comparaison des modèles, matrice de sensibilité et taux macroéconomiques"
---

# Référence API Valorisation DCF

Trois modèles sont disponibles. Quand une requête en calcule plusieurs, le consensus est leur moyenne pondérée :

| Modèle | Base | Poids par défaut |
|---|---|---|
| `fcf` | Flux de trésorerie disponible moyen des trois derniers exercices, projeté, plus une valeur terminale de Gordon, moins la dette nette | 50 % |
| `eps` | Croissance du bénéfice par action (historique et tendance des analystes) et un PER terminal (le PER de la société borné entre 10 et 30, 15 s'il est inconnu) | 30 % |
| `ddm` | Actualisation des dividendes (Gordon), uniquement pour une société qui verse un dividende | 20 % |

Les poids sont partagés entre les modèles calculés par la requête : avec `fcf` et `eps` seuls, le consensus les pondère 50/30, normalisés. `GET /dcf/{ticker}` calcule `fcf` seul, donc son consensus est la valeur FCF.

**Les entrées proviennent uniquement de la base de données.** Le service lit les indicateurs clés, les états financiers annuels (regroupés par exercice, sur cinq ans), la tendance des résultats et les recommandations d'analystes enregistrés par l'enrichissement approfondi, ainsi que la dernière clôture journalière de la cotation principale. Lancez d'abord `GET /fundamental/deep?ticker=...` : un ticker qui n'a jamais été enrichi répond `404` avec le nom de la donnée manquante.

**WACC.** Coût des fonds propres par le MEDAF (taux sans risque + bêta × prime de risque actions), coût de la dette à partir des intérêts et de la dette, pondérations à partir de la capitalisation boursière et de la dette ; le WACC est maintenu entre 5 et 20 %. Le taux sans risque est le rendement du Trésor américain à 10 ans issu de FRED (voir `GET /macro/rates`), sinon `DCF_RISK_FREE_RATE`. Les entrées manquantes prennent des valeurs par défaut documentées (bêta 1, taux d'imposition 25 %, coût de la dette = taux sans risque + 2 points) et ajoutent un avertissement.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}`

Le **modèle FCF seul**, avec les hypothèses par défaut : `consensus_value` est la valeur FCF. Mise en cache 6 heures ; `force_refresh=true` recalcule. Utilisez `/compare` pour les trois modèles, ou `POST` pour les choisir.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/dcf/AIR.PA"
```

Structure de la réponse :

```json
{
  "ticker": "AIR.PA",
  "currency": "EUR",
  "current_price": "155.42",
  "shares_outstanding": "790000000",
  "wacc": {
    "wacc": "0.0865",
    "cost_of_equity": "0.0912",
    "cost_of_debt": "0.032",
    "tax_rate": "0.25",
    "weight_equity": "0.93",
    "weight_debt": "0.07",
    "beta_used": "1.1",
    "cost_of_debt_source": "calculated",
    "risk_free_rate_source": "fred_cached"
  },
  "models": {
    "fcf": {
      "model_name": "...",
      "intrinsic_value_per_share": "168.20",
      "upside_pct": "8.22",
      "projected_values": ["..."],
      "terminal_value": "...",
      "present_values": ["..."],
      "pv_terminal": "...",
      "warnings": []
    }
  },
  "solvency": { "debt_to_equity_ratio": "...", "net_debt_to_ebitda": "...", "interest_coverage_ratio": "...", "...": "..." },
  "consensus_value": "168.20",
  "consensus_upside_pct": "8.22",
  "analyst_target": "175.00",
  "computed_at": "2026-10-08T16:50:00Z"
}
```

Les chiffres ci-dessus sont donnés à titre d'illustration. Les montants et les taux sont des nombres décimaux envoyés sous forme de **chaînes**. `models` est indexé par modèle (`fcf`, `eps`, `ddm`) ; les `warnings` de chaque modèle indiquent quand une valeur par défaut ou un plafond a été appliqué. `risk_free_rate_source` vaut `fred_cached` (taux FRED), `env_fallback` (`DCF_RISK_FREE_RATE`) ou `client_override` (vos hypothèses en `POST`).

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

Valorisation avec vos propres hypothèses ; jamais mise en cache. Elle ne fait que calculer : une clé en lecture seule peut l'appeler.

| Champ | Type | Défaut | Description |
|---|---|---|---|
| `models` | list | `["fcf"]` | Parmi `fcf`, `eps`, `ddm` |
| `projection_years` | integer | `5` | De 3 à 10 |
| `terminal_growth_rate` | number | `0.025` | Ratio (0.025 = 2,5 %) |
| `wacc_params` | object | — | `risk_free_rate`, `equity_risk_premium`, `beta_override`, `cost_of_debt_override`, `tax_rate_override` |
| `fcf_growth_override`, `eps_growth_override`, `dividend_growth_override` | number | — | Imposer la croissance initiale d'un modèle |
| `model_weights` | object | — | Poids du consensus, par ex. `{"fcf": 0.6, "eps": 0.4, "ddm": 0}` |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps"], "projection_years": 10, "terminal_growth_rate": 0.02,
       "wacc_params": {"risk_free_rate": 0.035}}' \
  http://localhost:5000/dcf/AIR.PA
```

Un taux de croissance terminal à moins d'un demi-point du taux d'actualisation est plafonné (taux d'actualisation − 0,5 %) avec un avertissement. Demander `ddm` pour une société qui ne verse pas de dividende répond `404`.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/compare`

Les trois modèles côte à côte, avec leur consensus pondéré. Une société sans dividende reçoit une entrée DDM valorisée à zéro avec un avertissement, et le consensus est calculé à partir de FCF et EPS.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/sensitivity`

La valeur intrinsèque pour une grille WACC (lignes) × croissance terminale (colonnes).

| Paramètre | Défaut |
|---|---|
| `model` | `fcf` |
| `wacc_min`, `wacc_max`, `wacc_step` | `0.06`, `0.16`, `0.02` |
| `growth_min`, `growth_max`, `growth_step` | `0.01`, `0.05`, `0.01` |
| `force_refresh` | `false` |

La réponse contient `ticker`, `model`, `wacc_range`, `growth_range` et `matrix` ; chaque cellule donne la valeur intrinsèque et le potentiel de hausse ou de baisse par rapport au cours actuel.

---

## <span className="api-method get">GET</span> `/macro/rates`

Le taux sans risque utilisé par la valorisation :

```json
{
  "risk_free_rate": {
    "series_id": "DGS10",
    "label": "10-Year Treasury Constant Maturity Rate",
    "value": "0.0412",
    "unit": "percent",
    "observation_date": "2026-10-07"
  }
}
```

`value` est un ratio (0.0412 = 4,12 %), envoyé sous forme de chaîne, bien que `unit` indique `percent`. Il provient de Redis (6 heures), puis de la valeur enregistrée dans `macro_rates_cache` lorsqu'elle a été lue sur FRED il y a moins de 6 heures, puis de l'API FRED (`FRED_API_KEY`), et enfin d'une valeur enregistrée plus ancienne. En l'absence de toute valeur, `risk_free_rate` vaut `null` et la valorisation utilise `DCF_RISK_FREE_RATE`.
