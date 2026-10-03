import React, { useState, type FormEvent, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useHistory } from '@docusaurus/router';
import { getQuickLinks } from './data';
import { IconSearch } from './Icons';
import styles from './styles.module.css';

export default function Hero(): ReactNode {
  const history = useHistory();
  const searchPage = useBaseUrl('/search');
  const [query, setQuery] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    history.push(q ? `${searchPage}?q=${encodeURIComponent(q)}` : searchPage);
  };

  return (
    <header className={styles.hero}>
      <div className={styles.container}>
        <span className={styles.eyebrow}>
          <Translate id="homepage.hero.eyebrow">Documentation</Translate>
        </span>
        <h1 className={styles.heroTitle}>
          <Translate id="homepage.hero.title">Fonrex Documentation</Translate>
        </h1>
        <p className={styles.heroSubtitle}>
          <Translate id="homepage.hero.subtitle">
            Everything you need to self-host, query and extend Fonrex — the open-source financial data API.
          </Translate>
        </p>

        <form className={styles.searchForm} role="search" onSubmit={onSubmit}>
          <IconSearch className={styles.searchIcon} />
          <input
            id="homepage-search-input"
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={translate({
              id: 'homepage.hero.search.placeholder',
              message: 'Search guides, endpoints, providers…',
            })}
            aria-label={translate({ id: 'homepage.hero.search.label', message: 'Search the documentation' })}
          />
          <button id="homepage-search-submit" className={styles.searchButton} type="submit">
            <Translate id="homepage.hero.search.button">Search</Translate>
          </button>
        </form>

        <nav
          className={styles.chips}
          aria-label={translate({ id: 'homepage.hero.quicklinks.label', message: 'Popular pages' })}>
          {getQuickLinks().map((link) => (
            <Link key={link.to} to={link.to} className={styles.chip}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
