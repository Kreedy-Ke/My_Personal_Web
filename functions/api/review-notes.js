const STORAGE_KEY = "review-notes";
const MAX_COMMENT_LENGTH = 120;

const jsonResponse = (body, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
};

const getNotes = async (env) => {
    if (!env.REVIEW_NOTES) {
        return {};
    }

    return (await env.REVIEW_NOTES.get(STORAGE_KEY, "json")) ?? {};
};

export async function onRequestGet(context) {
    try {
        return jsonResponse(await getNotes(context.env));
    } catch {
        return jsonResponse({ error: "暂时无法读取个人评价。" }, 502);
    }
}

export async function onRequestPost(context) {
    if (!context.env.REVIEW_NOTES || !context.env.REVIEW_NOTES_TOKEN) {
        return jsonResponse(
            { error: "Cloudflare 尚未配置个人评价存储或编辑口令。" },
            503,
        );
    }

    const authorization = context.request.headers.get("Authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : "";

    if (token !== context.env.REVIEW_NOTES_TOKEN) {
        return jsonResponse({ error: "编辑口令不正确。" }, 401);
    }

    let payload;

    try {
        payload = await context.request.json();
    } catch {
        return jsonResponse({ error: "请求内容不是有效 JSON。" }, 400);
    }

    const subjectId = Number(payload.subjectId);
    const score = payload.score === "" || payload.score === null
        ? null
        : Number(payload.score);
    const comment = String(payload.comment ?? "").trim();

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
        return jsonResponse({ error: "作品 ID 无效。" }, 400);
    }

    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 10)) {
        return jsonResponse({ error: "细化评分必须在 0 到 10 之间。" }, 400);
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
        return jsonResponse({ error: `短评不能超过 ${MAX_COMMENT_LENGTH} 个字符。` }, 400);
    }

    try {
        const notes = await getNotes(context.env);

        if (score === null && !comment) {
            delete notes[String(subjectId)];
        } else {
            notes[String(subjectId)] = {
                score,
                comment,
                updatedAt: new Date().toISOString(),
            };
        }

        await context.env.REVIEW_NOTES.put(STORAGE_KEY, JSON.stringify(notes));

        return jsonResponse(notes);
    } catch {
        return jsonResponse({ error: "保存个人评价失败。" }, 502);
    }
}
