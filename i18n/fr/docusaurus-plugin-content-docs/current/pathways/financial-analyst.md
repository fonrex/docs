---
id: "financial-analyst"
title: "Parcours Analyste Financier"
sidebar_label: "Analyste Financier"
description: "Guide d'intégration pour analystes financiers : modèles DCF, extraction des fondamentaux, connecteur Google Sheets et OpenBB Workspace"
---

# Parcours Analyste Financier

Ce parcours fournit un guide technique d'intégration pour les **Analystes Financiers et Spécialistes de la Valorisation**. Il couvre l'extraction des états financiers fondamentaux, les modèles de valorisation DCF (Discounted Cash Flow) et l'intégration avec Google Sheets et OpenBB Workspace.

| Domaine d'application | Mode d'intégration | Format de sortie |
|---|---|---|
| **Connecteur Google Sheets** | Apps Script / `IMPORTDATA` | CSV / Cellules de calcul |
| **OpenBB Workspace** | Router REST (`/openbb`) | Tuiles métriques, tables AgGrid, graphiques Plotly |
| **Moteur de valorisation DCF** | Backend FastAPI | Intrinseque Free Cash Flow, EPS & DDM |

---

## 1. Accès aux endpoints de l'instance

Vérifiez que votre instance Fonrex est en cours d'exécution :

```http
GET /health
```

URL locale par défaut : `http://localhost:5000`

---

## 2. Intégration Google Sheets

Connectez vos modèles financiers aux endpoints Fonrex via des formules standards ou des scripts Apps Script :

### Utilisation directe des formules

```excel
=IMPORTDATA("http://localhost:5000/api/v1/fundamentals/ratios?symbol=AAPL&format=csv")
```

### Fonctions Apps Script personnalisées

| Signature de fonction | Description |
|---|---|
| `=FONREX_PE("AIR.PA")` | Price-to-Earnings Ratio |
| `=FONREX_DIVIDEND_YIELD("AIR.PA")` | Rendement du dividende (format décimal) |
| `=FONREX_INTRINSIC_VALUE("AAPL")` | Valeur intrinsèque DCF par action |

> **Note** : Les formules personnalisées sont mises en cache 30 minutes par Google. Pour un rafraîchissement à la demande, utilisez les scripts du menu. Consultez le [Guide du Connecteur Google Sheets](/docs/guides/google-sheets-connector).

---

## 3. Configuration OpenBB Terminal Workspace

Fonrex intègre un router `/openbb` dédié à OpenBB Terminal (Cloud et Desktop) :

1. Ouvrez OpenBB Workspace.
2. Ajoutez Fonrex comme source de données personnalisée (`http://localhost:5000/openbb`).
3. Chargez le tableau de bord préconfiguré Fonrex.

> **Note** : Pour l'authentification et les déclarations de widgets, consultez le [Guide d'intégration OpenBB Workspace](/docs/guides/openbb-workspace).

---

## 4. Moteur de valorisation DCF

Interrogez les modèles de valorisation pour calculer la valeur intrinsèque d'une entreprise :

```http
GET /api/v1/valuation/dcf?symbol=AAPL&wacc=0.085&growth_rate=0.05
```

Schéma de réponse JSON :

```json
{
  "symbol": "AAPL",
  "intrinsic_value_per_share": 198.50,
  "current_price": 185.20,
  "upside_downside_pct": 7.18,
  "wacc_used": 0.085,
  "terminal_growth_rate": 0.05
}
```

---

## Prochaines étapes

- Consulter la [Référence API Fundamentals & Ratios](/docs/api-reference/fundamentals)
- Consulter la [Référence API Moteur DCF](/docs/api-reference/valuation-dcf)
- Consulter la [Référence API Intégration OpenBB](/docs/api-reference/openbb)
