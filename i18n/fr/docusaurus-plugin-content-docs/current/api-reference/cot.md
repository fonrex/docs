---
id: "cot"
title: "Référence API des Commitments of Traders"
sidebar_label: "Commitments of Traders"
description: "Les rapports hebdomadaires Commitments of Traders de la CFTC : positions des spéculateurs et des couvreurs sur les marchés à terme américains (indices, taux, devises, matières premières), position nette, COT index"
---

# Référence API des Commitments of Traders

Chaque semaine, la Commodity Futures Trading Commission (CFTC) américaine publie les positions tenues le mardi sur les marchés à terme américains, par type d'intervenant : ce sont les rapports [Commitments of Traders](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm). Fonrex lit leurs fichiers gratuits (sans clé) et les garde dans votre base de données, semaine par semaine.

C'est un **signal de sentiment** : qui tient le marché, et à quelle distance sa position est de son niveau habituel. Il évolue lentement (un chiffre par semaine, connu trois jours plus tard) et sert surtout à un usage quantitatif avancé.

| Route | Ce qu'elle fait |
|---|---|
| `GET /cot/markets` | Les marchés en base, avec leur code CFTC et leur dernier nom |
| `GET /cot/positions` | Les positions de chaque type d'intervenant sur un marché, rapport par rapport |
| `GET /cot/signals` | Le positionnement d'un type d'intervenant sur un marché : position nette, part de l'open interest, variation, COT index |
| `GET /cot/extremes` | Le dernier rapport de plusieurs marchés, le positionnement le plus extrême en premier |
| `POST /cot/refresh` | Lit à la demande des années des rapports auprès de la CFTC |

## Rapports et types d'intervenants

Fonrex lit trois rapports, contrats à terme seuls (*futures only*) :

| `report` | Marchés | Depuis | Types d'intervenants (`category`) |
|---|---|---|---|
| `legacy` | Tous les marchés | janvier 1986 | `noncommercial` (les spéculateurs), `commercial` (les couvreurs), `nonreportable` (les petits intervenants) |
| `tff` (Traders in Financial Futures) | Marchés financiers : indices boursiers, taux, devises, VIX, bitcoin | juin 2006 | `dealer`, `asset_manager`, `leveraged_funds` (hedge funds, CTA), `other_reportable`, `nonreportable` |
| `disaggregated` | Matières premières : énergie, métaux, agriculture | juin 2006 | `producer_merchant`, `swap_dealer`, `managed_money` (hedge funds, CTA), `other_reportable`, `nonreportable` |

Les **spéculateurs** de chaque rapport sont suivis par défaut : `noncommercial`, `leveraged_funds`, `managed_money`. La CFTC classe chaque intervenant d'après ce qu'il déclare ; la classe d'un intervenant n'est pas publiée.

Chaque type d'intervenant tient des positions **longues**, **courtes** et, pour certains, de **spreading** (à la fois longues et courtes sur le même marché, sur des échéances différentes), en nombre de contrats. Les positions longues de tous les types s'additionnent pour donner l'open interest, de même que les positions courtes.

## Marchés

Un marché est son **code CFTC** (*contract market code*), six caractères : `13874A` pour le E-mini S&P 500, `043602` pour le T-Note à 10 ans, `067651` pour le pétrole WTI, `088691` pour l'or. Le code reste quand le nom change (`067651` s'appelait `CRUDE OIL, LIGHT SWEET` et s'appelle aujourd'hui `WTI-PHYSICAL`) ; les réponses donnent le dernier nom. `GET /cot/markets` liste les codes.

Un marché sort du rapport les semaines où il compte moins de 20 gros intervenants, et y revient ensuite. Les rapports Legacy paraissaient **deux fois par mois** jusqu'en septembre 1992, puis chaque semaine.

Les **marchés clés** sont affichés quand aucun marché n'est demandé :

| Rapport | Marchés clés |
|---|---|
| `tff` | E-mini S&P 500 `13874A`, Nasdaq mini `209742`, Russell 2000 E-mini `239742`, T-Note 2 ans `042601`, T-Note 10 ans `043602`, euro `099741`, yen `097741`, livre `096742`, VIX `1170E1`, bitcoin `133741` |
| `disaggregated` | WTI `067651`, gaz naturel `023651`, or `088691`, argent `084691`, cuivre `085692`, maïs `002602`, soja `005602`, blé `001602` |
| `legacy` | E-mini S&P 500, Nasdaq mini, T-Note 10 ans, euro, yen, or, WTI, gaz naturel, maïs |

