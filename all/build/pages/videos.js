const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const shared = require('../../shared/shared.js');
const {
    parseMarkdown,
    autoSpacingHtml,
    applyParagraphAlignment,
    extractHeadingsAndGenerateTOC,
    addHeadingIds
} = require('../markdown.js');
const { replacePlaceholders } = require('../template-engine.js');
const seo = require('../seo.js');

const PLATFORM_LABELS = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    douyin: '抖音',
    kuaishou: '快手',
    'wechat-video': '视频号',
    xiaohongshu: '小红书',
    local: '本地视频'
};

const CATEGORY_LABELS = {
    project: '项目视频',
    knowledge: '知识分享',
    tutorial: '教程',
    work: '工作记录',
    life: '生活记录',
    interview: '访谈',
    other: '其他'
};

const CATEGORY_LABELS_EN = {
    project: 'Project Video',
    knowledge: 'Knowledge',
    tutorial: 'Tutorial',
    work: 'Work Log',
    life: 'Life',
    interview: 'Interview',
    other: 'Other'
};

const VIDEO_UI = {
    'zh-CN': {
        listTitle: '视频库',
        listDescription: '整理与项目、知识、学习和生活相关的视频，并集中维护各视频平台的原始链接。',
        seoListTitle: '视频',
        seoListDescription: '整理项目、知识、学习和生活相关的视频内容。',
        allVideos: '全部视频',
        noVideosTitle: '暂无视频',
        noVideosDescription: '当前平台的视频内容正在整理中。',
        filterLabel: '视频平台筛选',
        listLabel: '视频列表',
        douyin: '抖音',
        kuaishou: '快手',
        wechatVideo: '视频号',
        xiaohongshu: '小红书',
        localVideo: '本地视频',
        published: '发布日期',
        duration: '视频时长',
        creator: '作者或来源',
        updated: '最后更新',
        viewVideo: '查看视频',
        backToVideos: '返回视频库',
        watchOriginal: '前往原平台观看',
        noSource: '暂无原始视频链接',
        noPreview: '暂无视频预览',
        noSummary: '暂无视频摘要。',
        featured: '精选视频',
        toc: '视频目录',
        relatedProjects: '相关项目',
        relatedArticles: '相关文章',
        noProjects: '暂未关联项目。',
        noArticles: '暂未关联文章。',
        missingValue: '未填写',
        fallbackNotice: '当前所选语言暂未提供完整视频翻译，现显示中文内容。'
    },
    'en-US': {
        listTitle: 'Video Library',
        listDescription: 'Videos about projects, manufacturing knowledge, learning and practical automation applications, with original platform links in one place.',
        seoListTitle: 'Videos',
        seoListDescription: 'Project videos, manufacturing knowledge and practical electronics automation content.',
        allVideos: 'All Videos',
        noVideosTitle: 'No videos available',
        noVideosDescription: 'Video content for this platform is being prepared.',
        filterLabel: 'Filter videos by platform',
        listLabel: 'Video list',
        douyin: 'Douyin',
        kuaishou: 'Kuaishou',
        wechatVideo: 'WeChat Channels',
        xiaohongshu: 'Xiaohongshu',
        localVideo: 'Local Video',
        published: 'Published',
        duration: 'Duration',
        creator: 'Creator or Source',
        updated: 'Last Updated',
        viewVideo: 'View Video',
        backToVideos: 'Back to Video Library',
        watchOriginal: 'Watch on Original Platform',
        noSource: 'No original video link',
        noPreview: 'No video preview available',
        noSummary: 'No video summary available.',
        featured: 'Featured Video',
        toc: 'Video Contents',
        relatedProjects: 'Related Projects',
        relatedArticles: 'Related Articles',
        noProjects: 'No related projects.',
        noArticles: 'No related articles.',
        missingValue: 'Not provided',
        fallbackNotice: 'A full translation is not yet available for the selected language. English content is shown instead.'
    }
};

function localeSegment(locale) {
    return locale === 'zh-CN' ? 'zh-cn' : 'en-us';
}

