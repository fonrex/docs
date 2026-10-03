import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { getPathways } from './data';
import { IconClock } from './Icons';
import styles from './styles.module.css';

export default function Pathways(): ReactNode {
  return (
    <section className={styles.section} aria-labelledby="pathways-heading">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 id="pathways-heading" className={styles.sectionTitle}>
            <Translate id="homepage.pathways.title">Pick your path</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="homepage.pathways.lead">Guided onboarding tailored to your role.</Translate>
          </p>
        </div>

        <div className={styles.pathwayGrid}>
          {getPathways().map(({ id, Icon, title, time, description, to }) => (
            <Link key={id} to={to} className={styles.pathway}>
              <span className={styles.iconBadge}>
                <Icon />
              </span>
              <span className={styles.pathwayBody}>
                <span className={styles.pathwayTitle}>{title}</span>
                <span className={styles.pathwayText}>{description}</span>
              </span>
              <span className={styles.pathwayTime}>
                <IconClock className={styles.inlineIcon} />
                {time}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
