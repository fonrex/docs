---
id: "treasury-curves"
title: "Référence API des courbes de taux du Trésor américain"
sidebar_label: "Courbes de taux du Trésor"
description: "Les courbes de taux quotidiennes du Trésor américain, nominale depuis 1990 et réelle (TIPS) depuis 2003 : la courbe d'un jour, les maturités et les écarts dans le temps, le point mort d'inflation"
---

# Référence API des courbes de taux du Trésor américain

Fonrex lit les courbes de taux quotidiennes du [Trésor américain](https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics) (fichiers gratuits, sans clé) et les garde dans votre base de données, jour par jour :

- la **courbe nominale** (taux « par »), depuis 1990, de 1 mois à 30 ans ;
- la **courbe réelle** (TIPS, indexée sur l'inflation), depuis 2003, de 5 à 30 ans.

FRED republie le taux à 10 ans de cette courbe (`DGS10`) et demande une clé. Le Trésor donne toute la courbe, chaque jour depuis 1990, sans clé : c'est aussi le taux sans risque américain du DCF quand FRED n'en donne pas (voir [Valorisation](./valuation-dcf.md)).

| Route | Ce qu'elle fait |
|---|---|
| `GET /macro/treasury/curve` | La courbe d'un jour, avec le point mort d'inflation et des comparaisons avec d'autres jours |
| `GET /macro/treasury/series` | Des maturités (`10Y`) et des écarts (`10Y-2Y`) dans le temps |
| `POST /macro/treasury/refresh` | Lit à la demande des années des courbes auprès du Trésor |

## Maturités

| `tenor` | Maturité | Courbe nominale | Courbe réelle |
|---|---|---|---|
| `1M`, `2M`, `3M`, `4M`, `6M` | 1, 2, 3, 4, 6 mois | ✓ | |
| `6W` | 6 semaines (le « 1.5 Month » du Trésor) | ✓ | |
| `1Y`, `2Y`, `3Y` | 1, 2, 3 ans | ✓ | |
| `5Y`, `7Y`, `10Y`, `20Y`, `30Y` | 5, 7, 10, 20, 30 ans | ✓ | ✓ |

Les maturités publiées ont changé au fil des années : `1M` depuis juillet 2001, `2M` depuis octobre 2018, `4M` depuis octobre 2022, `6W` depuis février 2025 ; pas de `20Y` avant octobre 1993, pas de `30Y` de février 2002 à février 2006 ; sur la courbe réelle, `20Y` depuis juillet 2004 et `30Y` depuis février 2010. Une maturité non publiée un jour n'a pas de taux : une courbe de 1990 compte 9 maturités, une courbe de 2026 en compte 14.

- **Les taux sont des ratios** : `0.0509` vaut 5,09 %. Un taux réel peut être négatif (tous les jours de 2012 et de 2021), un taux nominal peut être nul (de 2008 à 2015, en 2020, en 2021).
- **Un jour est un jour ouvré du Trésor** : un week-end ou un jour férié n'a pas de courbe, et une demande pour ce jour reçoit le jour ouvré d'avant.

## Fraîcheur

Une année d'une courbe est lue auprès du Trésor la première fois qu'une requête en a besoin : un fichier par an, de quelques kilo-octets. Ensuite :

- une **année passée** lue après sa fin est complète : elle n'est plus jamais redemandée ;
- l'**année en cours** est relue dès que sa dernière lecture date de plus de **`TREASURY_REFRESH_HOURS`** heures (12 par défaut) ;
- quand le Trésor ne répond pas, les taux enregistrés sont donnés avec `load.status` = `failed` et la raison, et les années suivantes de la requête ne sont pas demandées.

Pour charger tout l'historique en une fois (37 fichiers pour la courbe nominale, 24 pour la réelle) :

```bash
docker compose exec fonrex-api python scripts/load_treasury_curve.py
```

Chaque réponse indique dans `load` ce qui a été fait : `fetched` (une année lue maintenant), `fresh` (tout ce qu'il fallait était enregistré) ou `failed`, avec les années lues et le premier et le dernier jour enregistrés.

---

## <span className="api-method get">GET</span> `/macro/treasury/curve`

La courbe d'un jour, de la maturité la plus courte à la plus longue, avec le **point mort d'inflation** du jour (taux nominal moins taux réel, de 5 à 30 ans).

| Paramètre | Défaut | Description |
|---|---|---|
| `curve` | `nominal` | `nominal` ou `real` |
| `date` | le dernier jour | Le jour ouvré à cette date ou juste avant |
| `compare` | — | Jusqu'à 5 autres jours, répétés : une date, ou un décalage avant le jour (`1W`, `1M`, `3M`, `1Y`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/curve?compare=1M&compare=1Y"
```

```json
{
  "curve": "nominal",
  "label": "Par yield curve (nominal)",
  "source": "US Treasury, Daily Treasury Par Yield Curve Rates (https://home.treasury.gov)",
  "requested_date": null,
  "date": "2026-10-16",
  "points": [
    { "tenor": "1M", "months": 1.0, "value": 0.0412 },
    { "tenor": "6W", "months": 1.5, "value": 0.0414 },
    { "tenor": "2Y", "months": 24.0, "value": 0.0474 },
    { "tenor": "10Y", "months": 120.0, "value": 0.0509 },
    { "tenor": "30Y", "months": 360.0, "value": 0.0543 }
  ],
  "comparisons": [
    {
      "requested": "1M",
      "date": "2026-09-16",
      "points": [{ "tenor": "10Y", "months": 120.0, "value": 0.0501, "change": 0.0008 }]
    },
    {
      "requested": "1Y",
      "date": "2025-10-16",
      "points": [{ "tenor": "10Y", "months": 120.0, "value": 0.0399, "change": 0.011 }]
    }
  ],
  "breakeven": [
    { "tenor": "5Y", "months": 60.0, "value": 0.0237 },
    { "tenor": "10Y", "months": 120.0, "value": 0.0235 },
    { "tenor": "30Y", "months": 360.0, "value": 0.0227 }
  ],
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-17T10:32:05Z",
    "first_day": "1990-01-02",
    "last_day": "2026-10-16",
    "years_read": [],
    "years_failed": [],
    "reason": null
  }
}
```

Les listes sont raccourcies ici : la réponse donne toutes les maturités du jour. `change` est le taux du jour demandé moins le taux du jour comparé (`0.011` vaut 110 points de base) ; une comparaison avant le premier jour enregistré n'a ni date ni points. `breakeven` est vide un jour sans taux réels (avant 2003).

---

## <span className="api-method get">GET</span> `/macro/treasury/series`

Des maturités, et des écarts entre deux maturités, jour par jour, du plus ancien au plus récent.

| Paramètre | Défaut | Description |
|---|---|---|
| `tenor` | `10Y` | Jusqu'à 6 maturités (`10Y`) ou écarts (`10Y-2Y`), répétés ou séparés par des virgules |
| `curve` | `nominal` | `nominal` ou `real` |
| `start` | 10 ans avant `end` | Premier jour inclus |
| `end` | aujourd'hui | Dernier jour inclus |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/series?tenor=10Y-2Y&start=2023-07-01&end=2023-07-05"
```

```json
{
  "curve": "nominal",
  "label": "Par yield curve (nominal)",
  "source": "US Treasury, Daily Treasury Par Yield Curve Rates (https://home.treasury.gov)",
  "start": "2023-07-01",
  "end": "2023-07-05",
  "series": [
    {
      "tenor": "10Y-2Y",
      "observations": [
        { "date": "2023-07-03", "value": -0.0108 },
        { "date": "2023-07-05", "value": -0.0099 }
      ]
    }
  ],
  "load": { "status": "fresh", "...": "..." }
}
```

Un écart n'est donné que les jours où les deux maturités sont publiées. Sous zéro, la courbe est **inversée** : l'écart 10 ans moins 2 ans a été négatif les 1er et 4 avril 2022, puis de juillet 2022 à septembre 2024, jusqu'à -1,08 % le 3 juillet 2023.

---

## <span className="api-method post">POST</span> `/macro/treasury/refresh`

Lit des années des courbes auprès du Trésor et les enregistre. Demande une clé à accès complet : une clé en lecture seule reçoit `403`.

| Paramètre | Défaut | Description |
|---|---|---|
| `curve` | les deux | `nominal`, `real`, répété |
| `start_year`, `end_year` | l'année en cours | Années lues (1990 ou après) |
| `force` | `false` | Lire même les années à jour |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/refresh?start_year=1990"
```

La réponse donne un `load` par courbe, avec sa `curve`.

## Erreurs

| Statut | Quand |
|---|---|
| `404` | Aucune courbe à la date demandée ou avant (la courbe nominale commence en 1990, la réelle en 2003) |
| `422` | Courbe inconnue, maturité que la courbe ne publie pas (`2Y` de la courbe réelle), écart de plus de deux maturités, plus de 6 séries ou de 5 comparaisons, `start` après `end`, un `compare` qui n'est ni une date ni un décalage |
| `502` | Le Trésor n'a pas pu être lu et rien n'est enregistré pour la courbe |
| `503` | Pas de base de données |

## Widgets OpenBB

- **Fonrex Treasury Curve** (`fonrex_treasury_curve`) : la courbe du jour, avec en pointillés les courbes d'il y a 1 mois et 1 an (`compare`, `1M,1Y` par défaut) ; `curve` et `date` comme ci-dessus.
- **Fonrex Treasury Spread** (`fonrex_treasury_spread`) : l'écart 10 ans moins 2 ans sur les 10 dernières années, avec une ligne à zéro ; `tenor` accepte aussi `10Y-3M`, `30Y-5Y` ou des maturités (`2Y,10Y`).

Les deux sont dans l'onglet *Macro Context* du tableau de bord **Fonrex — Screener & Macro**. Voir le [guide OpenBB Workspace](../guides/openbb-workspace.md).
