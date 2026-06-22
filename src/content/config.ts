import { z, defineCollection } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    kicker: z.string().optional(),
    title: z.string().optional(),
    lead: z.string().optional(),
  }),
});

export const collections = { pages };
