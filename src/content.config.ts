import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    kicker: z.string().optional(),
    title: z.string().optional(),
    lead: z.string().optional(),
  }),
});

export const collections = { pages };
