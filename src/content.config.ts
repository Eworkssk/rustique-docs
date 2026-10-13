import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    group: z.enum(['start', 'query', 'models', 'schema']),
    order: z.number(),
    // Original file name in rustique/docs, used for the "Edit this page" link.
    source: z.string().optional(),
  }),
});

export const collections = { docs };
