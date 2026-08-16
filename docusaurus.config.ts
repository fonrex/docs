import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Fonrex',
  tagline: 'Open-source financial data infrastructure',
  favicon: 'img/favicon.ico',
  url: 'https://docs.fonrex.io',
  baseUrl: '/',
  organizationName: 'fonrex',
  projectName: 'fonrex',
  onBrokenLinks: 'throw',
  markdown: {
    format: 'detect',
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'zh-Hans'],
    localeConfigs: {
      en: {
        label: 'English',
      },
      fr: {
        label: 'Français',
      },
      'zh-Hans': {
        label: '简体中文',
      },
    },
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/fonrex/docs/tree/main/',
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/fonrex-social.png',
    navbar: {
      title: 'Fonrex',
      logo: {
        alt: 'Fonrex Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://fonrex.io',
          label: 'fonrex.io',
          position: 'right',
        },
        {
          href: 'https://github.com/fonrex/fonrex',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started/installation' },
            { label: 'API Reference', to: '/docs/api-reference/assets' },
            { label: 'Contributing', to: '/docs/contributing/setup' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/fonrex/fonrex' },
            { label: 'Issues', href: 'https://github.com/fonrex/fonrex/issues' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'fonrex.io', href: 'https://fonrex.io' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fonrex. Licensed under AGPL-3.0.`,
    },
    prism: {
      additionalLanguages: ['python', 'bash', 'sql', 'json'],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'fonrex',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
