---
id: "valuation-dcf"
title: "Référence API Valorisation DCF"
sidebar_label: "Valorisation (DCF)"
description: "Calculs de valeur intrinsèque, estimation du WACC, consensus multi-modèles et matrices de sensibilité"
---


# Référence API Valorisation DCF

L'API de valorisation exécute des modèles de valeur intrinsèque par actualisation des flux de trésorerie (DCF), calcule le coût moyen pondéré du capital (WACC) dynamique, élabore des rapports de consensus multi-modèles et génère des matrices de sensibilité.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}`

Calculer la valeur intrinsèque par défaut à l'aide du modèle DCF basés sur les Free Cash Flow (FCF). Résultats mis en cache dans Redis pendant 6 heures.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Symbole ticker (ex. `AAPL`) |

### Exemple de Réponse

```json
{
  "ticker": "AAPL",
  "model": "FCF",
  "current_price": 224.50,
  "intrinsic_value": 248.20,
  "margin_of_safety_pct": 10.56,
  "recommendation": "UNDERVALUED",
  "wacc": 0.0845,
  "terminal_growth_rate": 0.025,
  "projections": [
    { "year": 1, "fcf": 115000000000, "pv": 105990000000 },
    { "year": 2, "fcf": 124000000000, "pv": 105430000000 },
    { "year": 3, "fcf": 133000000000, "pv": 104270000000 },
    { "year": 4, "fcf": 142000000000, "pv": 102550000000 },
    { "year": 5, "fcf": 151000000000, "pv": 100290000000 }
  ],
  "terminal_value": 2580000000000,
  "enterprise_value": 3098430000000
}
```

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

Exécuter une valorisation DCF personnalisée avec des taux de croissance, un taux sans risque ou des surcharges WACC sur mesure (contourne le cache Redis).

### Corps de la Requête

```json
{
  "projection_years": 5,
  "revenue_growth_rate": 0.08,
  "operating_margin": 0.30,
  "risk_free_rate": 0.042,
  "terminal_growth_rate": 0.02
}
```

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/compare`

Comparer les valorisations intrinsèques de consensus entre les trois modèles DCF : **Free Cash Flow (FCF)**, **Bénéfice par Action (EPS)** et **Modèle d'Actualisation des Dividendes (DDM)**.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/sensitivity`

Générer une matrice de sensibilité 5x5 analysant comment la valeur intrinsèque évolue selon les combinaisons de WACC (taux d'actualisation) et de taux de croissance terminale.

### Exemple de Réponse

```json
{
  "ticker": "AAPL",
  "sensitivity_matrix": {
    "wacc_axis": [0.075, 0.080, 0.0845, 0.090, 0.095],
    "growth_axis": [0.015, 0.020, 0.025, 0.030, 0.035],
    "values": [
      [275.40, 284.10, 294.20, 305.80, 319.40],
      [252.10, 259.30, 267.80, 277.50, 288.70],
      [234.80, 241.00, 248.20, 256.40, 265.80]
    ]
  }
}
```
