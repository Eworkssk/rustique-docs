import { getCollection, type CollectionEntry } from 'astro:content';

export const GITHUB = 'https://github.com/Eworkssk/rustique';
export const EDIT_BASE = GITHUB + '/blob/main/rustique/docs/';

export const groups = [
  { id: 'start', color: '#FFC53D' },
  { id: 'query', color: '#8DA2FF' },
  { id: 'models', color: '#FF7448' },
  { id: 'schema', color: '#38D39F' },
] as const;

export const groupColor = Object.fromEntries(groups.map((g) => [g.id, g.color])) as Record<string, string>;

export type Doc = CollectionEntry<'docs'>;

// All pages in sidebar order: by group, then by `order` within the group.
export async function orderedDocs(): Promise<Doc[]> {
  const all = await getCollection('docs');
  const rank = (d: Doc) => groups.findIndex((g) => g.id === d.data.group);
  return all.sort((a, b) => rank(a) - rank(b) || a.data.order - b.data.order);
}
