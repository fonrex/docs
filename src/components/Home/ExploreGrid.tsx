import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import { getExploreAreas } from './data';
import { IconArrowRight } from './Icons';
import styles from './styles.module.css';

export default function ExploreGrid(): ReactNode {
  return (
    <section className={styles.section} aria-labelledby="explore-heading">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 id="explore-heading" className={styles.sectionTitle}>
            <Translate id="homepage.explore.title">Explore Fonrex</Translate>
          </h2>
          <p className={styles.sectionLead}>
            <Translate id="homepage.explore.lead">Jump straight to the area you are working on.</Translate>
          </p>
        </div>

        <div className={styles.exploreGrid}>
          {getExploreAreas().map(({ id, Icon, title, description, links }) => (
            <article key={id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.iconBadge}>
                  <Icon />
                </span>
                <h3 className={styles.cardTitle}>
                  <Link to={links[0].to} className={styles.cardTitleLink}>
                    {title}
                  </Link>
                </h3>
              </div>
              <p className={styles.cardText}>{description}</p>
              <ul className={styles.linkList}>
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={styles.deepLink}>
                      <IconArrowRight className={styles.deepLinkIcon} />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
