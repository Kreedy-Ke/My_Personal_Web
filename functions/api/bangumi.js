const DEFAULT_USERNAME = "kreedy_ke";
const BANGUMI_API = "https://api.bgm.tv";
const CACHE_SECONDS = 6 * 60 * 60;
const CACHE_VERSION = "3";
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

const categoryDefinitions = [
    { key: "anime", label: "动画" },
    { key: "manga", label: "漫画" },
    { key: "light-novel", label: "轻小说" },
];

const statusDetails = {
    1: { key: "wish", label: "想看" },
    2: { key: "watched", label: "看过" },
    3: { key: "watching", label: "在看" },
    4: { key: "onhold", label: "搁置" },
    5: { key: "dropped", label: "抛弃" },
};

const includesTag = (tags, values) => {
    return tags.some((tag) => values.includes(tag.trim().toLocaleLowerCase("zh-CN")));
};

const completedTags = ["完结", "已完结", "连载结束", "放送结束", "全话完结"];
const ongoingTags = ["未完结", "连载中", "放送中", "连载进行中"];
const nonJapaneseTags = [
    "中国",
    "国产",
    "国漫",
    "美国",
    "欧美",
    "韩国",
    "法国",
    "英国",
    "德国",
    "俄罗斯",
    "加拿大",
    "澳大利亚",
    "印度",
    "泰国",
    "新加坡",
];

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
    const status = statusDetails[Number(collection.type)] ?? {
        key: "watched",
        label: "已收藏",
    };
    let completion = "unknown";

    if (includesTag(tags, ongoingTags)) {
        completion = "ongoing";
    } else if (includesTag(tags, completedTags)) {
        completion = "completed";
    } else if (Number(collection.type) === 2) {
        completion = "completed";
    } else if (Number(collection.type) === 3) {
        completion = "ongoing";
    }

    return {
        id: Number(subject.id ?? collection.subject_id),
        category,
        completion,
        date: subject.date ?? "",
        title: subject.name_cn?.trim() || subject.name || "未命名作品",
        originalTitle: subject.name_cn?.trim() && subject.name !== subject.name_cn
            ? subject.name
            : "",
        cover: images.large || images.common || images.medium || images.small || "",
        rating: Number(collection.rate),
        status: status.label,
        statusKey: status.key,
        region: includesTag(tags, nonJapaneseTags) ? "non-japan" : "japan",
        subjectScore: subject.score === undefined ? null : Number(subject.score),
        url: `https://bgm.tv/subject/${subject.id ?? collection.subject_id}`,
    };
};

export async function onRequestGet(context) {
    const username = context.env.BANGUMI_USERNAME?.trim() || DEFAULT_USERNAME;
    const requestUrl = new URL(context.request.url);
    const cacheUrl = new URL("/api/bangumi", requestUrl.origin);
    cacheUrl.searchParams.set("user", username);
    cacheUrl.searchParams.set("version", CACHE_VERSION);
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
                        b.date.localeCompare(a.date) ||
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
