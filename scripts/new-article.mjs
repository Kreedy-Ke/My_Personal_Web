import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rawSlug = process.argv.slice(2).join("-").trim();

if (!rawSlug) {
    console.error("用法：pnpm new:article my-article-name");
    process.exit(1);
}

const slug = rawSlug
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

if (!slug) {
    console.error("文件名至少需要包含一个字母、数字或汉字。");
    process.exit(1);
}

const now = new Date();
const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
].join("-");
const target = fileURLToPath(
    new URL(`../src/content/articles/${slug}.md`, import.meta.url),
);

try {
    await access(target);
    console.error(`文章已存在：src/content/articles/${slug}.md`);
    process.exit(1);
} catch (error) {
    if (error.code !== "ENOENT") {
        throw error;
    }
}

await mkdir(dirname(target), { recursive: true });
await writeFile(
    target,
    `---
tags: []
date: "${date}"
---

# 

`,
    { flag: "wx" },
);

console.log(`已创建：src/content/articles/${slug}.md`);
console.log("接下来填写标签、标题和正文即可。");