function videoPath(locale, id = '') {
    const suffix = id ? `/${encodeURIComponent(id)}/` : '/';
    return `/${localeSegment(locale)}/videos${suffix}`;
}

function renderAlternateLinks(siteConfig, id = '') {
    const zhPath = seo.absoluteUrl(siteConfig, videoPath('zh-CN', id));
    const enPath = seo.absoluteUrl(siteConfig, videoPath('en-US', id));

    return [
        `<link rel="alternate" hreflang="zh-CN" href="${zhPath}">`,
        `<link rel="alternate" hreflang="en" href="${enPath}">`,
        `<link rel="alternate" hreflang="en-US" href="${enPath}">`,
        `<link rel="alternate" hreflang="x-default" href="${enPath}">`
    ].join('\n');
}

function localizeShell(html, locale) {
    const listUrl = videoPath(locale);

    return html
        .replace(/<html lang="[^"]*">/, `<html lang="${locale}">`)
        .replace(/href="\/videos"/g, `href="${listUrl}"`);
}

function escape(value) {
    return shared.escapeHtml(String(value || ''));
}

function normalizeId(value, filename) {
    const source = String(value || path.parse(filename).name)
        .trim()
        .toLowerCase();

    return source
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function formatDate(value) {
    if (!value) {
        return '未填写';
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const day = String(value.getUTCDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    const source = String(value).trim();

    if (!source) {
        return '未填写';
    }

    const dateOnlyMatch = source.match(/^(\d{4}-\d{2}-\d{2})/);

    if (dateOnlyMatch) {
        return dateOnlyMatch[1];
    }

    const parsedDate = new Date(source);

    if (!Number.isNaN(parsedDate.getTime())) {
        const year = parsedDate.getUTCFullYear();
        const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getUTCDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    return source;
}

function normalizeStringArray(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item || '').trim())
            .filter(Boolean);
    }

    if (!value) {
        return [];
    }

    return [String(value).trim()].filter(Boolean);
}

function isSafeUrl(value) {
    const source = String(value || '').trim();

    if (!source) {
        return false;
    }

    if (source.startsWith('/')) {
        return true;
    }

    try {
        const url = new URL(source);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function isSafeEmbedUrl(value) {
    const source = String(value || '').trim();

    if (!source) {
        return false;
    }

    try {
        const url = new URL(source);

        if (url.protocol !== 'https:') {
            return false;
        }

        const hostname = url.hostname.toLowerCase();

        const allowedHosts = [
            'www.youtube.com',
            'youtube.com',
            'www.youtube-nocookie.com',
            'youtube-nocookie.com',
            'player.vimeo.com',
            'www.facebook.com',
            'facebook.com',
            'www.tiktok.com',
            'tiktok.com'
        ];

        return allowedHosts.includes(hostname);
    } catch {
        return false;
    }
}

function loadVideos(videosDir, locale = 'zh-CN') {
    if (!fs.existsSync(videosDir)) {
        console.log('  Videos directory not found.');
        return [];
    }

    const files = fs.readdirSync(videosDir)
        .filter((name) => /\.(md|markdown)$/i.test(name));

    const videos = [];
    const usedIds = new Set();

    files.forEach((filename) => {
        const filePath = path.join(videosDir, filename);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(raw);

        if (data.show === false) {
            console.log(`  Skipping hidden video: ${filename}`);
            return;
        }

        const id = normalizeId(data.id, filename);

        if (!id) {
            throw new Error(
                `Video "${filename}" requires a valid English id.`
            );
        }

        if (usedIds.has(id)) {
            throw new Error(`Duplicate video id: ${id}`);
        }

        usedIds.add(id);

        const platform = PLATFORM_LABELS[data.platform]
            ? data.platform
            : 'local';

        const category = CATEGORY_LABELS[data.category]
            ? data.category
            : 'other';

        const ui = VIDEO_UI[locale] || VIDEO_UI['zh-CN'];
        const categoryLabels = locale === 'en-US'
            ? CATEGORY_LABELS_EN
            : CATEGORY_LABELS;

        videos.push({
            id,
            filename,
            title: String(
                data.title || path.parse(filename).name
            ).trim(),
            platform,
            platformLabel: PLATFORM_LABELS[platform],
            category,
            categoryLabel: categoryLabels[category],
            date: formatDate(data.date),
            updated: formatDate(data.updated || data.date),
            duration: String(data.duration || ui.missingValue).trim(),
            creator: String(data.creator || ui.missingValue).trim(),
            sourceUrl: isSafeUrl(data.source_url)
                ? String(data.source_url).trim()
                : '',
            embedUrl: isSafeEmbedUrl(data.embed_url)
                ? String(data.embed_url).trim()
                : '',
            cover: isSafeUrl(data.cover)
                ? String(data.cover).trim()
                : '',
            summary: String(data.summary || '').trim(),
            tags: normalizeStringArray(data.tags),
            relatedProjects: normalizeStringArray(
                data.related_projects
            ),
            relatedArticles: normalizeStringArray(
                data.related_articles
            ),
            featured: data.featured === true,
            content
        });
    });

    videos.sort((a, b) => {
        if (a.featured !== b.featured) {
            return a.featured ? -1 : 1;
        }

        return String(b.date).localeCompare(String(a.date));
    });

    return videos;
}

function renderPlatformBadge(video) {
    return `
        <span
            class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
        >
            ${escape(video.platformLabel)}
        </span>
    `;
}

function renderCategoryBadge(video) {
    return `
        <span
            class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
            ${escape(video.categoryLabel)}
        </span>
    `;
}

function renderFeaturedBadge(video, ui) {
    if (!video.featured) {
        return '';
    }

    return `
        <span
            class="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        >
            ${escape(ui.featured)}
        </span>
    `;
}

function renderVideoCover(video) {
    if (video.cover) {
        return `
            <div class="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src="${escape(video.cover)}"
                    alt="${escape(video.title)}"
                    class="w-full object-cover"
                    loading="lazy"
                    decoding="async"
                >

                <span
                    class="absolute inset-0 flex items-center justify-center"
                    aria-hidden="true"
                >
                    <span
                        class="flex size-16 items-center justify-center rounded-full bg-black/65 text-2xl text-white backdrop-blur-sm"
                    >
                        ▶
                    </span>
                </span>
            </div>
        `;
    }

    return `
        <div
            class="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 dark:from-slate-800 dark:to-slate-900 dark:text-slate-500"
        >
            <span
                class="flex size-16 items-center justify-center rounded-full bg-white/70 text-2xl shadow-sm dark:bg-slate-700"
                aria-hidden="true"
            >
                ▶
            </span>
        </div>
    `;
}

function renderVideoCard(video, locale, ui) {
    const videoUrl = videoPath(locale, video.id);

    return `
        <article
            class="video-card overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            data-video-platform="${escape(video.platform)}"
        >
            <a href="${videoUrl}" class="block">
                ${renderVideoCover(video)}

                <div class="p-6">
                    <div class="mb-4 flex flex-wrap gap-2">
                        ${renderPlatformBadge(video)}
                        ${renderCategoryBadge(video)}
                        ${renderFeaturedBadge(video, ui)}
                    </div>

                    <h2
                        class="mb-3 text-xl font-semibold leading-snug text-slate-900 dark:text-white"
                    >
                        ${escape(video.title)}
                    </h2>

                    <p
                        class="mb-5 text-sm leading-7 text-slate-500 dark:text-slate-400"
                    >
                        ${escape(video.summary || ui.noSummary)}
                    </p>

                    <dl
                        class="mb-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800"
                    >
                        <div>
                            <dt class="mb-1 text-slate-400">${escape(ui.published)}</dt>
                            <dd class="text-slate-600 dark:text-slate-300">
                                ${escape(video.date)}
                            </dd>
                        </div>

                        <div>
                            <dt class="mb-1 text-slate-400">${escape(ui.duration)}</dt>
                            <dd class="text-slate-600 dark:text-slate-300">
                                ${escape(video.duration)}
                            </dd>
                        </div>
                    </dl>

                    <span
                        class="inline-flex items-center gap-2 text-sm font-medium text-primary"
                    >
                        ${escape(ui.viewVideo)}
                        <span aria-hidden="true">→</span>
                    </span>
                </div>
            </a>
        </article>
    `;
}

function renderPlayer(video, ui) {
    if (video.embedUrl) {
        return `
            <div class="video-player-shell">
                <iframe
                    src="${escape(video.embedUrl)}"
                    title="${escape(video.title)}"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
            </div>
        `;
    }

    if (video.cover) {
        return `
            <div class="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                    src="${escape(video.cover)}"
                    alt="${escape(video.title)}"
                    class="max-h-[620px] w-full object-cover"
                    loading="eager"
                    decoding="async"
                >

                <span
                    class="absolute inset-0 flex items-center justify-center"
                    aria-hidden="true"
                >
                    <span
                        class="flex size-20 items-center justify-center rounded-full bg-black/65 text-3xl text-white backdrop-blur-sm"
                    >
                        ▶
                    </span>
                </span>
            </div>
        `;
    }

    return `
        <div
            class="video-player-shell flex items-center justify-center text-slate-400"
        >
            ${escape(ui.noPreview)}
        </div>
    `;
}

function renderSourceLink(video, ui) {
    if (!video.sourceUrl) {
        return `
            <span class="text-sm text-slate-400">
                ${escape(ui.noSource)}
            </span>
        `;
    }

    return `
        <a
            href="${escape(video.sourceUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
            ${escape(ui.watchOriginal)}
            <span aria-hidden="true">↗</span>
        </a>
    `;
}

function renderVideoMarkdown(video) {
    const { toc, headings } =
        extractHeadingsAndGenerateTOC(video.content);

    let html = parseMarkdown(video.content, {
        enableImageCaptions: true,
        markMarkdownHeadings: true
    });

    html = addHeadingIds(html, headings);
    html = autoSpacingHtml(html);
    html = applyParagraphAlignment(html);

    return {
        html,
        toc
    };
}

function renderRelatedProjects(video, ui) {
    if (!video.relatedProjects.length) {
        return `<p>${escape(ui.noProjects)}</p>`;
    }

    const items = video.relatedProjects
        .map((projectId) => {
            const safeId = encodeURIComponent(projectId);

            return `
                <li>
                    <a
                        href="/projects/${safeId}/"
                        class="text-primary hover:underline"
                    >
                        ${escape(projectId)}
                    </a>
                </li>
            `;
        })
        .join('');

    return `<ul class="space-y-2">${items}</ul>`;
}

function renderRelatedArticles(video, ui) {
    if (!video.relatedArticles.length) {
        return `<p>${escape(ui.noArticles)}</p>`;
    }

    const items = video.relatedArticles
        .map((articleUrl) => {
            if (!isSafeUrl(articleUrl)) {
                return '';
            }

            return `
                <li>
                    <a
                        href="${escape(articleUrl)}"
                        class="text-primary hover:underline"
                    >
                        ${escape(articleUrl)}
                    </a>
                </li>
            `;
        })
        .filter(Boolean)
        .join('');

    if (!items) {
        return `<p>${escape(ui.noArticles)}</p>`;
    }

    return `<ul class="space-y-2">${items}</ul>`;
}

function generateListPage({
    videos,
    template,
    siteConfig,
    seoConfig,
    outputDir,
    locale,
    legacy = false
}) {
    const ui = VIDEO_UI[locale];
    const pageTitle =
        `${ui.seoListTitle} - ${
            siteConfig.site_title ||
            siteConfig.site_name ||
            'FreeCat Blog'
        }`;

    const canonicalPath = videoPath(locale);

    const seoHead = seo.renderHeadTags({
        title: pageTitle,
        description: ui.seoListDescription,
        canonicalPath,
        siteConfig,
        seoConfig,
        image: seo.defaultImage(siteConfig, seoConfig)
    }) + '\n' + renderAlternateLinks(siteConfig);

    const itemsHtml = videos
        .map((video) => renderVideoCard(video, locale, ui))
        .join('\n');

    let html = replacePlaceholders(template, [
        ['<!-- VIDEOS_SEO_HEAD -->', seoHead],
        ['<!-- VIDEOS_ITEMS -->', itemsHtml],
        ['<!-- VIDEOS_CONTENT_LOCALE -->', locale],
        ['<!-- VIDEOS_FALLBACK_NOTICE -->', escape(ui.fallbackNotice)],
        [/<!-- VIDEOS_PAGE_TITLE -->/g, escape(ui.listTitle)],
        ['<!-- VIDEOS_PAGE_DESCRIPTION -->', escape(ui.listDescription)],
        ['<!-- VIDEOS_FILTER_LABEL -->', escape(ui.filterLabel)],
        ['<!-- VIDEOS_ALL_LABEL -->', escape(ui.allVideos)],
        ['<!-- VIDEOS_LIST_LABEL -->', escape(ui.listLabel)],
        ['<!-- VIDEOS_DOUYIN_LABEL -->', escape(ui.douyin)],
        ['<!-- VIDEOS_KUAISHOU_LABEL -->', escape(ui.kuaishou)],
        ['<!-- VIDEOS_WECHAT_LABEL -->', escape(ui.wechatVideo)],
        ['<!-- VIDEOS_XIAOHONGSHU_LABEL -->', escape(ui.xiaohongshu)],
        ['<!-- VIDEOS_LOCAL_LABEL -->', escape(ui.localVideo)],
        ['<!-- VIDEOS_EMPTY_TITLE -->', escape(ui.noVideosTitle)],
        ['<!-- VIDEOS_EMPTY_DESCRIPTION -->', escape(ui.noVideosDescription)]
    ]);

    html = localizeShell(html, locale);

    const outputPath = legacy
        ? path.join(outputDir, 'videos.html')
        : path.join(outputDir, localeSegment(locale), 'videos', 'index.html');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    fs.writeFileSync(
        outputPath,
        html,
        'utf-8'
    );

    console.log(`  Generated: ${path.relative(outputDir, outputPath).replace(/\\/g, '/')}`);
}

function generateDetailPages({
    videos,
    template,
    siteConfig,
    seoConfig,
    outputDir,
    locale,
    legacy = false
}) {
    const ui = VIDEO_UI[locale];
    const videosOutputDir = legacy
        ? path.join(outputDir, 'videos')
        : path.join(outputDir, localeSegment(locale), 'videos');

    fs.mkdirSync(videosOutputDir, {
        recursive: true
    });

    videos.forEach((video) => {
        const rendered = renderVideoMarkdown(video);
        const canonicalPath = videoPath(locale, video.id);

        const pageTitle =
            `${video.title} - ${
                siteConfig.site_title ||
                siteConfig.site_name ||
                'FreeCat Blog'
            }`;

        const seoHead = seo.renderHeadTags({
            title: pageTitle,
            description:
                video.summary ||
                seo.defaultDescription(siteConfig, seoConfig),
            canonicalPath,
            siteConfig,
            seoConfig,
            image:
                video.cover ||
                seo.defaultImage(siteConfig, seoConfig),
            type: 'article',
            publishedTime: video.date,
            modifiedTime: video.updated
        }) + '\n' + renderAlternateLinks(siteConfig, video.id);

        let html = replacePlaceholders(template, [
            ['<!-- VIDEO_SEO_HEAD -->', seoHead],
            ['<!-- VIDEO_CONTENT_LOCALE -->', locale],
            ['<!-- VIDEO_ID -->', escape(video.id)],
            ['<!-- VIDEO_LIST_URL -->', videoPath(locale)],
            ['<!-- VIDEO_BACK_LABEL -->', escape(ui.backToVideos)],
            ['<!-- VIDEO_FALLBACK_NOTICE -->', escape(ui.fallbackNotice)],
            ['<!-- VIDEO_PUBLISHED_LABEL -->', escape(ui.published)],
            ['<!-- VIDEO_DURATION_LABEL -->', escape(ui.duration)],
            ['<!-- VIDEO_CREATOR_LABEL -->', escape(ui.creator)],
            ['<!-- VIDEO_UPDATED_LABEL -->', escape(ui.updated)],
            ['<!-- VIDEO_TOC_LABEL -->', escape(ui.toc)],
            ['<!-- VIDEO_RELATED_PROJECTS_LABEL -->', escape(ui.relatedProjects)],
            ['<!-- VIDEO_RELATED_ARTICLES_LABEL -->', escape(ui.relatedArticles)],
            [/<!-- VIDEO_TITLE -->/g, escape(video.title)],
            ['<!-- VIDEO_SUMMARY -->', escape(video.summary)],
            ['<!-- VIDEO_PLATFORM_BADGE -->', renderPlatformBadge(video)],
            ['<!-- VIDEO_CATEGORY_BADGE -->', renderCategoryBadge(video)],
            ['<!-- VIDEO_FEATURED_BADGE -->', renderFeaturedBadge(video, ui)],
            ['<!-- VIDEO_PLAYER -->', renderPlayer(video, ui)],
            ['<!-- VIDEO_DATE -->', escape(video.date)],
            ['<!-- VIDEO_DURATION -->', escape(video.duration)],
            ['<!-- VIDEO_CREATOR -->', escape(video.creator)],
            ['<!-- VIDEO_UPDATED -->', escape(video.updated)],
            ['<!-- VIDEO_SOURCE_LINK -->', renderSourceLink(video, ui)],
            ['<!-- VIDEO_CONTENT -->', rendered.html],
            ['<!-- VIDEO_TOC -->', rendered.toc],
            ['<!-- VIDEO_RELATED_PROJECTS -->', renderRelatedProjects(video, ui)],
            ['<!-- VIDEO_RELATED_ARTICLES -->', renderRelatedArticles(video, ui)]
        ]);

        html = localizeShell(html, locale);

        const videoOutputDir =
            path.join(videosOutputDir, video.id);

        fs.mkdirSync(videoOutputDir, {
            recursive: true
        });

        fs.writeFileSync(
            path.join(videoOutputDir, 'index.html'),
            html,
            'utf-8'
        );

        console.log(
            `  Generated: ${path.relative(outputDir, path.join(videoOutputDir, 'index.html')).replace(/\\/g, '/')}`
        );
    });
}

function generate({
    listTemplate,
    detailTemplate,
    siteConfig,
    seoConfig,
    videosDir,
    outputDir
}) {
    console.log('🎬 Generating video pages...');

    const zhVideos = loadVideos(videosDir, 'zh-CN');
    const enVideos = loadVideos(path.join(videosDir, 'en-US'), 'en-US');

    const zhIds = zhVideos.map((video) => video.id).sort();
    const enIds = enVideos.map((video) => video.id).sort();

    if (JSON.stringify(zhIds) !== JSON.stringify(enIds)) {
        throw new Error(
            'Chinese and English video collections must contain matching ids.'
        );
    }

    generateListPage({
        videos: zhVideos,
        template: listTemplate,
        siteConfig,
        seoConfig,
        outputDir,
        locale: 'zh-CN',
        legacy: true
    });

    generateDetailPages({
        videos: zhVideos,
        template: detailTemplate,
        siteConfig,
        seoConfig,
        outputDir,
        locale: 'zh-CN',
        legacy: true
    });

    generateListPage({
        videos: zhVideos,
        template: listTemplate,
        siteConfig,
        seoConfig,
        outputDir,
        locale: 'zh-CN'
    });

    generateDetailPages({
        videos: zhVideos,
        template: detailTemplate,
        siteConfig,
        seoConfig,
        outputDir,
        locale: 'zh-CN'
    });

    generateListPage({
        videos: enVideos,
        template: listTemplate,
        siteConfig,
        seoConfig,
        outputDir,
        locale: 'en-US'
    });

    generateDetailPages({
        videos: enVideos,
        template: detailTemplate,
        siteConfig,
        seoConfig,
        outputDir,
        locale: 'en-US'
    });

    console.log(`  Published bilingual videos: ${zhVideos.length}`);
}

module.exports = {
    loadVideos,
    generate
};
