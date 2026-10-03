/**
 * Single source of truth for homepage content.
 * Every string goes through `translate()` so `npm run write-translations`
 * extracts it into i18n/<locale>/code.json.
 * Functions (not constants) are used so translations resolve at render time.
 */
import { translate } from '@docusaurus/Translate';
import {
  IconActivity,
  IconBarChart,
  IconCode,
  IconDatabase,
  IconLink,
  IconServer,
  IconShield,
  IconTrending,
  type IconComponent,
} from './Icons';

export type DocLink = { label: string; to: string };

export type ExploreArea = {
  id: string;
  Icon: IconComponent;
  title: string;
  description: string;
  links: DocLink[];
};

export type Pathway = {
  id: string;
  Icon: IconComponent;
  title: string;
  time: string;
  description: string;
  to: string;
};

export type ReleaseNote = {
  version: string;
  date: string;
  title: string;
  summary: string;
};

export function getQuickLinks(): DocLink[] {
  return [
    {
      label: translate({ id: 'homepage.quicklinks.docker', message: 'Install with Docker' }),
      to: '/docs/getting-started/docker-compose',
    },
    {
      label: translate({ id: 'homepage.quicklinks.firstCall', message: 'First API call' }),
      to: '/docs/getting-started/first-api-call',
    },
    {
      label: translate({ id: 'homepage.quicklinks.dcf', message: 'DCF valuation' }),
      to: '/docs/api-reference/valuation-dcf',
    },
    {
      label: translate({ id: 'homepage.quicklinks.websocket', message: 'WebSocket streaming' }),
      to: '/docs/api-reference/realtime',
    },
    {
      label: translate({ id: 'homepage.quicklinks.sheets', message: 'Google Sheets' }),
      to: '/docs/guides/google-sheets-connector',
    },
  ];
}

export function getExploreAreas(): ExploreArea[] {
  return [
    {
      id: 'rest',
      Icon: IconCode,
      title: translate({ id: 'homepage.explore.rest.title', message: 'REST API' }),
      description: translate({
        id: 'homepage.explore.rest.description',
        message: 'Query assets, OHLCV history and news through a FastAPI REST interface.',
      }),
      links: [
        { label: translate({ id: 'homepage.explore.rest.link.assets', message: 'Assets & search' }), to: '/docs/api-reference/assets' },
        { label: translate({ id: 'homepage.explore.rest.link.historical', message: 'Historical prices' }), to: '/docs/api-reference/historical' },
        { label: translate({ id: 'homepage.explore.rest.link.news', message: 'News' }), to: '/docs/api-reference/news' },
      ],
    },
    {
      id: 'realtime',
      Icon: IconActivity,
      title: translate({ id: 'homepage.explore.realtime.title', message: 'Real-time streaming' }),
      description: translate({
        id: 'homepage.explore.realtime.description',
        message: 'Stream live candles over WebSockets backed by Redis Pub/Sub.',
      }),
      links: [
        { label: translate({ id: 'homepage.explore.realtime.link.api', message: 'WebSocket API' }), to: '/docs/api-reference/realtime' },
        { label: translate({ id: 'homepage.explore.realtime.link.configure', message: 'Configure real-time' }), to: '/docs/guides/configure-realtime' },
        { label: translate({ id: 'homepage.explore.realtime.link.alerts', message: 'Alerts' }), to: '/docs/monitoring/alerts' },
      ],
    },
    {
      id: 'valuation',
      Icon: IconTrending,
      title: translate({ id: 'homepage.explore.valuation.title', message: 'Valuation & indicators' }),
      description: translate({
        id: 'homepage.explore.valuation.description',
        message: 'DCF intrinsic value, fundamentals and technical indicators computed server-side.',
      }),
      links: [
        { label: translate({ id: 'homepage.explore.valuation.link.dcf', message: 'DCF valuation' }), to: '/docs/api-reference/valuation-dcf' },
        { label: translate({ id: 'homepage.explore.valuation.link.indicators', message: 'Technical indicators' }), to: '/docs/api-reference/technical-indicators' },
        { label: translate({ id: 'homepage.explore.valuation.link.fundamentals', message: 'Fundamentals' }), to: '/docs/api-reference/fundamentals' },
      ],
    },
    {
      id: 'integrations',
      Icon: IconLink,
      title: translate({ id: 'homepage.explore.integrations.title', message: 'Integrations' }),
      description: translate({
        id: 'homepage.explore.integrations.description',
        message: 'Use Fonrex from Google Sheets, OpenBB Workspace or Zipline backtests.',
      }),
      links: [
        { label: translate({ id: 'homepage.explore.integrations.link.sheets', message: 'Google Sheets connector' }), to: '/docs/guides/google-sheets-connector' },
        { label: translate({ id: 'homepage.explore.integrations.link.openbb', message: 'OpenBB Workspace' }), to: '/docs/guides/openbb-workspace' },
        { label: translate({ id: 'homepage.explore.integrations.link.zipline', message: 'Zipline backtesting' }), to: '/docs/guides/backtesting-zipline' },
      ],
    },
    {
      id: 'providers',
      Icon: IconDatabase,
      title: translate({ id: 'homepage.explore.providers.title', message: 'Data providers' }),
      description: translate({
        id: 'homepage.explore.providers.description',
        message: 'Multi-provider fallbacks (SEC EDGAR, Yahoo Finance, FMP…) and custom adapters.',
      }),
      links: [
        { label: translate({ id: 'homepage.explore.providers.link.overview', message: 'Providers overview' }), to: '/docs/providers/overview' },
        { label: translate({ id: 'homepage.explore.providers.link.fundamentals', message: 'Fundamentals providers' }), to: '/docs/providers/fundamentals-providers' },
        { label: translate({ id: 'homepage.explore.providers.link.custom', message: 'Add a custom provider' }), to: '/docs/providers/adding-custom-provider' },
      ],
    },
    {
      id: 'ops',
      Icon: IconServer,
      title: translate({ id: 'homepage.explore.ops.title', message: 'Self-hosting & ops' }),
      description: translate({
        id: 'homepage.explore.ops.description',
        message: 'Deploy with Docker, configure environments and run in production.',
      }),
      links: [
        { label: translate({ id: 'homepage.explore.ops.link.docker', message: 'Docker deployment' }), to: '/docs/deployment/docker' },
        { label: translate({ id: 'homepage.explore.ops.link.env', message: 'Environment variables' }), to: '/docs/deployment/environment-variables' },
        { label: translate({ id: 'homepage.explore.ops.link.checklist', message: 'Production checklist' }), to: '/docs/deployment/production-checklist' },
      ],
    },
  ];
}

