import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { IconBook, IconGitBranch, IconMessage } from './Icons';
import styles from './styles.module.css';

export default function HelpBanner(): ReactNode {
  return (
    <section className={styles.section} aria-labelledby="help-heading">
      <div className={`${styles.container} ${styles.help}`}>
        <div>
          <h2 id="help-heading" className={styles.panelTitle}>
            <Translate id="homepage.help.title">Need help?</Translate>
          </h2>
          <p className={styles.cardText}>
            <Translate id="homepage.help.description">
              Fonrex is open source (AGPL-3.0). Report a bug, ask a question or improve these docs.
            </Translate>
          </p>
        </div>
        <div className={styles.helpActions}>
          <Link className={styles.helpLink} href="https://github.com/fonrex/fonrex/issues">
            <IconMessage className={styles.inlineIcon} />
            <Translate id="homepage.help.issues">Open an issue</Translate>
          </Link>
          <Link className={styles.helpLink} to="/docs/contributing/setup">
            <IconBook className={styles.inlineIcon} />
            <Translate id="homepage.help.contributing">Contributing guide</Translate>
          </Link>
          <Link className={styles.helpLink} href="https://github.com/fonrex/fonrex">
            <IconGitBranch className={styles.inlineIcon} />
            <Translate id="homepage.help.github">Source on GitHub</Translate>
          </Link>
        </div>
      </div>
    </section>
  );
}
