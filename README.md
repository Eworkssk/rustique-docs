# rustique docs

Landing page and documentation site for [rustique](https://github.com/Eworkssk/rustique), an Eloquent-style ORM for Rust.

Built with [Astro](https://astro.build) as a fully static site. No UI framework; interactive bits are small vanilla scripts. Search is [Pagefind](https://pagefind.app), built from the generated pages.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321, search is unavailable in dev
npm run build      # astro build + pagefind index into dist/
npm run preview    # serve dist/
```

## Content

Doc pages live in `src/content/docs/*.md` and are generated from the markdown in the main repo (`rustique/rustique/docs`). Do not edit them by hand; change the source and re-sync:

```bash
npm run sync-docs                     # expects ../rustique next to this repo
node scripts/sync-docs.mjs /path/to/rustique/rustique/docs
```

The script strips the H1 (the title comes from frontmatter), rewrites relative links to `/docs/<slug>/`, drops rustdoc hidden `# ` lines from Rust blocks, and writes the sidebar metadata (`group`, `order`, `title`, `description`) from the table embedded in it. Add new pages there.

## Layout

- `src/pages/index.astro` landing page, data in `src/data/landing.ts`
- `src/pages/docs/[slug].astro` and `src/layouts/DocPage.astro` docs pages, sidebar tree in `src/data/docs.ts`
- `src/styles/` design tokens and shared classes; `shiki-rustique.json` is the code theme
- `design/` the original design artboards the site was built from
- `public/` favicon and logo

After changing the Shiki theme or `astro.config.mjs`, delete `.astro/` and `node_modules/.astro/` before rebuilding, or cached highlighting stays.
