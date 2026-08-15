<p align="center">
  <img src="https://avatars.githubusercontent.com/u/305430843?s=400&v=4" width="120" alt="Fonrex Logo" />
</p>

# Fonrex Documentation

[![Docusaurus](https://img.shields.io/badge/Docusaurus-v3.10-blue?logo=docusaurus)](https://docusaurus.io/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0-brightgreen?logo=node.js)](https://nodejs.org/)
[![i18n](https://img.shields.io/badge/i18n-EN%20%7C%20FR%20%7C%20ZH--Hans-orange)](#internationalization-i18n)

> Official documentation portal for **Fonrex** — Open-source financial data infrastructure.

This repository contains the source code, markdown docs, assets, and translation files for the official [Fonrex Documentation](https://docs.fonrex.io), built with [Docusaurus 3](https://docusaurus.io/).

---

## Quick Start

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` (comes with Node.js) or `yarn` / `pnpm`

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/fonrex/fonrex.git
   cd docs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`. Most changes will reflect live in your browser without restarting the server.

### Production Build

To generate static assets and HTML files for production:

```bash
npm run build
```

To preview the built production site locally:

```bash
npm run serve
```

---

## Repository Structure

```text
.
├── docs/                  # Core documentation markdown & MDX files
│   ├── api-reference/     # API endpoints and schemas
│   ├── architecture/      # System architecture & core concepts
│   └── getting-started/   # Installation and quickstart guides
├── i18n/                  # Localizations (Translations)
│   ├── fr/                # French translations
│   └── zh-Hans/           # Simplified Chinese translations
├── src/                   # Custom pages, components, and styles
│   ├── css/               # Global & custom CSS styles
│   └── pages/             # Non-doc React pages (e.g., Landing page)
├── static/                # Static assets (images, logos, llms.txt, llms-full.txt)
├── docusaurus.config.ts   # Main Docusaurus configuration
├── sidebars.ts            # Sidebar navigation tree configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Node dependencies & CLI scripts
```

---

##  Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm start` | Runs the app in development mode at `http://localhost:3000`. |
| `npm run build` | Bundles static HTML and assets into the `build/` directory. |
| `npm run serve` | Serves the production build locally for testing. |
| `npm run typecheck` | Runs TypeScript type checker across the codebase. |
| `npm run clear` | Clears Docusaurus cache (`.docusaurus/` & `build/`). |
| `npm run write-translations` | Extracts translatable strings into `i18n/`. |

---

## 🌐 Internationalization (i18n)

Fonrex documentation supports multiple languages out of the box:

- 🇬🇧 **English** (`en`) — Default / Source locale
- 🇫🇷 **French** (`fr`) — `i18n/fr/`
- 🇨🇳 **Simplified Chinese** (`zh-Hans`) — `i18n/zh-Hans/`

To start the local development server in a specific language:

```bash
# Start in French
npm start -- --locale fr

# Start in Simplified Chinese
npm start -- --locale zh-Hans
```

---

## Contributing

We welcome contributions to improve the Fonrex documentation!

1. Fork the repository and create your feature branch: `git checkout -b doc/my-update`
2. Make your documentation updates in `docs/` (or update translations in `i18n/`).
3. Ensure there are no broken links and type checking passes:
   ```bash
   npm run typecheck
   npm run build
   ```
4. Commit your changes and open a Pull Request.

---

## License

This documentation repository is licensed under the [AGPL-3.0 License](LICENSE).
Copyright © 2026 Fonrex.
