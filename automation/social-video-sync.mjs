import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = path.join(ROOT, 'automation', 'social-video-sync.config.json');

function required(name) {
    const value = String(process.env[name] || '').trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export function normalizeTitle(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

export function titleSimilarity(left, right) {
    const a = new Set(normalizeTitle(left).split(' ').filter(Boolean));
    const b = new Set(normalizeTitle(right).split(' ').filter(Boolean));
    if (!a.size || !b.size) return 0;
    let common = 0;
    for (const token of a) if (b.has(token)) common += 1;
    return common / Math.max(a.size, b.size);
}

export function matchTikTokVideo(douyin, tiktokVideos, config) {
    const maxSeconds = Number(config.matchMaxHours || 96) * 3600;
    const threshold = Number(config.titleSimilarity || 0.45);
    return tiktokVideos
        .map((video) => {
            const timeGap = Math.abs(Number(douyin.create_time) - Number(video.create_time));
            const score = titleSimilarity(douyin.title, video.title || video.video_description);
            return { video, timeGap, score };
        })
        .filter((item) => item.timeGap <= maxSeconds && item.score >= threshold)
        .sort((a, b) => b.score - a.score || a.timeGap - b.timeGap)[0]?.video || null;
}

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    if (!response.ok) throw new Error(`${response.status} ${url}: ${text.slice(0, 500)}`);
    const data = JSON.parse(text);
    const platformError = data?.error?.code;
    if (platformError && platformError !== 'ok' && platformError !== 0) {
        throw new Error(`${url}: ${platformError} ${data.error.message || ''}`.trim());
    }
    return data;
}

async function listDouyinVideos(config) {
    const token = required('DOUYIN_ACCESS_TOKEN');
    const openId = required('DOUYIN_OPEN_ID');
    const endpoint = process.env.DOUYIN_VIDEO_LIST_ENDPOINT || config.douyinVideoListEndpoint;
    const videos = [];
    let cursor = 0;
    for (let page = 0; page < Number(config.maxPages || 3); page += 1) {
        const url = new URL(endpoint);
        url.searchParams.set('open_id', openId);
        url.searchParams.set('cursor', String(cursor));
        url.searchParams.set('count', '20');
        const json = await requestJson(url, { headers: { 'access-token': token } });
        const data = json.data || {};
        videos.push(...(data.list || []));
        if (!data.has_more) break;
        cursor = data.cursor;
    }
    return videos.filter((video) => Number(video.video_status || 5) === 5);
}

async function listTikTokVideos(config) {
    const token = required('TIKTOK_ACCESS_TOKEN');
    const fields = 'id,title,video_description,create_time,cover_image_url,share_url,embed_link,duration';
    const videos = [];
    let cursor;
    for (let page = 0; page < Number(config.maxPages || 3); page += 1) {
        const body = { max_count: 20 };
        if (cursor) body.cursor = cursor;
        const json = await requestJson(`https://open.tiktokapis.com/v2/video/list/?fields=${fields}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = json.data || {};
        videos.push(...(data.videos || []));
        if (!data.has_more) break;
        cursor = data.cursor;
    }
    return videos;
}

function safeSlug(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

function yamlString(value) {
    return JSON.stringify(String(value || ''));
}

function formatDuration(seconds) {
    const total = Number(seconds || 0);
    if (!total) return '';
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

async function existingDouyinIds() {
    const dir = path.join(ROOT, 'videos');
    const ids = new Set();
    for (const name of await fs.readdir(dir)) {
        if (!/\.md$/i.test(name)) continue;
        const text = await fs.readFile(path.join(dir, name), 'utf8');
        const match = text.match(/^douyin_video_id:\s*["']?([^\r\n"']+)/m);
        if (match) ids.add(match[1].trim());
    }
    return ids;
}

async function downloadCover(url, filename) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to download TikTok cover: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const dir = path.join(ROOT, 'all', 'image', 'videos', 'synced');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
    return `/image/videos/synced/${filename}`;
}

async function douyinEmbedUrl(video, config) {
    if (!video.item_id || !process.env.DOUYIN_CLIENT_KEY) return '';
    const url = new URL('https://open.douyin.com/api/douyin/v1/video/get_iframe_by_item');
    url.searchParams.set('item_id', video.item_id);
    url.searchParams.set('client_key', process.env.DOUYIN_CLIENT_KEY);
    try {
        const json = await requestJson(url);
        const html = json?.data?.iframe_code || '';
        return html.match(/src=["']([^"']+)/i)?.[1] || '';
    } catch (error) {
        console.warn(`Embed unavailable for ${video.video_id || video.item_id}: ${error.message}`);
        return '';
    }
}

function renderMarkdown(video, tiktok, cover, embedUrl) {
    const videoId = String(video.video_id || video.item_id);
    const title = String(video.title || '抖音视频').trim();
    const date = new Date(Number(video.create_time) * 1000).toISOString().slice(0, 10);
    const slug = `douyin-${safeSlug(videoId) || Date.now()}`;
    const sourceUrl = video.share_url || `https://www.douyin.com/video/${videoId}`;
    const duration = formatDuration(tiktok.duration);
    return {
        filename: `${slug}.md`,
        content: `---\nid: ${slug}\ntitle: ${yamlString(title)}\nplatform: douyin\ncategory: project\ndate: ${date}\nupdated:\nduration: ${yamlString(duration)}\ncreator: ${yamlString('Kevin THT Automation')}\nsource_url: ${yamlString(sourceUrl)}\nembed_url: ${yamlString(embedUrl)}\ncover: ${yamlString(cover)}\nsummary: ${yamlString(title)}\ntags:\n- THT\n- SMT 自动化\n- 抖音\nrelated_projects:\nrelated_articles:\nfeatured: false\nshow: true\ndouyin_video_id: ${yamlString(videoId)}\ntiktok_video_id: ${yamlString(tiktok.id)}\n---\n\n# 视频介绍\n\n${title}\n\n## 视频来源\n\n本视频同步自抖音，封面来自对应的 TikTok 视频。\n`
    };
}

export async function syncVideos() {
    const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'));
    const [douyinVideos, tiktokVideos, known] = await Promise.all([
        listDouyinVideos(config), listTikTokVideos(config), existingDouyinIds()
    ]);
    let created = 0;
    for (const video of douyinVideos.sort((a, b) => Number(a.create_time) - Number(b.create_time))) {
        const videoId = String(video.video_id || video.item_id || '');
        if (!videoId || known.has(videoId)) continue;
        const tiktok = matchTikTokVideo(video, tiktokVideos, config);
        if (!tiktok?.cover_image_url) {
            console.log(`Skipped ${videoId}: no matching TikTok cover.`);
            continue;
        }
        const cover = await downloadCover(tiktok.cover_image_url, `douyin-${safeSlug(videoId)}.jpg`);
        const embedUrl = await douyinEmbedUrl(video, config);
        const output = renderMarkdown(video, tiktok, cover, embedUrl);
        await fs.writeFile(path.join(ROOT, 'videos', output.filename), output.content, { flag: 'wx' });
        known.add(videoId);
        created += 1;
        console.log(`Created videos/${output.filename}`);
    }
    console.log(`Sync complete. Created ${created} video(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    syncVideos().catch((error) => {
        console.error(error.stack || error.message);
        process.exitCode = 1;
    });
}
