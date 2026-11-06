# 苗の小屋

使用 Astro 构建的个人网站，正式地址为 <https://kreedyke.com/>。

## 本地开发

```sh
pnpm install
pnpm dev
```

Windows 上也可以双击 `start-site.cmd` 启动，并直接打开 Articles 页面。

## 内容维护

- 文章位于 `src/content/articles/`，可使用 `pnpm new:article 文件名` 创建。
- Gallery 图片位于 `public/images/gallery/`，每张图片对应 `src/content/galleries/` 中的一个 Markdown 文件。
- Gallery 的内容字段包括 `image`、`date`、`summary`、`alt` 和 `draft`。
- 作品评价位于 `src/content/reviews/`。
- 日常管理 Gallery 可使用 `.pages.yml` 配置的 Pages CMS。

## 构建与部署

```sh
pnpm build
```

推送到 GitHub 的 `main` 分支后，Cloudflare Pages 会自动构建并发布。
