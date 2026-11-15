export const ARTICLE_SECTION_IDS = ["writing", "essays"] as const;

export type ArticleSection = (typeof ARTICLE_SECTION_IDS)[number];

export const articleSections = {
    writing: {
        label: "Writing",
        title: "小说与诗",
        href: "/writing/",
        description: "虚构作品和大概称得上诗的东西",
        updateType: "创作",
    },
    essays: {
        label: "Essays",
        title: "随笔一写",
        href: "/essays/",
        description: "想写并且确实写下来的东西",
        updateType: "随笔",
    },
} as const satisfies Record<
    ArticleSection,
    {
        label: string;
        title: string;
        href: string;
        description: string;
        updateType: string;
    }
>;
