---
id: "financial-analyst"
title: "📊 Parcours : Analyste Financier"
sidebar_label: "📊 Analyste Financier"
description: "Guide no-code / low-code pour les analystes financiers : valorisations DCF, intégration Google Sheets et OpenBB Workspace."
---

# 📊 Parcours : Analyste Financier

Ce parcours est conçu pour les **Analystes Financiers et Investisseurs** souhaitant automatiser leurs analyses fondamentales, construire des modèles DCF (Discounted Cash Flow) et alimenter leurs tableurs sans écrire de code complexe.

> [!TIP]
> **Objectif du parcours :** Connecter Fonrex à vos outils quotidiens (Google Sheets, OpenBB Workspace) et automatiser l'extraction des états financiers et calculs de valorisation.

---

### ⏱️ Durée estimée : 5 minutes

---

## 📌 Étape 1 : Obtenir votre instance Fonrex

Assurez-vous que votre instance Fonrex est en cours d'exécution (ou demandez l'URL d'accès à votre administrateur d'infrastructure) :
- URL locale par défaut : `http://localhost:5000`

---

## 📌 Étape 2 : Connecter Google Sheets (No-Code)

Alimentez vos modèles financiers directement depuis vos feuilles de calcul Google Sheets :

1. Ouvrez votre document Google Sheets.
2. Utilisez l'extension **Fonrex Sheets Connector** ou la formule `=IMPORTDATA()` :
   ```excel
   =IMPORTDATA("http://localhost:5000/api/v1/fundamentals/ratios?symbol=AAPL&format=csv")
   ```
3. Récupérez automatiquement les P/E Ratios, Free Cash Flows, Marges opérationnelles et ROE actualisés.

*(Consultez le [Guide du Connecteur Google Sheets](/docs/guides/google-sheets-connector) pour les fonctions personnalisées).*

---

## 📌 Étape 3 : Configurer l'OpenBB Terminal Workspace

Visualisez vos données Fonrex dans l'interface institutionnelle OpenBB Workspace :

1. Ouvrez votre **OpenBB Terminal**.
2. Ajoutez la source de données custom Fonrex dans vos préférences de backend.
3. Chargez le profil de tableau de bord préconfiguré Fonrex.

![OpenBB Workspace Fonrex](/img/template-preview.png)

*(Suivez le [Guide d'intégration OpenBB Workspace](/docs/guides/openbb-workspace) pour personnaliser vos widgets).*

---

## 📌 Étape 4 : Modèles de Valorisation & DCF (Discounted Cash Flow)

Interrogez le moteur de valorisation automatique pour calculer la valeur intrinsèque d'une entreprise :

```bash
curl "http://localhost:5000/api/v1/valuation/dcf?symbol=AAPL&wacc=0.085&growth_rate=0.05"
```

Exemple de réponse :
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

## 🎯 Prochaines étapes suggérées

- 🏛️ [Référence de l'API Fundamentals & Ratios](/docs/api-reference/fundamentals)
- 💰 [Référence du Moteur DCF](/docs/api-reference/valuation-dcf)
- 📰 [Référence News & Sentiment d'actualités](/docs/api-reference/news)
