const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_SOURCES = [
    { directory: 'writing', type: 'Article', intent: 'informational' },
    { directory: 'videos', type: 'Video', intent: 'commercial investigation' },
    { directory: 'gallery', type: 'Gallery', intent: 'commercial investigation' },
    { directory: 'projects', type: 'Project', intent: 'commercial investigation' }
];

function plainText(value) {
    return String(value || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[#>*_`~\[\]()!-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function truncate(value, length) {
    const text = plainText(value);
    if (text.length <= length) return text;
    return `${text.slice(0, Math.max(0, length - 1)).trim()}…`;
}

function slugify(value) {
    return String(value || '')
        .normalize('NFKD')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 75)
        .replace(/-+$/g, '');
}

function normalizeList(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    if (!value) return [];
    return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

function inferPrimaryKeyword(data, title, source) {
    if (data.seo_primary_keyword) return String(data.seo_primary_keyword).trim();
    const tags = normalizeList(data.tags || data.tag);
    const model = title.match(/\b(?:S|SO|BF|MBF|RTF|STF|VTF|SSPC|SYTSS|GDLJ|YDLJ)[- ]?[A-Z0-9]+\b/i);
    if (model) return model[0].replace(/\s+/g, '-').toUpperCase();
    if (tags.length) return tags[0];
    const category = String(data.category || '').trim();
    if (category) return category;
    return source.type === 'Article' ? 'electronics manufacturing' : 'SMT automation equipment';
}

function inferDescription(data, content, title) {
    const configured = data.seo_meta_description || data.description || data.summary;
    if (configured) return truncate(configured, 160);
    const source = plainText(content).replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '');
    const seed = source || title;
    return truncate(seed, 155);
}

function inferSeoTitle(data, title) {
    return truncate(data.seo_title || title, 60);
}

function listMarkdownFiles(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return listMarkdownFiles(fullPath);
        return /\.(md|markdown)$/i.test(entry.name) ? [fullPath] : [];
    });
}

function auditFile(rootDir, source, filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data || {};
    if (data.show === false || /模板/.test(path.basename(filePath))) return null;

    const fallbackTitle = path.parse(filePath).name;
    const title = String(data.title || fallbackTitle).trim();
    const existingSlug = String(data.id || data.slug || slugify(fallbackTitle)).trim();
    const seoTitle = inferSeoTitle(data, title);
    const suggestedSlug = slugify(data.seo_slug || existingSlug || title);
    const primaryKeyword = inferPrimaryKeyword(data, title, source);
    const secondaryKeywords = normalizeList(data.seo_secondary_keywords || data.tags || data.tag)
        .filter(keyword => keyword.toLowerCase() !== primaryKeyword.toLowerCase())
        .slice(0, 6);
    const metaDescription = inferDescription(data, parsed.content, title);
    const searchIntent = String(data.seo_search_intent || source.intent).trim().toLowerCase();
    const issues = [];
    let score = 100;

    if (seoTitle.length < 30 || seoTitle.length > 60) {
        issues.push(`SEO title should usually be 30–60 characters (currently ${seoTitle.length}).`);
        score -= 15;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suggestedSlug) || suggestedSlug.length > 75) {
        issues.push('Slug should use concise lowercase English words separated by hyphens.');
        score -= 15;
    }
    if (!primaryKeyword) {
        issues.push('Add one clear primary keyword.');
        score -= 20;
    } else {
        const searchable = `${seoTitle} ${metaDescription} ${plainText(parsed.content).slice(0, 500)}`.toLowerCase();
        if (!searchable.includes(primaryKeyword.toLowerCase())) {
            issues.push('Use the primary keyword naturally in the title, description or opening paragraph.');
            score -= 15;
        }
    }
    if (metaDescription.length < 110 || metaDescription.length > 160) {
        issues.push(`Meta description should usually be 110–160 characters (currently ${metaDescription.length}).`);
        score -= 15;
    }
    if (!['informational', 'commercial investigation', 'transactional', 'navigational'].includes(searchIntent)) {
        issues.push('Search intent should be informational, commercial investigation, transactional or navigational.');
        score -= 10;
    }
    if (!data.seo_title) issues.push('Optional: add seo_title to control the search-result title independently.');
    if (!data.seo_meta_description) issues.push('Optional: add seo_meta_description for a deliberate search snippet.');

    return {
        type: source.type,
        file: path.relative(rootDir, filePath).replace(/\\/g, '/'),
        score: Math.max(0, score),
        seoTitle,
        suggestedSlug,
        primaryKeyword,
        secondaryKeywords,
        metaDescription,
        searchIntent,
        issues
    };
}

