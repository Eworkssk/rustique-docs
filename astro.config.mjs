// @ts-check
import { defineConfig } from 'astro/config';
import theme from './src/styles/shiki-rustique.json' with { type: 'json' };

const el = (tagName, className, children = [], props = {}) => ({
  type: 'element',
  tagName,
  properties: { className, ...props },
  children,
});
const text = (value) => ({ type: 'text', value });

// Wraps every highlighted block in the design's dark code card: a header row with
// the language label and a Copy button (wired up by a script on the docs pages).
// The design colours a few names that TextMate scopes cannot tell apart: Rel/Vec and
// relation-path strings (with("posts")) in green, Option/Some/None in yellow.
const GREEN = new Set(['Rel', 'Vec']);
const YELLOW = new Set(['Option', 'Some', 'None']);
const RELATION_CALL = /\b(with|with_where|with_count|load|load_count|has|where_has|doesnt_have|where_doesnt_have)\((&\w+, )?$/;

const codeCard = {
  name: 'rustique-code-card',
  tokens(lines) {
    if (this.options.lang !== 'rust') return;
    for (const line of lines) {
      let before = '';
      for (const tok of line) {
        const word = tok.content.trim();
        let color;
        if (GREEN.has(word)) color = '#38D39F';
        else if (YELLOW.has(word)) color = '#FFC53D';
        else if (/^".*"$/.test(word) && RELATION_CALL.test(before)) color = '#38D39F';
        if (color) {
          tok.color = color;
          if (tok.htmlStyle) tok.htmlStyle.color = color;
        }
        before += tok.content;
      }
    }
  },
  pre(node) {
    node.properties.class = 'scrollx';
    delete node.properties.style;
  },
  root(root) {
    const lang = this.options.lang === 'plaintext' ? 'text' : this.options.lang;
    const head = el('div', ['code-head'], [
      el('span', [], [text(lang)]),
      el('button', ['copy'], [text('Copy')], { type: 'button', ariaLabel: 'Copy code' }),
    ]);
    root.children = [el('div', ['code', 'mono'], [head, ...root.children])];
  },
};

// Wraps markdown tables in a horizontal scroller, as the design does.
function rehypeScrollTables() {
  const walk = (node) => {
    node.children?.forEach((child, i) => {
      if (child.tagName === 'table') node.children[i] = el('div', ['scrollx', 'tbl'], [child]);
      else walk(child);
    });
  };
  return walk;
}

export default defineConfig({
  site: 'https://rustique.dev',
  output: 'static',
  markdown: {
    shikiConfig: { theme, transformers: [codeCard] },
    rehypePlugins: [rehypeScrollTables],
  },
});
