# 苗の小屋

使用 Astro 构建的个人网站，正式地址为 <https://kreedyke.com/>。

## 本地开发

```sh
pnpm install
pnpm dev
```

## 内容维护

- 文章位于 `src/content/articles/`，默认创建到 Writing，可使用 `pnpm new:article 文件名` 创建。
- 随笔与时评使用 `pnpm new:article 文件名 --section essays` 创建。
- Writing 和 Essays 分别位于 `/writing/`、`/essays/`。
- 安科图片位于 `public/images/anke/`，可通过 `.pages.yml` 配置的 Pages CMS 管理。
- 作品评价通过 Cloudflare Function 从 Bangumi 用户 `kreedy_ke` 自动同步，按动画、漫画和轻小说分类，结果缓存 6 小时。
- 作品细化评分与短评通过 `/reviews/edit/` 编辑，需要 Cloudflare Pages 的 `REVIEW_NOTES` KV 绑定和 `REVIEW_NOTES_TOKEN` 密钥。

## 构建与部署

```sh
pnpm build
```

推送到 GitHub 的 `main` 分支后，Cloudflare Pages 会自动构建并发布。
