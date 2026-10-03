import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { LLMS_FILES, getReleaseNotes } from './data';
import { IconArrowRight, IconFileText, IconSparkles } from './Icons';
import styles from './styles.module.css';

function LlmsFileLink({ file, label }: { file: string; label: string }): ReactNode {
  const href = useBaseUrl(file);
  return (
    <a href={href} className={styles.fileLink} target="_blank" rel="noopener noreferrer">
      <IconFileText className={styles.inlineIcon} />
      {label}
    </a>
  );
}

export default function AiAndNews(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={`${styles.container} ${styles.twoCols}`}>
        <article className={styles.panel} aria-labelledby="ai-heading">
          <h2 id="ai-heading" className={styles.panelTitle}>
            <IconSparkles className={styles.panelIcon} />
            <Translate id="homepage.ai.title">Use these docs with AI</Translate>
          </h2>
          <p className={styles.cardText}>
            <Translate id="homepage.ai.description">
              Feed the whole documentation to your LLM or coding assistant using the llms.txt standard.
            </Translate>
          </p>
          <div className={styles.fileGrid}>
            {LLMS_FILES.map((f) => (
              <LlmsFileLink key={f.file} {...f} />
            ))}
          </div>
        </article>

        <article className={styles.panel} aria-labelledby="news-heading">
          <h2 id="news-heading" className={styles.panelTitle}>
            <Translate id="homepage.news.title">What's new</Translate>
          </h2>
          <ul className={styles.newsList}>
            {getReleaseNotes().map((note) => (
              <li key={`${note.version}-${note.title}`} className={styles.newsItem}>
                <div className={styles.newsMeta}>
                  <span className={styles.versionTag}>{note.version}</span>
                  <time>{note.date}</time>
                </div>
                <span className={styles.newsTitle}>{note.title}</span>
                <span className={styles.newsSummary}>{note.summary}</span>
              </li>
            ))}
          </ul>
          <Link to="/docs/contributing/changelog" className={styles.deepLink}>
            <IconArrowRight className={styles.deepLinkIcon} />
            <Translate id="homepage.news.all">Full changelog</Translate>
          </Link>
        </article>
      </div>
    </section>
  );
}