## Signaux

Pour un type d'intervenant, rapport par rapport :

- **`net`** : les positions longues moins les courtes, en contrats ;
- **`net_share`** : `net` rapporté à l'open interest (`-0.2116` vaut -21,16 %) ;
- **`change`** : la variation de `net` depuis le rapport précédent en base ;
- **`cot_index`** : la place de `net` entre son plus bas (0) et son plus haut (100) sur une **fenêtre** de semaines (`window`, 156 par défaut : trois ans). La fenêtre est une durée, pas un nombre de rapports. L'index reste vide tant que le marché n'a pas de rapports sur toute la fenêtre, et quand `net` n'a pas bougé pendant celle-ci. Près de 100, ce type d'intervenant est aussi acheteur qu'il l'a été sur la fenêtre ; près de 0, aussi vendeur.

### Date du rapport et jour de publication

Les positions sont celles du **mardi** (`date`). La CFTC les publie le **vendredi** à 15 h 30, heure de New York : `published_on` donne ce vendredi. C'est une estimation : un jour férié décale la publication d'un jour ou deux, les rapports d'avant octobre 1992 paraissaient plus tard, et la CFTC ne garde les vraies dates que sur les 13 derniers mois.

:::caution Backtests
Un backtest doit utiliser `published_on`, pas `date` : le mardi, personne ne connaît encore les positions de ce mardi.
:::

## Fraîcheur

La CFTC publie un fichier par rapport et par an, et un seul fichier pour toutes les années jusqu'en 2016 (Legacy : 23 Mo). Une année est lue la première fois qu'une requête en a besoin. Ensuite :

- les **années jusqu'en 2016** arrivent ensemble dans le fichier historique de leur rapport : lues une fois, plus jamais ;
- une **année passée plus récente**, lue à partir du 15 janvier de l'année suivante, est complète : elle n'est plus jamais demandée ;
- l'**année en cours** est relue dès que sa dernière lecture date de plus de **`COT_REFRESH_HOURS`** heures (24 par défaut) ;
- quand la CFTC ne répond pas (une année pas encore publiée répond `404`), les rapports en base sont rendus avec `load.status` = `failed` et la raison, et les années suivantes de la requête ne sont pas demandées.

Un fichier est lu en entier ou pas du tout : une mise en page changée, une date hors du fichier, une ligne donnée deux fois ou des positions qui ne retombent pas sur l'open interest le font refuser, et ce qui était en base est gardé.

Pour charger d'un coup tout l'historique des trois rapports (environ 15 à 20 minutes) :

```bash
docker compose exec fonrex-api python scripts/load_cot.py
docker compose exec fonrex-api python scripts/load_cot.py --report tff --start-year 2020 --force
```

