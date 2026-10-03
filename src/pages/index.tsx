import React, { type ReactNode } from 'react';
import Layout from '@theme/Layout';
import { translate } from '@docusaurus/Translate';
import Hero from '../components/Home/Hero';
import ExploreGrid from '../components/Home/ExploreGrid';
import QuickStart from '../components/Home/QuickStart';
import Pathways from '../components/Home/Pathways';
import AiAndNews from '../components/Home/AiAndNews';
import HelpBanner from '../components/Home/HelpBanner';

/**
 * Docs-hub homepage, inspired by the Docusaurus showcase
 * (Astronomer, ConfigCat, Hasura, Ionic): search first, then task-oriented entry points.
 * Content lives in src/components/Home/data.ts.
 */
export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({ id: 'homepage.meta.title', message: 'Documentation' })}
      description={translate({
        id: 'homepage.description',
        message: 'Self-hosted open-source financial data infrastructure API',
      })}>
      <Hero />
      <main>
        <ExploreGrid />
        <QuickStart />
        <Pathways />
        <AiAndNews />
        <HelpBanner />
      </main>
    </Layout>
  );
}
