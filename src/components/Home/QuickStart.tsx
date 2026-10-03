import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';
import { CODE_SAMPLES, getQuickStartSteps } from './data';
import styles from './styles.module.css';

export default function QuickStart(): ReactNode {
  return (
    <section className={styles.section} aria-labelledby="quickstart-heading">
      <div className={`${styles.container} ${styles.quickStart}`}>
        <div>
          <h2 id="quickstart-heading" className={styles.sectionTitle}>
            <Translate id="homepage.quickstart.title">Get started in 3 steps</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="homepage.quickstart.lead">
              Run the stack with Docker Compose, set your provider keys, then make your first request.
            </Translate>
          </p>
          <ol className={styles.steps}>
            {getQuickStartSteps().map((step, index) => (
              <li key={step.to} className={styles.step}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <Link to={step.to} className={styles.stepLink}>
                  {step.label}
                </Link>
              </li>
            ))}
          </ol>
          <Link className="button button--primary" to="/docs/getting-started/installation">
            <Translate id="homepage.quickstart.cta">Start the quickstart</Translate>
          </Link>
        </div>

        <div className={styles.codePanel}>
          <Tabs groupId="fonrex-code-language" queryString={false}>
            <TabItem value="curl" label="cURL" default>
              <CodeBlock language="bash">{CODE_SAMPLES.curl}</CodeBlock>
            </TabItem>
            <TabItem value="python" label="Python">
              <CodeBlock language="python">{CODE_SAMPLES.python}</CodeBlock>
            </TabItem>
            <TabItem value="websocket" label="WebSocket">
              <CodeBlock language="javascript">{CODE_SAMPLES.websocket}</CodeBlock>
            </TabItem>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