Le script affiche une ligne par rapport et sort avec `1` quand une année n'a pas pu être lue. Chaque réponse des routes indique, dans `load`, ce qui a été fait : `fetched` (une année lue à l'instant), `fresh` (tout ce qu'il fallait était en base) ou `failed`, avec les années lues et la première et la dernière date de rapport en base.

---

## <span className="api-method get">GET</span> `/cot/markets`

Les marchés en base, par rapport puis par code, avec leur dernier nom, l'unité de leurs contrats et les dates de rapport en base. L'année en cours de chaque rapport demandé est d'abord lue si besoin, pour qu'une instance neuve liste les marchés des derniers rapports ; les années plus anciennes sont lues par les routes d'un marché ou par `POST /cot/refresh`.

| Paramètre | Défaut | Description |
|---|---|---|
| `report` | les trois | `legacy`, `tff` ou `disaggregated` |
| `q` | — | Une partie du nom ou du code, sans tenir compte de la casse (`gold`, `S&P`, `13874`) |
| `key` | `false` | Seulement les marchés clés |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/markets?report=tff&q=13874A"
```

```json
{
  "markets": [
    {
      "report": "tff",
      "market": "13874A",
      "name": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
      "contract_units": "($50 X S&P 500 INDEX)",
      "first_date": "2006-06-13",
      "last_date": "2026-10-13",
      "weeks": 1062,
      "key": true
    }
  ],
  "loads": [{ "report": "tff", "status": "fresh", "...": "..." }],
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

`weeks` est le nombre de dates de rapport en base pour le marché.

---

## <span className="api-method get">GET</span> `/cot/positions`

Les positions de chaque type d'intervenant sur un marché, rapport par rapport, du plus ancien au plus récent.

| Paramètre | Défaut | Description |
|---|---|---|
| `market` | — | Code CFTC du marché (obligatoire) |
| `report` | `legacy` | `legacy`, `tff` ou `disaggregated` |
| `start` | 3 ans avant `end` | Première date de rapport incluse |
| `end` | aujourd'hui | Dernière date de rapport incluse |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/positions?market=088691&report=disaggregated&start=2026-10-13"
```

```json
{
  "report": "disaggregated",
  "market": "088691",
  "name": "GOLD - COMMODITY EXCHANGE INC.",
  "categories": [
    { "code": "producer_merchant", "label": "Producer / merchant / processor / user" },
    { "code": "swap_dealer", "label": "Swap dealers" },
    { "code": "managed_money", "label": "Managed money" },
    { "code": "other_reportable", "label": "Other reportables" },
    { "code": "nonreportable", "label": "Non-reportable" }
  ],
  "start": "2026-10-13",
  "end": "2026-10-18",
  "weeks": [
    {
      "date": "2026-10-13",
      "published_on": "2026-10-16",
      "open_interest": 396345,
      "positions": [
        { "category": "producer_merchant", "long": 18386, "short": 36823, "spreading": null, "net": -18437 },
        { "category": "swap_dealer", "long": 13976, "short": 238070, "spreading": 22057, "net": -224094 },
        { "category": "managed_money", "long": 124747, "short": 17658, "spreading": 33557, "net": 107089 },
        { "category": "other_reportable", "long": 120553, "short": 19763, "spreading": 12338, "net": 100790 },
        { "category": "nonreportable", "long": 50731, "short": 16079, "spreading": null, "net": 34652 }
      ]
    }
  ],
  "load": { "report": "disaggregated", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

---

## <span className="api-method get">GET</span> `/cot/signals`

Le positionnement d'un type d'intervenant sur un marché, rapport par rapport, du plus ancien au plus récent. Les rapports de la fenêtre avant `start` sont lus aussi, pour que le COT index de `start` soit calculé.

| Paramètre | Défaut | Description |
|---|---|---|
| `market` | — | Code CFTC du marché (obligatoire) |
| `report` | `legacy` | `legacy`, `tff` ou `disaggregated` |
| `category` | les spéculateurs du rapport | Un type d'intervenant du rapport |
| `window` | `156` | Semaines de la fenêtre du COT index (1 à 520) |
| `start` | 3 ans avant `end` | Première date de rapport donnée |
| `end` | aujourd'hui | Dernière date de rapport donnée |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/signals?market=13874A&report=tff&window=52&start=2026-10-01"
```

```json
{
  "report": "tff",
  "market": "13874A",
  "name": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
  "category": { "code": "leveraged_funds", "label": "Leveraged funds" },
  "window_weeks": 52,
  "start": "2026-10-01",
  "end": "2026-10-18",
  "signals": [
    {
      "date": "2026-10-06",
      "published_on": "2026-10-09",
      "open_interest": 1932227,
      "long": 113223,
      "short": 528310,
      "spreading": 48436,
      "net": -415087,
      "net_share": -0.214823,
      "change": -42598,
      "cot_index": 35.6
    },
    {
      "date": "2026-10-13",
      "published_on": "2026-10-16",
      "open_interest": 1931607,
      "long": 121404,
      "short": 530130,
      "spreading": 46956,
      "net": -408726,
      "net_share": -0.211599,
      "change": 6361,
      "cot_index": 37.9
    }
  ],
  "load": { "report": "tff", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

Le 13 octobre 2026, les leveraged funds étaient vendeurs nets de 408 726 contrats E-mini S&P 500, soit 21 % de l'open interest : à 37,9 entre leur position nette la plus basse et la plus haute des 52 dernières semaines.

---

## <span className="api-method get">GET</span> `/cot/extremes`

Le dernier rapport de plusieurs marchés, le COT index le plus éloigné de 50 en premier. Un marché sans index vient en dernier ; un marché demandé sans aucun rapport en base est listé dans `missing`.

| Paramètre | Défaut | Description |
|---|---|---|
| `report` | `legacy` | `legacy`, `tff` ou `disaggregated` |
| `market` | les marchés clés du rapport | Jusqu'à 20 codes, répétés ou séparés par des virgules |
| `category` | les spéculateurs du rapport | Un type d'intervenant du rapport |
| `window` | `156` | Semaines de la fenêtre du COT index |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/extremes?report=tff&window=52"
```

```json
{
  "report": "tff",
  "category": { "code": "leveraged_funds", "label": "Leveraged funds" },
  "window_weeks": 52,
  "markets": [
    {
      "market": "099741",
      "name": "EURO FX - CHICAGO MERCANTILE EXCHANGE",
      "signal": { "date": "2026-10-13", "net": -68001, "net_share": -0.077756, "change": -23740, "cot_index": 0.0, "...": "..." }
    },
    {
      "market": "133741",
      "name": "BITCOIN - CHICAGO MERCANTILE EXCHANGE",
      "signal": { "date": "2026-10-13", "net": -5844, "net_share": -0.281611, "change": 1008, "cot_index": 95.5, "...": "..." }
    },
    {
      "market": "1170E1",
      "name": "VIX FUTURES - CBOE FUTURES EXCHANGE",
      "signal": { "date": "2026-10-13", "net": 1105, "net_share": 0.002464, "change": -4389, "cot_index": 90.7, "...": "..." }
    }
  ],
  "missing": [],
  "load": { "report": "tff", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

La liste est raccourcie ici : la réponse donne tous les marchés clés. Le 13 octobre 2026, les leveraged funds étaient au plus vendeur des 52 dernières semaines sur l'euro (index 0).

---

## <span className="api-method post">POST</span> `/cot/refresh`

Lit des années des rapports auprès de la CFTC dans la base de données. Demande une clé à accès complet : une clé en lecture seule reçoit `403`.

| Paramètre | Défaut | Description |
|---|---|---|
| `report` | les trois | `legacy`, `tff`, `disaggregated`, répétés |
| `start_year`, `end_year` | l'année en cours | Années lues (1986 ou après) |
| `force` | `false` | Lire même les années à jour |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/refresh?report=tff&start_year=2006"
```

La réponse liste un `load` par rapport.

## Erreurs

| Statut | Quand |
|---|---|
| `404` | Aucun rapport du marché sur la période (`GET /cot/markets` liste les marchés en base) |
| `422` | Rapport inconnu, un marché qui n'est pas un code CFTC (six lettres, chiffres ou `+`), un type d'intervenant d'un autre rapport (`managed_money` dans `tff`), une fenêtre hors de 1 à 520, plus de 20 marchés, `start` après `end` |
| `502` | La CFTC n'a pas pu être lue et rien n'est en base |
| `503` | Pas de base de données |

## Widgets OpenBB

- **Fonrex COT Positioning** (`fonrex_cot_positioning`) : la position nette d'un type d'intervenant sur un marché (aire, axe de gauche) et son COT index (pointillés, axe de droite, de 0 à 100), sur les 3 dernières années ; les leveraged funds sur le E-mini S&P 500 par défaut. `market`, `report`, `category`, `window` et `start` comme ci-dessus.
- **Fonrex COT Extremes** (`fonrex_cot_extremes`) : le dernier rapport des marchés clés d'un rapport, le plus extrême en premier, avec la position nette, sa part de l'open interest, sa variation et une lecture (*Top of window* à 90 ou plus, *Bottom of window* à 10 ou moins). La lecture dit où se trouve la position nette dans sa fenêtre, pas si elle est acheteuse ou vendeuse : une position nette vendeuse qui n'a jamais été aussi petite se lit *Top of window*.

Les deux sont dans l'onglet *Macro Context* du tableau de bord **Fonrex — Screener & Macro**, sur le rapport TFF. Voir le [guide OpenBB Workspace](../guides/openbb-workspace.md).
