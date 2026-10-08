---
id: google-sheets-connector
title: Connecteur Google Sheets
sidebar_label: Connecteur Google Sheets
description: "Remplir un modèle Google Sheets avec les données fondamentales, les valorisations DCF et les indicateurs de votre propre instance Fonrex"
---

# Connecteur Google Sheets

Le modèle Fonrex Sheets remplit une feuille de calcul avec des données fondamentales, des valorisations DCF et des indicateurs techniques lus depuis **votre propre instance Fonrex**. Aucune donnée ne transite par un service exploité par Fonrex, et aucune offre payante n'est en jeu.

![Aperçu du connecteur Fonrex Sheets](/img/template-preview.png)

:::info
**Ce modèle affiche des données financières brutes à titre informatif uniquement.** Il ne constitue pas un conseil en investissement. Toutes les valeurs affichées (y compris les valorisations DCF) sont des résultats analytiques. Faites toujours vos propres recherches avant toute décision d'investissement.
:::

## Fonctionnement

Google exécute le script de la feuille de calcul sur ses propres serveurs, qui ne peuvent pas joindre `localhost`. Vous exposez votre instance via un tunnel qui lui donne une URL HTTPS publique, et la feuille de calcul appelle cette URL avec une clé que vous lui fournissez.

## Prérequis

- Une instance Fonrex en cours d'exécution ([Installation](../getting-started/installation.md))
- Un tunnel qui lui donne une URL HTTPS (zrok, Cloudflare Tunnel, Tailscale Funnel, ngrok…)
- Un compte Google

## Étape 1 — Créer une clé en lecture seule pour la feuille de calcul

La clé sera stockée dans votre compte Google, hors de la machine qui exécute Fonrex : donnez à la feuille de calcul une clé qui peut lire les données mais ne peut ni vider le cache, ni nettoyer la base de données, ni déclencher d'ingestion.

```bash
echo "frx_live_$(openssl rand -hex 24)"
```

Dans le `.env` de votre instance :

```
FONREX_READ_ONLY_API_KEYS=frx_live_<the generated value>
```

Redémarrez ensuite l'API : `docker compose up -d`.

## Étape 2 — Exposer votre instance via un tunnel

