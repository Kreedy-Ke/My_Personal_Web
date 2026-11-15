export const ARTICLE_SECTION_IDS = ["writing", "essays"] as const;

export type ArticleSection = (typeof ARTICLE_SECTION_IDS)[number];

export const articleSections = {
    writing: {
        label: "Writing",
        title: "小说与诗",
        href: "/writing/",
        description: "虚构小小说、现代诗与语言实验。",
        updateType: "创作",
    },
    essays: {
        label: "Essays",
        title: "随笔与时评",
        href: "/essays/",
        description: "生活随笔、时评文稿与公共议题。",
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
