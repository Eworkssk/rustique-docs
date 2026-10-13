// Usage: node scripts/sync-docs.mjs [path-to-rustique-docs-dir]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(process.argv[2] ?? resolve(root, '../rustique/rustique/docs'));
const outDir = resolve(root, 'src/content/docs');
const GH = 'https://github.com/Eworkssk/rustique/blob/main/';
const GH_DIR = 'rustique/docs/'; // docs dir relative to repo root

// [slug, source, group, order, title, description]
const MAP = [
  ['getting-started', 'getting-started.md', 'start', 1, 'Getting started', 'Install, features, connecting, pool and TLS'],
  ['cheat-sheet', 'README.md', 'start', 2, 'Cheat sheet', 'Every everyday call on one page'],
  ['eloquent-compatibility', 'eloquent-compatibility.md', 'start', 3, 'Eloquent compatibility', 'What maps to Laravel, what does not'],
  ['dialects', 'dialects.md', 'start', 4, 'Database differences', 'What changes between MySQL and Oracle'],
  ['query-builder', 'query-builder.md', 'query', 1, 'Query builder', 'Selects, wheres, joins, aggregates, writes'],
  ['large-results', 'large-results.md', 'query', 2, 'Pagination, chunking and cursors', 'Working with big tables'],
  ['database', 'database.md', 'query', 3, 'Transactions and raw SQL', 'Replicas, nested transactions, retries, logging'],
  ['models', 'models.md', 'models', 1, 'Models', 'Retrieving, saving, timestamps, soft deletes, dirty tracking'],
  ['relationships', 'relationships.md', 'models', 2, 'Relationships', 'All relation kinds, eager loading, pivots'],
  ['casts', 'casts.md', 'models', 3, 'Casts', 'Cast, FromValue, custom types'],
  ['events', 'events.md', 'models', 4, 'Scopes, hooks and observers', 'Reusable filters and lifecycle events'],
  ['migrations', 'migrations.md', 'schema', 1, 'Schema and migrations', 'Schema builder, Migrator, CLI'],
  ['factories', 'factories.md', 'schema', 2, 'Factories', 'Test data and seeding'],
];
const slugOf = Object.fromEntries(MAP.map((m) => [m[1], m[0]]));

function rewriteLinks(line) {
  return line.replace(/\]\(([^)\s]+)\)/g, (all, href) => {
    if (/^(https?:|mailto:|#|\/)/.test(href)) return all;
    const [path, hash] = href.split('#');
    const file = path.replace(/^\.\//, '');
    if (slugOf[file]) return `](/docs/${slugOf[file]}/${hash ? '#' + hash : ''})`;
    // anything else: resolve relative to the docs dir and point at GitHub
    const parts = (GH_DIR + path).split('/');
    const out = [];
    for (const p of parts) p === '..' ? out.pop() : p !== '.' && out.push(p);
    return `](${GH}${out.join('/')}${hash ? '#' + hash : ''})`;
  });
}

function transform(text, source) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inFence = false, fenceRust = false, h1Done = false, prevLevel = 1;
  for (let line of lines) {
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        const lang = fence[1].trim().split(',')[0];
        fenceRust = lang === '' || lang === 'rust';
        line = '```' + (lang || 'rust');
      } else inFence = false;
      out.push(line);
      continue;
    }
    if (inFence) {
      // rustdoc hidden lines ("# use ...") are doc-test scaffolding, not for display
      if (fenceRust && /^#( |$)/.test(line)) continue;
      out.push(line);
      continue;
    }
    if (!h1Done && /^# /.test(line)) { h1Done = true; continue; }
    const h = line.match(/^(#{2,6}) /);
    if (h) {
      if (h[1].length > prevLevel + 1) console.warn(`${source}: skipped heading level at "${line}"`);
      prevLevel = h[1].length;
    }
    line = rewriteLinks(line);
    line = line.replace(/^(?:> )?(?:\*\*Note:?\*\*:?|Note:)\s*/, '> **Note** ');
    out.push(line);
  }
  return out.join('\n').replace(/^\n+/, '').replace(/\n+$/, '\n');
}

mkdirSync(outDir, { recursive: true });
for (const [slug, source, group, order, title, description] of MAP) {
  let body = transform(readFileSync(resolve(srcDir, source), 'utf8'), source);
  // README: drop the table of links to the other docs pages; the sidebar replaces it
  if (source === 'README.md') body = body.replace(/^\| Page \|[\s\S]*?\n(?=\n|$)/m, '').replace(/\n{3,}/g, '\n\n');
  const fm = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\ngroup: ${group}\norder: ${order}\nsource: ${source}\n---\n\n`;
  writeFileSync(resolve(outDir, `${slug}.md`), fm + body);
  console.log(`${slug}.md`);
}
