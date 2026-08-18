const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');

const {
    readText,
    writeText,
    ensureDir,
    exists,
    normalizeConfigValue,
    normalizeSiteUrl,
    escapeHtml,
    normalizeInternalPath,
    renderTemplateWithPartials
} = require('../utils');

const {
    renderToc,
    buildHeadingTree,
    slugifyHeading
} = require('../markdown');

const CATEGORY_LABELS = {
    lead: '主导项目',
    collaboration: '协作项目',
    solution: '解决方案'
};

const STATUS_LABELS = {
    draft: '草稿',
    planning: '规划中',
    active: '进行中',
    completed: '已完成',
    archived: '已归档'
};

function createProjectMarkdownRenderer() {
    return new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
    }).use(anchor, {
        slugify: slugifyHeading,
        permalink: false
    });
}

function normalizeBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['true', '1', 'yes', 'on'].includes(normalized)) {
            return true;
        }

        if (['false', '0', 'no', 'off'].includes(normalized)) {
            return false;
        }
    }

    return fallback;
}

function normalizeProjectCategory(value) {
    const category = normalizeConfigValue(value)
        .trim()
        .toLowerCase();

    if (
        category === 'lead' ||
        category === 'collaboration' ||
        category === 'solution'
    ) {
        return category;
    }

    return 'collaboration';
}

function normalizeProjectStatus(value) {
    const status = normalizeConfigValue(value)
        .trim()
        .toLowerCase();

    if (STATUS_LABELS[status]) {
        return status;
    }

    return 'draft';
}

function normalizeProjectId(value, fallback) {
    const candidate = normalizeConfigValue(value || fallback)
        .trim()
        .toLowerCase()
        .replace(/\.md$/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, '-')
        .replace(/^-+|-+$/g, '');

    return candidate || `project-${Date.now()}`;
}

function normalizeDate(value) {
    if (!value) return '';

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    const text = normalizeConfigValue(value).trim();

    if (!text) return '';

    const matched = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

    if (matched) {
        const [, year, month, day] = matched;

        return [
            year,
            String(month).padStart(2, '0'),
            String(day).padStart(2, '0')
        ].join('-');
    }

    const parsed = new Date(text);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    return text;
}

function dateToTimestamp(value) {
    if (!value) return 0;

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}

