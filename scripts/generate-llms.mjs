#!/usr/bin/env node
/**
 * Regenerate the LLM-friendly files of static/ from the English pages of docs/.
 *
 *   static/llms.txt       index: every page of the sidebar, with its description
 *   static/llms-full.txt  every page
 *   static/llms-docs.txt  every page except the API reference
 *   static/llms-api.txt   the API reference
 *
 * Run it after editing docs/: `npm run llms`. The files are written from the
 * pages as they are, so they never describe pages that no longer exist.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://fonrex.io';

// The sidebar is the order a reader follows; read the ids it lists.
const sidebar = readFileSync(join(ROOT, 'sidebars.ts'), 'utf8');
const categories = [];
let current = { label: 'Introduction', ids: [] };
for (const line of sidebar.split('\n')) {
  const label = line.match(/label:\s*'([^']+)'/);
  if (label) {
    categories.push(current);
    current = { label: label[1], ids: [] };
    continue;
  }
  const id = line.match(/^\s*'([a-z0-9-]+(?:\/[a-z0-9-]+)?)',?\s*$/);
  if (id) current.ids.push(id[1]);
}
categories.push(current);

function frontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  const fields = {};
  if (match) {
    for (const line of match[1].split('\n')) {
      const field = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
      if (field) fields[field[1]] = field[2];
    }
  }
  return fields;
}

const pages = categories.flatMap((category) =>
  category.ids.map((id) => {
    const source = readFileSync(join(ROOT, 'docs', `${id}.md`), 'utf8');
    return { ...frontMatter(source), id, category: category.label, source };
  }),
);

function dump(title, selected) {
  const parts = selected.map((page) => `<!-- FILE: /docs/${page.id}.md -->\n\n${page.source.trim()}\n`);
  return `# Fonrex Documentation - ${title}\n\n> Concatenated English documentation for LLMs\n\n---\n\n${parts.join('\n\n\n')}`;
}

const isApi = (page) => page.id.startsWith('api-reference/');
writeFileSync(join(ROOT, 'static/llms-full.txt'), dump('Full Content Dump', pages));
writeFileSync(join(ROOT, 'static/llms-docs.txt'), dump('Docs Content Dump', pages.filter((p) => !isApi(p))));
writeFileSync(join(ROOT, 'static/llms-api.txt'), dump('API Content Dump', pages.filter(isApi)));

const index = [
  '# Fonrex Documentation',
  '',
  '> Fonrex is an open-source, self-hosted financial data API (FastAPI, PostgreSQL/TimescaleDB, Redis):',
  '> end-of-day prices per listing, real-time quotes, fundamentals with their sources, technical indicators,',
  '> news, DCF valuations and provider health monitoring. Every client talks to its own instance; an API key',
  '> is required by default.',
  '',
];
for (const category of categories) {
  const selected = pages.filter((page) => page.category === category.label);
  if (!selected.length) continue;
  index.push(`## ${category.label}`, '');
  for (const page of selected) {
    index.push(`- [${page.title}](${SITE}/docs/${page.id}): ${page.description}`);
  }
  index.push('');
}
index.push(
  '## Complete documentation',
  '',
  `- [llms-full.txt](${SITE}/llms-full.txt): every page`,
  `- [llms-docs.txt](${SITE}/llms-docs.txt): guides, architecture, operations`,
  `- [llms-api.txt](${SITE}/llms-api.txt): API reference`,
  '',
);
writeFileSync(join(ROOT, 'static/llms.txt'), index.join('\n'));

console.log(`llms files written from ${pages.length} pages`);
