import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/first-api-call',
        'getting-started/docker-compose',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/assets',
        'api-reference/fundamentals',
        'api-reference/historical',
        'api-reference/realtime',
        'api-reference/technical-indicators',
        'api-reference/valuation-dcf',
        'api-reference/news',
        'api-reference/monitoring',
        'api-reference/specialized',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/import-assets',
        'guides/ingest-historical-data',
        'guides/configure-realtime',
        'guides/backtesting-zipline',
        'guides/adding-providers',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/hexagonal',
        'architecture/data-model',
        'architecture/migrations',
        'architecture/concurrency',
      ],
    },
    {
      type: 'category',
      label: 'Providers',
      items: [
        'providers/overview',
        'providers/fundamentals-providers',
        'providers/news-providers',
        'providers/adding-custom-provider',
      ],
    },
    {
      type: 'category',
      label: 'Monitoring',
      items: [
        'monitoring/validation-layer',
        'monitoring/canary-monitor',
        'monitoring/alerts',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/docker',
        'deployment/environment-variables',
        'deployment/database-migrations',
        'deployment/production-checklist',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'contributing/setup',
        'contributing/testing',
        'contributing/architecture-rules',
        'contributing/changelog',
      ],
    },
  ],
};

export default sidebars;