export function getQuickStartSteps(): DocLink[] {
  return [
    { label: translate({ id: 'homepage.quickstart.step.install', message: 'Install' }), to: '/docs/getting-started/installation' },
    { label: translate({ id: 'homepage.quickstart.step.configure', message: 'Configure' }), to: '/docs/getting-started/configuration' },
    { label: translate({ id: 'homepage.quickstart.step.firstCall', message: 'First call' }), to: '/docs/getting-started/first-api-call' },
  ];
}

/** Snippets mirror docs/getting-started/first-api-call.md — keep them in sync. */
export const CODE_SAMPLES = {
  curl: `# End-of-day OHLCV history for Airbus SE
curl -s "http://localhost:5000/eod/AIR.PA?period=1mo"`,
  python: `import requests

resp = requests.get(
    "http://localhost:5000/technical/AAPL",
    params={"indicator": "rsi", "period": 14},
)
latest = resp.json()["values"][-1]
print(f"AAPL RSI(14): {latest['value']:.2f}")`,
  websocket: `const ws = new WebSocket("ws://localhost:5000/ws/realtime/TSLA");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.type, message.data);
};`,
};

export function getPathways(): Pathway[] {
  return [
    {
      id: 'quant',
      Icon: IconTrending,
      title: translate({ id: 'homepage.pathways.quant.title', message: 'Quant & algo-trader' }),
      time: '10 min',
      description: translate({ id: 'homepage.pathways.quant.description', message: 'Time-series, indicators, backtesting.' }),
      to: '/docs/pathways/quant-trader',
    },
    {
      id: 'analyst',
      Icon: IconBarChart,
      title: translate({ id: 'homepage.pathways.analyst.title', message: 'Financial analyst' }),
      time: '5 min',
      description: translate({ id: 'homepage.pathways.analyst.description', message: 'DCF, fundamentals, Sheets & OpenBB.' }),
      to: '/docs/pathways/financial-analyst',
    },
    {
      id: 'developer',
      Icon: IconCode,
      title: translate({ id: 'homepage.pathways.developer.title', message: 'App developer' }),
      time: '10 min',
      description: translate({ id: 'homepage.pathways.developer.description', message: 'REST, WebSockets, fallbacks.' }),
      to: '/docs/pathways/app-developer',
    },
    {
      id: 'devops',
      Icon: IconShield,
      title: translate({ id: 'homepage.pathways.devops.title', message: 'DevOps & infra admin' }),
      time: '15 min',
      description: translate({ id: 'homepage.pathways.devops.description', message: 'Docker, TimescaleDB, monitoring.' }),
      to: '/docs/pathways/devops-admin',
    },
  ];
}

export const LLMS_FILES = [
  { file: '/llms.txt', label: 'llms.txt' },
  { file: '/llms-full.txt', label: 'llms-full.txt' },
  { file: '/llms-docs.txt', label: 'llms-docs.txt' },
  { file: '/llms-api.txt', label: 'llms-api.txt' },
];

/** Latest entries of docs/contributing/changelog.md — update on each release. */
export function getReleaseNotes(): ReleaseNote[] {
  return [
    {
      version: 'v1.6.0',
      date: '2026-09',
      title: translate({ id: 'homepage.news.v160.title', message: 'OpenBB Workspace integration' }),
      summary: translate({
        id: 'homepage.news.v160.summary',
        message: '19 widgets, 2 ready-made dashboards and X-API-KEY header authentication.',
      }),
    },
    {
      version: 'v2.0.0',
      date: '2026-08',
      title: translate({ id: 'homepage.news.v200.title', message: 'Provider health monitoring' }),
      summary: translate({
        id: 'homepage.news.v200.summary',
        message: 'Validation layer, Canary monitor and 7 /health endpoints.',
      }),
    },
    {
      version: 'v2.0.0',
      date: '2026-08',
      title: translate({ id: 'homepage.news.v200dcf.title', message: 'DCF valuation engine' }),
      summary: translate({
        id: 'homepage.news.v200dcf.summary',
        message: 'FCF, EPS and DDM models with dynamic WACC and sensitivity matrices.',
      }),
    },
  ];
}
