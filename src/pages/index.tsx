import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';

export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} Documentation`}
      description={translate({
        id: 'homepage.description',
        message: 'Self-hosted open-source financial data infrastructure API',
      })}>
      <main style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <img
          src="/img/logo.png"
          alt="Fonrex Logo"
          style={{ width: '120px', height: '120px', borderRadius: '24px', marginBottom: '1rem' }}
        />
        <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ifm-color-primary)' }}>
          {siteConfig.title}
        </h1>
        <p style={{ fontSize: '1.4rem', opacity: 0.85, margin: '1.5rem 0' }}>
          <Translate id="homepage.tagline">
            Open-source financial data infrastructure
          </Translate>
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            <Translate id="homepage.button.getStarted">Get Started</Translate>
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/api-reference/assets">
            <Translate id="homepage.button.apiReference">API Reference</Translate>
          </Link>
        </div>
      </main>
    </Layout>
  );
}
