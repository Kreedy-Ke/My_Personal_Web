import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const articles = defineCollection({
    loader: glob({ base: "./src/content/articles", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
        title: z.string().trim().min(1).optional(),
        date: z.coerce.date(),
        writtenDate: z.coerce.date().optional(),
        summary: z.string().trim().min(1).optional(),
        tags: z.array(z.string().trim().min(1)).default([]),
        draft: z.boolean().default(false),
    }),
});

const reviews = defineCollection({
    loader: glob({ base: "./src/content/reviews", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        workTitle: z.string(),
        originalTitle: z.string().optional(),
        creator: z.string().optional(),
        category: z.enum(["book", "movie", "anime", "game", "music", "art", "other"]),
        year: z.number().optional(),
        rating: z.number().min(0).max(10).optional(),
        status: z.enum(["planned", "watching", "reading", "playing", "finished", "paused", "dropped"]),
        cover: z.string().optional(),
        summary: z.string(),
        externalUrl: z.string().url().optional(),
        externalId: z.string().optional(),
        draft: z.boolean().default(false),
    }),
});

const galleries = defineCollection({
    loader: glob({ base: "./src/content/galleries", pattern: "**/*.{md,mdx}" }),
    schema: z.object({
        image: z.string().trim().startsWith("/images/gallery/"),
        date: z.coerce.date(),
        summary: z.string().trim().min(1),
        alt: z.string().trim().optional(),
        draft: z.boolean().default(false),
    }),
});

export const collections = {
    articles,
    reviews,
    galleries,
};
