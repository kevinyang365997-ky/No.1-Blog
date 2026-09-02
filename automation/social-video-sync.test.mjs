import test from 'node:test';
import assert from 'node:assert/strict';
import { matchTikTokVideo, normalizeTitle, titleSimilarity } from './social-video-sync.mjs';

test('normalizes hashtags and punctuation', () => {
    assert.equal(normalizeTitle('Manual THT insertion! #SMT'), 'manual tht insertion');
});

test('matches the corresponding TikTok video by title and time', () => {
    const douyin = { title: 'Manual THT insertion automation', create_time: 1000 };
    const videos = [
        { id: 'wrong', title: 'Unrelated machine', create_time: 1000 },
        { id: 'right', title: 'Manual THT insertion', create_time: 1200 }
    ];
    assert.equal(matchTikTokVideo(douyin, videos, { matchMaxHours: 1, titleSimilarity: 0.4 }).id, 'right');
    assert.ok(titleSimilarity(douyin.title, videos[1].title) >= 0.4);
});
