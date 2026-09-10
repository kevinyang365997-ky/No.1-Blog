# SEO 发布助手（站长专用）

这个工具只在本机和构建过程中运行，不会在博客导航、页面或访客端显示。

## 每次发布前怎么用

1. 在文章、视频、图库或项目 Markdown 文件开头填写可选的 SEO 字段。
2. 双击根目录的 `运行SEO发布检查.cmd`。
3. 浏览器会打开私有报告，按分数最低的内容优先优化。
4. 正常构建或发布；`npm run build` 也会自动刷新一次报告。

## 可填写字段

```yaml
seo_title: Custom SMT Feeder Solutions for Odd Components
seo_slug: custom-smt-feeder-solutions
seo_primary_keyword: custom SMT feeder
seo_secondary_keywords:
- odd-form component feeder
- SMT automation
- component feeding solution
seo_meta_description: Explore custom SMT feeder solutions for odd-form components, designed to improve feeding stability, placement accuracy and line efficiency.
seo_search_intent: commercial investigation
```

- `seo_title`：搜索结果标题，建议约 30–60 个字符；它只影响搜索标题，不改正文标题。
- `seo_slug`：报告给出的建议网址。已有页面不要随意改 `id`，否则旧链接可能失效。
- `seo_primary_keyword`：一个核心搜索词，应自然出现在标题、描述或正文开头。
- `seo_secondary_keywords`：2–6 个相关词，用于指导内容，不输出无效的 `meta keywords` 标签。
- `seo_meta_description`：搜索摘要，建议约 110–160 个字符。
- `seo_search_intent`：填写 `informational`、`commercial investigation`、`transactional` 或 `navigational`。

报告位置：`all/.seo-reports/latest.html`。该目录已被 Git 忽略，也不会复制到 `dist`。
