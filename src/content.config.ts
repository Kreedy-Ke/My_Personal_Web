import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { ARTICLE_SECTION_IDS } from "./lib/article-sections";

const articles = defineCollection({
    loader: glob({ base: "./src/content/articles", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
        title: z.string().trim().min(1).optional(),
        date: z.coerce.date(),
        writtenDate: z.coerce.date().optional(),
        summary: z.string().trim().min(1).optional(),
        section: z.enum(ARTICLE_SECTION_IDS).default("writing"),
        tags: z.array(z.string().trim().min(1)).default([]),
        draft: z.boolean().default(false),
    }),
});

export const collections = {
    articles,
};
