---
id: "assets"
title: "Référence API Actifs & Cotations"
sidebar_label: "Actifs & Cotations"
description: "Documentation pour la résolution d'identité des actifs, cotations et endpoints d'historique EOD"
---


# Référence API Actifs & Cotations

L'API d'actifs gère l'identité des instruments financiers, les cotations sur les différentes places financières et la récupération de l'historique EOD en plusieurs formats.

---

## <span className="api-method get">GET</span> `/assets/by-isin/{isin}`

Récupérer un instrument financier canonique et toutes ses cotations actives sur les places financières par code ISIN.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `isin` | `string` | ✅ | — | Code ISIN à 12 caractères (ex. `NL0000235190`) |

### Exemple de Réponse

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

### Exemples

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

Rechercher des cotations par ticker, ISIN, place financière ou devise.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ❌ | — | Symbole ticker (ex. `AAPL`) |
| `isin` | `string` | ❌ | — | Code ISIN |
| `exchange` | `string` | ❌ | — | Code de place financière (ex. `XPAR`, `NASDAQ`) |
| `currency` | `string` | ❌ | — | Code devise à 3 lettres (ex. `EUR`, `USD`) |
| `limit` | `integer` | ❌ | `50` | Nombre maximum de résultats à retourner |

---

## <span className="api-method get">GET</span> `/eod/{ticker}`

Récupérer les prix historiques de fin de journée (EOD) au format JSON ou CSV. Déclenche automatiquement l'ingestion si les données locales sont manquantes.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Symbole ticker (ex. `AIR.PA`, `AAPL`) |
| `period` | `string` | ✅ | — | Période temporelle (ex. `1d`, `5d`, `1mo`, `1y`, `max`) |
| `resolution` | `string` | ❌ | `d` | Résolution des bougies (`d`, `w`, `m`) |
| `format` | `string` | ❌ | `json` | Format de sortie (`json`, `csv`) |
| `limit` | `integer` | ❌ | `100` | Nombre de bougies historiques à retourner |
| `order` | `string` | ❌ | `asc` | Ordre de tri par date (`asc`, `desc`) |

### Codes de Retour

| Code | Description |
|---|---|
| 200 | Success |
| 404 | Actif/Cotation non trouvé |
| 422 | Paramètre de requête invalide |
