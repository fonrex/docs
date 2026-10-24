---
id: "esef-filings"
title: "Référence API des rapports ESEF (rapports annuels européens)"
sidebar_label: "Rapports ESEF (Europe)"
description: "Les états annuels des sociétés cotées européennes, lus dans leurs rapports ESEF sur filings.xbrl.org, et les états Yahoo vérifiés par rapport à eux"
---

# Référence API des rapports ESEF (rapports annuels européens)

Depuis les exercices commencés en 2020, une société cotée sur un marché réglementé de l'Union européenne publie son rapport annuel au **format électronique unique européen** (ESEF) : un document XHTML dont les chiffres sont balisés en XBRL avec la taxonomie IFRS. [filings.xbrl.org](https://filings.xbrl.org), tenu par XBRL International, rassemble ces rapports et convertit chacun en xBRL-JSON. Fonrex les lit (gratuit, sans clé), garde leurs chiffres dans votre base de données et s'en sert, comme des [dépôts SEC](./sec-filings.md) pour les sociétés américaines, comme **source de vérification** des états enregistrés depuis Yahoo Finance.

| Route | Ce qu'elle fait |
|---|---|
| `GET /esef/{ticker}/statements` | Les états annuels publiés en ESEF, chaque chiffre avec son concept, son rapport et un lien vers lui |
| `GET /esef/{ticker}/check` | Les états Yahoo vérifiés par rapport aux rapports ESEF, chiffre par chiffre |
| `GET /esef/{ticker}/filings` | Les rapports de la société dans l'index, et ce que leur lecture a trouvé |
| `POST /esef/{ticker}/refresh` | Redemande la société à GLEIF et lit tous les rapports tout de suite |

