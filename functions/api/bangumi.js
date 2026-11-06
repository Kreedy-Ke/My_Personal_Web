const DEFAULT_USERNAME = "kreedy_ke";
const BANGUMI_API = "https://api.bgm.tv";
const CACHE_SECONDS = 6 * 60 * 60;
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

const categoryDefinitions = [
    { key: "anime", label: "动画" },
    { key: "manga", label: "漫画" },
    { key: "light-novel", label: "轻小说" },
];

const statusLabels = {
    1: "想看",
    2: "看过",
    3: "在看",
    4: "搁置",
    5: "抛弃",
};

const includesTag = (tags, values) => {
    return tags.some((tag) => values.includes(tag.trim().toLocaleLowerCase("zh-CN")));
};

const jsonResponse = (body, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": status === 200
                ? `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`
                : "no-store",
        },
    });
};

const fetchCollections = async (username, subjectType, token) => {
    const collections = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
        const endpoint = new URL(
            `/v0/users/${encodeURIComponent(username)}/collections`,
            BANGUMI_API,
        );
        endpoint.searchParams.set("subject_type", String(subjectType));
        endpoint.searchParams.set("limit", String(PAGE_SIZE));
        endpoint.searchParams.set("offset", String(page * PAGE_SIZE));

        const headers = {
            Accept: "application/json",
            "User-Agent": "KreedyWiki/1.0 (https://kreedyke.com)",
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, { headers });

        if (!response.ok) {
            throw new Error(`Bangumi API returned ${response.status}`);
        }

        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : [];
        collections.push(...data);

        if (data.length < PAGE_SIZE || collections.length >= Number(payload.total ?? 0)) {
            break;
        }
    }

    return collections;
};

const normalizeCollection = (collection) => {
    const subject = collection.subject;

    if (!subject) {
        return null;
    }

    const subjectTags = Array.isArray(subject.tags)
        ? subject.tags.map((tag) => String(tag.name ?? tag).toLocaleLowerCase("zh-CN"))
        : [];
    const userTags = Array.isArray(collection.tags)
        ? collection.tags.map((tag) => String(tag).toLocaleLowerCase("zh-CN"))
        : [];
    const tags = [...subjectTags, ...userTags];

    let category;

    if (collection.subject_type === 2) {
        category = "anime";
    } else if (collection.subject_type === 1) {
        if (includesTag(tags, ["轻小说", "ライトノベル", "light novel"])) {
            category = "light-novel";
        } else if (includesTag(tags, ["漫画", "コミック", "manga", "comic"])) {
            category = "manga";
        }
    }

    if (!category || Number(collection.rate) <= 0) {
        return null;
    }

    const images = subject.images ?? {};

    return {
        id: Number(subject.id ?? collection.subject_id),
        category,
        title: subject.name_cn?.trim() || subject.name || "未命名作品",
        originalTitle: subject.name_cn?.trim() && subject.name !== subject.name_cn
            ? subject.name
            : "",
        cover: images.large || images.common || images.medium || images.small || "",
        rating: Number(collection.rate),
        status: statusLabels[Number(collection.type)] ?? "已收藏",
        subjectScore: subject.score === undefined ? null : Number(subject.score),
        url: `https://bgm.tv/subject/${subject.id ?? collection.subject_id}`,
    };
};

export async function onRequestGet(context) {
    const username = context.env.BANGUMI_USERNAME?.trim() || DEFAULT_USERNAME;
    const requestUrl = new URL(context.request.url);
    const cacheUrl = new URL("/api/bangumi", requestUrl.origin);
    cacheUrl.searchParams.set("user", username);
    const cacheKey = new Request(cacheUrl.toString(), {
        headers: { Accept: "application/json" },
    });
    const cache = caches.default;

    if (!requestUrl.searchParams.has("refresh")) {
        const cached = await cache.match(cacheKey);

        if (cached) {
            return cached;
        }
    }

    try {
        const token = context.env.BANGUMI_ACCESS_TOKEN || "";
        const animeCollections = await fetchCollections(username, 2, token);
        const bookCollections = await fetchCollections(username, 1, token);
        const collections = [...animeCollections, ...bookCollections]
            .map(normalizeCollection)
            .filter(Boolean);

        const categories = categoryDefinitions.map((category) => {
            const items = collections
                .filter((item) => item.category === category.key)
                .sort((a, b) => {
                    return (
                        b.rating - a.rating ||
                        (b.subjectScore ?? 0) - (a.subjectScore ?? 0) ||
                        a.title.localeCompare(b.title, "zh-CN")
                    );
                });

            return {
                ...category,
                items,
            };
        });

        const body = {
            username,
            profileUrl: `https://bgm.tv/user/${encodeURIComponent(username)}`,
            syncedAt: new Date().toISOString(),
            total: categories.reduce((sum, category) => sum + category.items.length, 0),
            categories,
        };
        const response = jsonResponse(body);

        context.waitUntil(cache.put(cacheKey, response.clone()));

        return response;
    } catch (error) {
        return jsonResponse(
            {
                error: "暂时无法从 Bangumi 获取收藏数据。",
                detail: error instanceof Error ? error.message : String(error),
            },
            502,
        );
    }
}