function htmlEscape(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function renderHtml(report) {
    const cards = report.items.map(item => `
        <article class="card">
            <header><span class="score score-${item.score >= 80 ? 'good' : item.score >= 60 ? 'warn' : 'bad'}">${item.score}</span><div><strong>${htmlEscape(item.seoTitle)}</strong><small>${htmlEscape(item.type)} · ${htmlEscape(item.file)}</small></div></header>
            <dl>
                <dt>SEO Title</dt><dd>${htmlEscape(item.seoTitle)}</dd>
                <dt>Suggested Slug</dt><dd>${htmlEscape(item.suggestedSlug)}</dd>
                <dt>Primary Keyword</dt><dd>${htmlEscape(item.primaryKeyword)}</dd>
                <dt>Secondary Keywords</dt><dd>${htmlEscape(item.secondaryKeywords.join(', ') || '—')}</dd>
                <dt>Meta Description</dt><dd>${htmlEscape(item.metaDescription)}</dd>
                <dt>Search Intent</dt><dd>${htmlEscape(item.searchIntent)}</dd>
            </dl>
            <ul>${item.issues.map(issue => `<li>${htmlEscape(issue)}</li>`).join('')}</ul>
        </article>`).join('');

    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blog Owner SEO Report</title><style>
        :root{color-scheme:light dark;font-family:Inter,"Segoe UI",sans-serif}body{margin:0;background:#f4f7fb;color:#172033}main{max-width:1180px;margin:auto;padding:40px 24px}h1{margin:0 0 8px}.summary{color:#64748b;margin-bottom:28px}.grid{display:grid;gap:20px}.card{background:#fff;border:1px solid #dbe3ef;border-radius:16px;padding:22px;box-shadow:0 8px 30px #1e293b0d}.card header{display:flex;gap:14px;align-items:center;margin-bottom:18px}.card header div{display:grid;gap:4px}.card small{color:#64748b}.score{display:grid;place-items:center;min-width:48px;height:48px;border-radius:50%;font-weight:800}.score-good{background:#dcfce7;color:#166534}.score-warn{background:#fef3c7;color:#92400e}.score-bad{background:#fee2e2;color:#991b1b}dl{display:grid;grid-template-columns:180px 1fr;margin:0;border-top:1px solid #e2e8f0}dt,dd{padding:10px 0;border-bottom:1px solid #e2e8f0}dt{font-weight:700}dd{margin:0;word-break:break-word}ul{margin:16px 0 0;color:#9a3412}@media(max-width:700px){dl{grid-template-columns:1fr}dt{border-bottom:0;padding-bottom:2px}dd{padding-top:0}}
        @media(prefers-color-scheme:dark){body{background:#0f172a;color:#e2e8f0}.card{background:#172033;border-color:#334155}.summary,small{color:#94a3b8!important}dt,dd,dl{border-color:#334155}ul{color:#fdba74}}
    </style></head><body><main><h1>Blog Owner SEO Report</h1><p class="summary">Generated ${htmlEscape(report.generatedAt)} · ${report.summary.total} items · average score ${report.summary.averageScore} · ${report.summary.needsAttention} need attention. This report is local-only and is never copied to the public blog.</p><section class="grid">${cards}</section></main></body></html>`;
}

function runOwnerSeoAudit({ rootDir, reportDir, quiet = false }) {
    const items = CONTENT_SOURCES.flatMap(source => {
        const directory = path.join(rootDir, source.directory);
        return listMarkdownFiles(directory)
            .map(filePath => auditFile(rootDir, source, filePath))
            .filter(Boolean);
    }).sort((a, b) => a.score - b.score || a.file.localeCompare(b.file));

    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    const report = {
        generatedAt: new Date().toISOString(),
        summary: {
            total: items.length,
            averageScore: items.length ? Math.round(totalScore / items.length) : 0,
            needsAttention: items.filter(item => item.score < 80).length
        },
        items
    };

    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(path.join(reportDir, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');
    fs.writeFileSync(path.join(reportDir, 'latest.html'), renderHtml(report), 'utf8');

    if (!quiet) {
        console.log(`🔎 Owner SEO audit: ${report.summary.total} items, average ${report.summary.averageScore}/100, ${report.summary.needsAttention} need attention.`);
        console.log(`   Private report: ${path.join(reportDir, 'latest.html')}`);
    }
    return report;
}

module.exports = { runOwnerSeoAudit };