:::caution Couverture
filings.xbrl.org indique que son index **n'est pas complet**. Aucun rapport de société allemande n'y figure (SAP n'en a aucun), et l'Irlande est mal couverte. Seuls les rapports annuels sont publiés en ESEF ; quelques sociétés (Novo Nordisk) publient aussi leurs semestres et trimestres, que Fonrex garde mais ne prend jamais pour un exercice.
:::

## Quels instruments

Les rapports sont classés par **LEI** (Legal Entity Identifier), pas par ticker. Fonrex demande à [GLEIF](https://www.gleif.org), le registre officiel des LEI, le LEI de l'**ISIN** de l'instrument, jamais de son ticker : `NL0000235190` est un seul titre émis par Airbus, quoi que signifie `AIR` sur une autre bourse.

- Un instrument **sans ISIN**, ou d'un type qui ne publie pas de rapport annuel (ETF, fonds, indice, devise), n'est pas recherché.
- L'entité donnée par GLEIF doit porter le **nom** de l'instrument dans votre catalogue, son nom légal ou l'un de ses autres noms, les formes juridiques mises de côté (`S.A.`, `SE`, `N.V.`, `S.p.A.`, `A/S`, `AB (publ)`…). `Novo Nordisk B` est `NOVO NORDISK A/S` ; `Air Liquide` est retrouvé dans son long nom légal `L'AIR LIQUIDE SOCIETE ANONYME POUR L'ETUDE…`. Un nom qui ne correspond pas est refusé, avec le nom donné par GLEIF : `Total` n'est pas `TotalEnergies SE`.
- Le LEI trouvé est gardé pour l'**instrument** : toutes ses cotations partagent les mêmes rapports. Un LEI que vous saisissez vous-même dans `asset_mappings` (fournisseur `LEI`, `source` = `manual`, sans cotation) est pris tel quel.
- Un instrument pour lequel aucun LEI n'a été trouvé n'est pas recherché à nouveau pendant 30 jours ; `POST /esef/{ticker}/refresh` le recherche aussitôt.
- Quand plusieurs instruments partagent un ticker, ajoutez `isin=` pour en choisir un.

## Comment les rapports sont lus

- **Un rapport par période.** L'index peut contenir un rapport par langue (TotalEnergies publie en français et en anglais) ou une seconde version (BNP Paribas, `-0` et `-1`). Parmi les rapports listés à la même période, seul celui que l'index a traité en dernier est lu ; les autres restent dans l'index, non lus.
- **Un rapport n'est lu qu'une fois.** Un rapport lu, refusé ou sans xBRL-JSON n'est pas relu, sauf si son fichier change ou si vous le demandez (`refresh`). Un rapport que filings.xbrl.org n'a pas fourni est redemandé à la lecture suivante.
- **Les totaux seulement.** Un rapport balise des centaines de chiffres ; Fonrex garde les totaux, jamais une ventilation par segment ou par composante des capitaux propres, ni les textes des annexes, qui font l'essentiel des 0,1 à 32 Mo d'un rapport.
- **La période vient des chiffres.** La période que l'index donne à un rapport peut être fausse : le rapport de Pernod Ricard listé au 31 décembre 2021 contient l'exercice clos le 30 juin 2021. Fonrex date chaque chiffre par sa propre période.
- **Un retraitement l'emporte** : un rapport reprend l'année précédente et peut la corriger. Pour chaque période, la valeur du rapport le plus récent est gardée, et le chiffre dit de quel rapport il vient.
- **Un exercice est une période de 350 à 380 jours** ; un chiffre de bilan est une valeur à la fin de l'exercice. Les semestres et les trimestres sont gardés mais écartés des états.
- **Une devise par année** : celle du rapport le plus récent. TotalEnergies, société française, publie en **dollars américains** : ses chiffres sont en dollars.
- **Un fichier est lu en entier ou pas du tout** : un chiffre d'une autre société, une période qui n'est pas une date ou une valeur qui n'est pas un nombre font refuser le rapport, et `/filings` en donne la raison. Deux valeurs pour le même chiffre n'écartent que ce chiffre.

### Chiffres

Les chiffres sont ceux des [dépôts SEC](./sec-filings.md#chiffres), sous les mêmes noms : ceux des colonnes de `financial_statements`. Leurs concepts IFRS, dans l'ordre :

| Chiffre | Concepts IFRS |
|---|---|
| `revenue` | `Revenue` (Airbus, Novo Nordisk), `RevenueFromContractsWithCustomers` (TotalEnergies, Pernod Ricard), `RevenueFromSaleOfGoods` |
| `net_income` | `ProfitLossAttributableToOwnersOfParent`, puis `ProfitLoss` pour une société sans intérêts minoritaires (Novo Nordisk) |
| `total_equity` | `EquityAttributableToOwnersOfParent`, puis `Equity` |
| `operating_income` | `ProfitLossFromOperatingActivities` |
| `total_assets` | `Assets` |
| `operating_cashflow` | `CashFlowsFromUsedInOperatingActivities` |

Un chiffre que la société ne balise pas est absent. Le nombre moyen pondéré d'actions est rarement balisé en ESEF, et une banque n'a pas de chiffre d'affaires : en pratique, 14 à 21 des 30 chiffres sont remplis, selon la société.

## Fraîcheur

Les rapports d'une société sont listés et lus la première fois qu'ils sont demandés. Ensuite :

- une société lue il y a moins de **`ESEF_REFRESH_HOURS`** heures (24 par défaut) est servie depuis la base de données ;
- pour une société plus ancienne, l'index est relu, et seuls ses nouveaux rapports sont lus ;
- quand filings.xbrl.org ne répond pas, les chiffres gardés sont donnés avec `load.status` = `failed` et la raison.

Chaque réponse indique dans `load` ce qui a été fait : `fetched` (lu maintenant), `fresh` (lu récemment) ou `failed`, avec `filings` (dans l'index), `last_report_end` (la dernière période lue), `facts` (les valeurs gardées) et, pour une lecture faite maintenant, les rapports lus (`read`) et refusés (`refused`).

Pour lire d'un coup les rapports de toutes les actions de votre catalogue :

```bash
docker compose exec fonrex-api python scripts/load_esef.py
docker compose exec fonrex-api python scripts/load_esef.py --ticker AIR.PA TTE.PA --force
```

Une ligne par action : son statut, son LEI et ce qui a été lu. Les fonds et les actions sans ISIN sont laissés de côté. La première lecture d'un grand catalogue prend du temps ; les suivantes ne lisent que les nouveaux rapports.

---

## <span className="api-method get">GET</span> `/esef/{ticker}/statements`

Les états annuels publiés en ESEF, l'exercice le plus récent en premier.

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `years` | toutes les années | Exercices les plus récents donnés (1 à 30) |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/statements?years=1"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "source": "ESEF annual reports, filings.xbrl.org (XBRL International, https://filings.xbrl.org); LEI from GLEIF (https://www.gleif.org)",
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-21T07:00:00Z",
    "filings": 5,
    "last_report_end": "2025-12-31",
    "facts": 1310,
    "read": [],
    "refused": {},
    "reason": null
  },
  "years": [
    {
      "period_end": "2025-12-31",
      "currency": "EUR",
      "figures": {
        "revenue": {
          "value": 73420000000.0,
          "concept": "Revenue",
          "taxonomy": "ifrs-full",
          "unit": "EUR",
          "fxo_id": "MINO79WLOO247M1IL051-2025-12-31-ESEF-NL-0",
          "report_end": "2025-12-31",
          "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/MINO79WLOO247M1IL051-2025-12-31-1-en/reports/ixbrlviewer.html"
        },
        "net_income": { "value": 5221000000.0, "concept": "ProfitLossAttributableToOwnersOfParent", "...": "..." },
        "total_assets": { "value": 134939000000.0, "concept": "Assets", "...": "..." },
        "eps_diluted": { "value": 6.6, "unit": "EUR/shares", "...": "..." }
      }
    }
  ]
}
```

`fxo_id` nomme le rapport du chiffre, et `viewer_url` l'ouvre dans la visionneuse de filings.xbrl.org, où le chiffre balisé se retrouve dans le rapport lui-même.

---

## <span className="api-method get">GET</span> `/esef/{ticker}/check`

Les états enregistrés depuis Yahoo vérifiés par rapport aux rapports ESEF, avec les règles de la [vérification SEC](./sec-filings.md#get-sectickercheck) : les mêmes chiffres comparés, la même tolérance (**`SEC_CHECK_TOLERANCE`**, 1 % par défaut), une année associée par sa date de fin à deux semaines près, les paiements comparés en montants, la trésorerie et les capitaux propres non comparés.

| `status` | Signification |
|---|---|
| `match` | Même valeur, à la tolérance près |
| `mismatch` | Un écart plus grand que la tolérance : à regarder |
| `missing_yahoo` | Dans le rapport ESEF, absent chez Yahoo |
| `missing_esef` | Donné par Yahoo, non balisé dans le rapport ESEF |

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `years` | toutes les années | Exercices les plus récents donnés (1 à 30) |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/check?years=1"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "tolerance": 0.01,
  "not_compared": {
    "cash_and_equivalents": "Yahoo may add the short-term investments",
    "total_equity": "Yahoo includes the minority interests"
  },
  "load": { "status": "fresh", "...": "..." },
  "years": [
    {
      "period_end": "2025-12-31",
      "yahoo_period_end": "2025-12-31",
      "currency": "EUR",
      "yahoo_currency": "EUR",
      "note": null,
      "match": 9,
      "mismatch": 1,
      "missing_yahoo": 2,
      "missing_esef": 2,
      "figures": [
        {
          "column": "revenue",
          "statement": "income",
          "status": "match",
          "esef": 73420000000.0,
          "yahoo": 73420000000.0,
          "difference": 0.0,
          "concept": "Revenue",
          "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/…/ixbrlviewer.html"
        }
      ]
    }
  ]
}
```

Les valeurs sont données à titre d'exemple. Une année dans une autre devise n'est pas comparée, et sa `note` le dit : Yahoo peut donner TotalEnergies en euros, son rapport en dollars. Un `mismatch` n'est pas toujours une erreur de Yahoo : ouvrez le rapport (`viewer_url`) avant de corriger quoi que ce soit.

---

## <span className="api-method get">GET</span> `/esef/{ticker}/filings`

Les rapports de la société dans l'index de filings.xbrl.org, la période la plus récente en premier, avec ce que leur lecture a trouvé.

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/filings"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "load": { "status": "fresh", "...": "..." },
  "filings": [
    {
      "fxo_id": "MINO79WLOO247M1IL051-2025-12-31-ESEF-NL-0",
      "listed_period_end": "2025-12-31",
      "report_end": "2025-12-31",
      "country": "NL",
      "read_status": "read",
      "read_reason": null,
      "facts": 269,
      "breakdowns": 171,
      "conflicts": 0,
      "error_count": 0,
      "warning_count": 2,
      "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/…/ixbrlviewer.html",
      "json_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/MINO79WLOO247M1IL051-2025-12-31-1-en.json",
      "...": "..."
    }
  ]
}
```

| Champ | Signification |
|---|---|
| `listed_period_end` | La période que l'index donne au rapport : elle peut être fausse |
| `report_end` | La fin de la dernière période de ses chiffres, une fois lu : la vraie période |
| `read_status` | `read` ; `refused` (`read_reason` dit pourquoi) ; `missing` (pas de xBRL-JSON) ; `null` quand il n'est pas lu : un autre rapport de la même période a été lu, ou il n'a pas encore été fourni |
| `facts`, `breakdowns`, `conflicts` | Valeurs gardées, ventilations écartées, chiffres donnés deux fois avec deux valeurs et écartés |
| `error_count`, `warning_count`, `inconsistency_count` | La validation du rapport par filings.xbrl.org |

---

## <span className="api-method post">POST</span> `/esef/{ticker}/refresh`

Redemande à GLEIF le LEI de l'instrument, liste ses rapports et relit chaque période tout de suite, même s'ils ont été lus récemment. Demande une clé à accès complet : une clé en lecture seule reçoit `403`.

| Paramètre | Défaut | Description |
|---|---|---|
| `ticker` | — | Un ticker de votre catalogue |
| `isin` | — | L'instrument, quand plusieurs partagent le ticker |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/refresh"
```

La réponse donne `ticker`, `lei`, `entity_name` et le `load` de la lecture, avec les rapports lus (`read`) et refusés (`refused`).

## Erreurs

| Statut | Quand |
|---|---|
| `404` | Ticker inconnu, ou pas de rapport ESEF pour l'instrument (la raison est donnée : pas d'ISIN, un fonds, un nom que GLEIF ne confirme pas…) |
| `422` | `years` hors de 1 à 30 |
| `502` | filings.xbrl.org n'a pas pu être lu et rien n'était encore gardé pour la société |
| `503` | Pas de base de données |

## Widget OpenBB

**Fonrex ESEF Check** (`fonrex_esef_check`) affiche la vérification sous forme de tableau : une ligne par année et par chiffre, les écarts en premier, avec les valeurs ESEF et Yahoo, l'écart en pourcentage, le concept IFRS et le lien vers le rapport dans la visionneuse. Son paramètre `years` vaut 3 par défaut. Ajoutez-le à votre propre tableau de bord ; voir le [guide OpenBB Workspace](../guides/openbb-workspace.md).