function stripMarkdown(markdown = '') {
    return String(markdown)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
        .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[#>*_~\-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function createSummary(value, markdown) {
    const configured = normalizeConfigValue(value).trim();

    if (configured) return configured;

    const plainText = stripMarkdown(markdown);

    if (!plainText) return '';

    return plainText.length > 150
        ? `${plainText.slice(0, 150).trim()}…`
        : plainText;
}

function createProjectRecord(filePath, markdownRenderer) {
    const source = readText(filePath);
    const parsed = matter(source);
    const metadata = parsed.data || {};
    const fallbackName = path.basename(
        filePath,
        path.extname(filePath)
    );

    const id = normalizeProjectId(
        metadata.id,
        fallbackName
    );

    const title =
        normalizeConfigValue(metadata.title).trim() ||
        fallbackName;

    const content = String(parsed.content || '').trim();
    const html = markdownRenderer.render(content);

    const env = {};
    markdownRenderer.parse(content, env);

    return {
        id,
        title,
        category: normalizeProjectCategory(metadata.category),
        date: normalizeDate(metadata.date),
        updated: normalizeDate(metadata.updated),
        location: normalizeConfigValue(metadata.location).trim(),
        status: normalizeProjectStatus(metadata.status),
        role: normalizeConfigValue(metadata.role).trim(),
        cover: normalizeInternalPath(
            normalizeConfigValue(metadata.cover).trim()
        ),
        summary: createSummary(
            metadata.summary,
            content
        ),
        featured: normalizeBoolean(
            metadata.featured,
            false
        ),
        show: normalizeBoolean(
            metadata.show,
            false
        ),
        relatedArticles: Array.isArray(metadata.related_articles)
            ? metadata.related_articles
            : [],
        relatedVideos: Array.isArray(metadata.related_videos)
            ? metadata.related_videos
            : [],
        relatedImages: Array.isArray(metadata.related_images)
            ? metadata.related_images
            : [],
        relatedProjects: Array.isArray(metadata.related_projects)
            ? metadata.related_projects
            : [],
        sourcePath: filePath,
        content,
        html,
        headings: env.headings || []
    };
}

function sortProjects(projects) {
    return [...projects].sort((left, right) => {
        if (left.featured !== right.featured) {
            return left.featured ? -1 : 1;
        }

        const leftTime = Math.max(
            dateToTimestamp(left.updated),
            dateToTimestamp(left.date)
        );

        const rightTime = Math.max(
            dateToTimestamp(right.updated),
            dateToTimestamp(right.date)
        );

        if (rightTime !== leftTime) {
            return rightTime - leftTime;
        }

        return left.title.localeCompare(
            right.title,
            'zh-CN'
        );
    });
}

function loadProjects(projectsDir) {
    if (!exists(projectsDir)) return [];

    const markdownRenderer =
        createProjectMarkdownRenderer();

    return sortProjects(
        fs.readdirSync(projectsDir)
            .filter((name) => name.toLowerCase().endsWith('.md'))
            .map((name) => {
                const filePath = path.join(
                    projectsDir,
                    name
                );

                try {
                    return createProjectRecord(
                        filePath,
                        markdownRenderer
                    );
                } catch (error) {
                    console.warn(
                        `跳过无法解析的项目文件 ${name}: ${error.message}`
                    );

                    return null;
                }
            })
            .filter(Boolean)
            .filter((project) => project.show)
    );
}

function formatDate(value) {
    if (!value) return '未填写';
    return escapeHtml(value);
}

function renderCategoryBadge(project) {
    const label =
        CATEGORY_LABELS[project.category] ||
        CATEGORY_LABELS.collaboration;

    return [
        '<span',
        ' class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"',
        ` data-project-category-label="${escapeHtml(project.category)}">`,
        escapeHtml(label),
        '</span>'
    ].join('');
}

function renderStatusBadge(project) {
    const label =
        STATUS_LABELS[project.status] ||
        STATUS_LABELS.draft;

    return [
        '<span',
        ' class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"',
        ` data-project-status-label="${escapeHtml(project.status)}">`,
        escapeHtml(label),
        '</span>'
    ].join('');
}

function renderFeaturedBadge(project) {
    if (!project.featured) return '';

    return [
        '<span',
        ' class="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"',
        ' data-project-featured-label>',
        '精选',
        '</span>'
    ].join('');
}

function renderProjectCover(project) {
    if (!project.cover) {
        return [
            '<div class="freecat-project-card-cover freecat-project-card-cover--empty">',
            '<span data-project-no-cover-label>暂无项目封面</span>',
            '</div>'
        ].join('');
    }

    return [
        '<div class="freecat-project-card-cover">',
        `<img src="${escapeHtml(project.cover)}"`,
        ` alt="${escapeHtml(project.title)}"`,
        ' loading="lazy" decoding="async">',
        '</div>'
    ].join('');
}

function renderProjectCard(project) {
    const projectUrl =
        `/projects/${encodeURIComponent(project.id)}/`;

    const summaryHtml = project.summary
        ? escapeHtml(project.summary)
        : '<span data-project-no-summary-label>项目内容正在整理中。</span>';

    const roleHtml = project.role
        ? escapeHtml(project.role)
        : '<span data-project-unfilled-label>未填写</span>';

    return `
<article class="freecat-project-card" data-project-category="${escapeHtml(project.category)}">
    <a class="freecat-project-card-link" href="${projectUrl}" aria-label="查看项目：${escapeHtml(project.title)}">
        ${renderProjectCover(project)}
        <div class="freecat-project-card-body">
            <div class="freecat-project-card-badges">
                ${renderCategoryBadge(project)}
                ${renderStatusBadge(project)}
                ${renderFeaturedBadge(project)}
            </div>

            <h2 class="freecat-project-card-title">
                ${escapeHtml(project.title)}
            </h2>

            <p class="freecat-project-card-summary">
                ${summaryHtml}
            </p>

            <dl class="freecat-project-card-meta">
                <div>
                    <dt data-project-date-label>项目时间</dt>
                    <dd>${formatDate(project.date)}</dd>
                </div>

                <div>
                    <dt data-project-role-label>承担角色</dt>
                    <dd>${roleHtml}</dd>
                </div>
            </dl>

            <span class="freecat-project-card-action">
                <span data-project-view-label>查看项目</span>
                <span aria-hidden="true">→</span>
            </span>
        </div>
    </a>
</article>`;
}

function renderProjectCards(projects) {
    if (!projects.length) return '';

    return projects
        .map(renderProjectCard)
        .join('\n');
}

function renderProjectEmptyState(projects) {
    const hiddenClass = projects.length
        ? ' hidden'
        : '';

    return `
<div class="freecat-project-empty-state${hiddenClass}" data-project-empty>
    <h2 data-project-empty-title>暂无项目</h2>
    <p data-project-empty-description>当前分类的内容正在整理中。</p>
</div>`;
}

function renderMetaInformation(project) {
    return `
<div class="freecat-project-meta-grid">
    <div>
        <span>项目时间</span>
        <strong>${formatDate(project.date)}</strong>
    </div>

    <div>
        <span>项目地点</span>
        <strong>${escapeHtml(project.location || '未填写')}</strong>
    </div>

    <div>
        <span>承担角色</span>
        <strong>${escapeHtml(project.role || '未填写')}</strong>
    </div>

    <div>
        <span>最后更新</span>
        <strong>${formatDate(project.updated || project.date)}</strong>
    </div>
</div>`;
}

function renderRelatedValues(values, fallback) {
    const normalized = (Array.isArray(values) ? values : [])
        .map((value) => normalizeConfigValue(value).trim())
        .filter(Boolean);

    if (!normalized.length) {
        return `<p>${escapeHtml(fallback)}</p>`;
    }

    return `
<ul>
    ${normalized
        .map((value) => `<li>${escapeHtml(value)}</li>`)
        .join('\n')}
</ul>`;
}

function renderRelatedVideos(values, fallback) {
    const normalized = (Array.isArray(values) ? values : [])
        .map((value) => normalizeConfigValue(value).trim())
        .filter(Boolean);

    if (!normalized.length) {
        return `<p>${escapeHtml(fallback)}</p>`;
    }

    return `
<ul>
    ${normalized
        .map((videoId) => {
            const href =
                `/videos/${encodeURIComponent(videoId)}/`;

            return `
<li>
    <a href="${href}">
        ${escapeHtml(videoId)}
    </a>
</li>`;
        })
        .join('\n')}
</ul>`;
}

function renderRelatedImages(values, fallback) {
    const normalized = (Array.isArray(values) ? values : [])
        .map((value) => normalizeConfigValue(value).trim())
        .filter(Boolean);

    if (!normalized.length) {
        return `<p>${escapeHtml(fallback)}</p>`;
    }

    return `
<ul>
    ${normalized
        .map((imageId) => {
            const href =
                `/gallery/${encodeURIComponent(imageId)}/`;

            return `
<li>
    <a href="${href}">
        ${escapeHtml(imageId)}
    </a>
</li>`;
        })
        .join('\n')}
</ul>`;
}

function buildProjectDetailPage({
    template,
    partials,
    sharedStyle,
    projectStyle,
    project,
    site,
    siteProperties
}) {
    const siteName =
        normalizeConfigValue(site.site_name).trim() ||
        normalizeConfigValue(site.site_title).trim() ||
        'Freecat Blog';

    const siteLanguage =
        normalizeConfigValue(
            siteProperties.site_language
        ).trim() ||
        'zh-CN';

    const siteUrl = normalizeSiteUrl(
        siteProperties.site_url
    );

    const projectUrl = siteUrl
        ? `${siteUrl}/projects/${encodeURIComponent(project.id)}/`
        : '';

    const title = `${project.title} - ${siteName}`;

    const description =
        project.summary ||
        `${project.title} 项目记录`;

    const tocHtml = renderToc(
        buildHeadingTree(project.headings || []),
        { innerOnly: true }
    );

    return renderTemplateWithPartials(template, partials)
        .replace(
            '<!-- PROJECTS_SHARED_STYLE -->',
            sharedStyle
        )
        .replace(
            '<!-- PROJECT_STYLE -->',
            projectStyle
        )
        .replaceAll(
            '<!-- SITE_LANGUAGE -->',
            escapeHtml(siteLanguage)
        )
        .replaceAll(
            '<!-- PROJECT_PAGE_TITLE -->',
            escapeHtml(title)
        )
        .replaceAll(
            '<!-- PROJECT_PAGE_DESCRIPTION -->',
            escapeHtml(description)
        )
        .replaceAll(
            '<!-- PROJECT_CANONICAL_URL -->',
            escapeHtml(projectUrl)
        )
        .replaceAll(
            '<!-- PROJECT_COVER -->',
            project.cover
                ? `<img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)}" loading="eager" decoding="async">`
                : ''
        )
        .replaceAll(
            '<!-- PROJECT_CATEGORY -->',
            renderCategoryBadge(project)
        )
        .replaceAll(
            '<!-- PROJECT_STATUS -->',
            renderStatusBadge(project)
        )
        .replaceAll(
            '<!-- PROJECT_FEATURED -->',
            renderFeaturedBadge(project)
        )
        .replaceAll(
            '<!-- PROJECT_TITLE -->',
            escapeHtml(project.title)
        )
        .replaceAll(
            '<!-- PROJECT_SUMMARY -->',
            escapeHtml(project.summary)
        )
        .replaceAll(
            '<!-- PROJECT_META -->',
            renderMetaInformation(project)
        )
        .replaceAll(
            '<!-- PROJECT_CONTENT -->',
            project.html
        )
        .replaceAll(
            '<!-- PROJECT_TOC -->',
            tocHtml
        )
        .replaceAll(
            '<!-- PROJECT_RELATED_ARTICLES -->',
            renderRelatedValues(
                project.relatedArticles,
                '暂未关联文章。'
            )
        )
        .replaceAll(
            '<!-- PROJECT_RELATED_VIDEOS -->',
            renderRelatedVideos(
                project.relatedVideos,
                '暂未关联视频。'
            )
        )
        .replaceAll(
            '<!-- PROJECT_RELATED_IMAGES -->',
            renderRelatedImages(
                project.relatedImages,
                '暂未关联图片。'
            )
        )
        .replaceAll(
            '<!-- PROJECT_RELATED_PROJECTS -->',
            renderRelatedValues(
                project.relatedProjects,
                '暂未关联其他项目。'
            )
        );
}

function buildProjectListPage({
    template,
    partials,
    sharedStyle,
    projectsStyle,
    projects,
    site,
    siteProperties
}) {
    const siteName =
        normalizeConfigValue(site.site_name).trim() ||
        normalizeConfigValue(site.site_title).trim() ||
        'Freecat Blog';

    const siteLanguage =
        normalizeConfigValue(
            siteProperties.site_language
        ).trim() ||
        'zh-CN';

    const siteUrl = normalizeSiteUrl(
        siteProperties.site_url
    );

    const canonicalUrl = siteUrl
        ? `${siteUrl}/projects`
        : '';

    return renderTemplateWithPartials(template, partials)
        .replace(
            '<!-- PROJECTS_SHARED_STYLE -->',
            sharedStyle
        )
        .replace(
            '<!-- PROJECTS_STYLE -->',
            projectsStyle
        )
        .replaceAll(
            '<!-- SITE_LANGUAGE -->',
            escapeHtml(siteLanguage)
        )
        .replaceAll(
            '<!-- PROJECTS_PAGE_TITLE -->',
            escapeHtml(`项目与解决方案 - ${siteName}`)
        )
        .replaceAll(
            '<!-- PROJECTS_PAGE_DESCRIPTION -->',
            escapeHtml(
                '记录我主导和协作参与的项目，以及在实践中整理形成的解决方案。'
            )
        )
        .replaceAll(
            '<!-- PROJECTS_CANONICAL_URL -->',
            escapeHtml(canonicalUrl)
        )
        .replaceAll(
            '<!-- PROJECT_CARDS -->',
            renderProjectCards(projects)
        )
        .replaceAll(
            '<!-- PROJECT_EMPTY_STATE -->',
            renderProjectEmptyState(projects)
        );
}

function generateProjectPages({
    projectsDir,
    outputDir,
    projectsTemplate,
    projectTemplate,
    partials,
    site,
    siteProperties
}) {
    const projects = loadProjects(projectsDir);
    const projectOutputDir = path.join(
        outputDir,
        'projects'
    );

    const sharedStyle = readText(
        path.join(
            __dirname,
            'styles',
            'projects-shared.css'
        )
    );

    const projectsStyle = readText(
        path.join(
            __dirname,
            'styles',
            'projects-list.css'
        )
    );

    const projectStyle = readText(
        path.join(
            __dirname,
            'styles',
            'project-detail.css'
        )
    );

    ensureDir(projectOutputDir);

    const listPage = buildProjectListPage({
        template: projectsTemplate,
        partials,
        sharedStyle,
        projectsStyle,
        projects,
        site,
        siteProperties
    });

    writeText(
        path.join(projectOutputDir, 'index.html'),
        listPage
    );

    projects.forEach((project) => {
        const detailPage = buildProjectDetailPage({
            template: projectTemplate,
            partials,
            sharedStyle,
            projectStyle,
            project,
            site,
            siteProperties
        });

        const detailDir = path.join(
            projectOutputDir,
            project.id
        );

        ensureDir(detailDir);

        writeText(
            path.join(detailDir, 'index.html'),
            detailPage
        );
    });

    return projects;
}

module.exports = {
    loadProjects,
    generateProjectPages
};
