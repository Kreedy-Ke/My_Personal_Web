# Gallery 图片目录

图片文件放在此目录，每张图片在 `src/content/galleries/` 中对应一个 Markdown 文件。

- 支持 JPG、PNG、WebP、AVIF 和 GIF。
- 每页最多展示 12 张图片。
- 图片按 Markdown 中的 `date` 从新到旧排列。
- 修改图片后重新构建并推送，Cloudflare Pages 会自动更新。

Markdown 示例：

```md
---
image: "/images/gallery/example.jpg"
date: "2026-11-06"
summary: "这张图片的一句话简介。"
alt: "图片内容的简短描述"
---
```