Exemple avec [zrok](https://zrok.io), une fois votre environnement activé (`zrok2 enable <token>`) :

```bash
# temporary URL, valid until you stop the command
zrok2 share public localhost:5000

# or a stable URL: reserve a name once, then share with it
zrok2 create name -n public myfonrex
zrok2 share public localhost:5000 -n public:myfonrex
# → https://myfonrex.share.zrok.io
```

Avec zrok 1.x, la commande est `zrok` au lieu de `zrok2`. Préférez une URL stable : avec une URL temporaire, vous reconfigurez la feuille de calcul à chaque redémarrage du tunnel. Vérifiez l'URL depuis un autre réseau :

```bash
curl https://myfonrex.share.zrok.io/health
```

:::warning
Tant que le tunnel tourne, votre instance est accessible depuis Internet. Seuls `/health`, la documentation de l'API, les fichiers de découverte OpenBB et les fichiers statiques répondent sans clé. Gardez `FONREX_AUTH_REQUIRED` activé, ne partagez jamais une clé à accès complet, et arrêtez le tunnel quand vous n'avez pas besoin de la feuille de calcul.
:::

## Étape 3 — Copier le modèle

👉 **[Ouvrir le modèle Fonrex Sheets](https://docs.google.com/spreadsheets/d/1PUBLISHED_TEMPLATE_ID_XYZ_1234567890/copy)**

Vous obtenez une copie personnelle dans votre Google Drive ; l'original n'est jamais modifié.

## Étape 4 — Connecter la feuille de calcul

1. Dans votre copie, ouvrez le menu **Fonrex** (à côté de « Help »).
2. **Configure Instance URL** → collez l'URL HTTPS de votre tunnel.
3. **Configure API Key** → collez la clé en lecture seule de l'étape 1.

L'URL et la clé sont stockées dans les *propriétés utilisateur* Apps Script de votre compte Google : jamais dans une cellule, et elles ne sont pas partagées quand vous partagez le document.

Ajoutez ensuite des tickers dans la colonne A de la feuille **Watchlist** (à partir de la ligne 2 : `AAPL`, `AIR.PA`, `MC.PA`…), ou avec **Fonrex > Add Ticker to Watchlist**, puis rafraîchissez :

- **Fonrex > Refresh Fundamentals** → feuille *Fundamentals*
- **Fonrex > Refresh DCF Valuations** → feuille *DCF*
- **Fonrex > Refresh Technical Indicators** → feuille *Technicals*

## Feuilles du modèle

| Feuille | Contenu |
|---|---|
| **Config** | État de la connexion, date du dernier rafraîchissement, avertissement légal |
| **Watchlist** | Tickers suivis (colonne A, à partir de la ligne 2) |
| **Fundamentals** | PER, ROE, ROA, capitalisation boursière, rendement du dividende, bêta, plus haut/plus bas sur 52 semaines… |
| **DCF** | Valeur de consensus, prix actuel, potentiel de hausse du consensus, WACC, valeur FCF |
| **Technicals** | RSI 14, MACD, SMA 50/200, EMA 20, bandes de Bollinger, ATR 14 |
| **Charts** | Graphiques natifs basés sur les données importées |

## Formules personnalisées

| Formule | Description |
|---|---|
| `=FONREX_PE("AIR.PA")` | Ratio cours/bénéfice (PER) |
| `=FONREX_DIVIDEND_YIELD("AIR.PA")` | Rendement du dividende (ratio) |
| `=FONREX_INTRINSIC_VALUE("AIR.PA")` | Valeur DCF de consensus |
| `=FONREX_RSI("AAPL")` | RSI sur 14 périodes |

Google met en cache les formules personnalisées pendant 30 minutes ; utilisez les entrées du menu **Refresh** pour obtenir des données à jour.

## Ce que le script appelle

Uniquement des requêtes `GET`, avec `Authorization: Bearer <key>`, vers votre instance : `/fundamental/deep`, `/dcf/{ticker}` et `/technical/{ticker}/multi` pour les rafraîchissements du menu, et `/fundamental` pour deux des formules. Le DCF a besoin des données fondamentales détaillées du ticker : rafraîchissez d'abord la feuille *Fundamentals*.

## Limites

| Limite | Détail |
|---|---|
| **Rafraîchissement manuel** | Pas de mise à jour en temps réel : Apps Script n'a pas de WebSocket |
| **Cache des formules** | 30 minutes, imposé par Google |
| **L'instance et le tunnel doivent tourner** | Un rafraîchissement échoue quand l'un des deux est arrêté |
| **Un appel par ticker et par route** | Un rafraîchissement fait interroger ses fournisseurs par votre instance pour chaque ticker |

## Dépannage

| Erreur | Cause probable | Solution |
|---|---|---|
| `Configure your instance URL first` | URL non configurée | Fonrex > Configure Instance URL |
| `Configure API key first` | Clé non configurée | Fonrex > Configure API Key |
| `API key refused by your instance` | Clé absente de `.env`, ou API non redémarrée | Vérifiez `FONREX_READ_ONLY_API_KEYS`, puis `docker compose up -d` |
| `Instance unreachable` | Tunnel arrêté ou URL modifiée | Redémarrez le tunnel, mettez à jour l'URL |
| `The tunnel answered instead of Fonrex` | Le tunnel tourne mais pas l'instance | `docker compose ps`, puis `docker compose up -d` |
| `Instance error or tunnel down (status 5xx)` | Erreur dans l'instance, ou tunnel sans backend | `docker compose logs fonrex-api` |
| `Ticker not found` | Symbole inconnu de l'API | Vérifiez le format (`AIR.PA`, pas `AIR`) |
| Menu « Fonrex » absent | Script non autorisé | Rechargez la page, acceptez les autorisations |

## Sécurité

- Le script n'appelle que l'URL que **vous** configurez, en HTTPS, avec des requêtes `GET`.
- Le manifeste (`appsscript.json`) demande l'accès à la feuille de calcul courante et aux requêtes externes ; il n'a pas de liste fixe de domaines, car l'URL de votre tunnel vous est propre.
- Avec une clé en lecture seule, une clé divulguée ne peut ni vider le cache, ni nettoyer la base de données, ni déclencher d'ingestion, ni modifier les abonnements.
