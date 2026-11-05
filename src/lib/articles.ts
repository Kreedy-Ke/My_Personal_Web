import type { CollectionEntry } from "astro:content";

type ArticleEntry = CollectionEntry<"articles">;

export type ArticleMeta = {
    title: string;
    summary: string;
    tags: string[];
    publishedAt: Date;
    writtenAt: Date;
    titleFromBody: boolean;
    summaryFromBody: boolean;
};

const stripMarkdown = (value: string) => {
    return value
        .replace(/!\[[^\]]*]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/[`*_~]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

const truncate = (value: string, maxLength = 160) => {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength).trimEnd()}…`;
};

const getFirstSentence = (value: string) => {
    const sentenceEnd = value.search(/[。！？!?]|\.(?=\s|$)/u);

    return sentenceEnd === -1 ? value : value.slice(0, sentenceEnd + 1);
};

const getBodyContent = (entry: ArticleEntry) => {
    const titleParts: string[] = [];
    const paragraphParts: string[] = [];
    let inCodeBlock = false;
    let collectingParagraph = false;

    for (const line of (entry.body ?? "").split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(line)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (inCodeBlock) {
            continue;
        }

        const trimmedLine = line.trim();

        if (!trimmedLine) {
            if (collectingParagraph) {
                break;
            }

            continue;
        }

        const heading = trimmedLine.match(/^#\s+(.+?)\s*#*$/);

        if (heading) {
            if (titleParts.length === 0) {
                titleParts.push(heading[1]);
            }

            if (collectingParagraph) {
                break;
            }

            continue;
        }

        if (/^!\[[^\]]*]\([^)]*\)$/.test(trimmedLine)) {
            continue;
        }

        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
            continue;
        }

        collectingParagraph = true;
        paragraphParts.push(trimmedLine.replace(/^(?:[-*+]|\d+\.|>)\s+/, ""));
    }

    return {
        title: stripMarkdown(titleParts[0] ?? ""),
        summary: stripMarkdown(paragraphParts.join(" ")),
    };
};

const getFallbackTitle = (id: string) => {
    const fileName = id.split("/").at(-1) ?? id;

    return fileName
        .replace(/^\d{4}-\d{2}-\d{2}[-_]?/, "")
        .replace(/[-_]+/g, " ")
        .trim();
};

export const getArticleMeta = (entry: ArticleEntry): ArticleMeta => {
    const bodyContent = getBodyContent(entry);
    const frontmatterTitle = entry.data.title?.trim();
    const frontmatterSummary = entry.data.summary?.trim();
    const title = frontmatterTitle || bodyContent.title || getFallbackTitle(entry.id);
    const summary = frontmatterSummary || bodyContent.summary || "暂无摘要";
    const tags = [...new Set(entry.data.tags.map((tag) => tag.trim()).filter(Boolean))];

    return {
        title: title || "未命名文章",
        summary: truncate(getFirstSentence(summary)),
        tags,
        publishedAt: entry.data.date,
        writtenAt: entry.data.writtenDate ?? entry.data.date,
        titleFromBody: !frontmatterTitle && Boolean(bodyContent.title),
        summaryFromBody: !frontmatterSummary && Boolean(bodyContent.summary),
    };
};
