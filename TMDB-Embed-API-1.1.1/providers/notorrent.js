const axios = require('axios');
const { getTmdbApiKey } = require('../utils/tmdbKey');

const NOTORRENT_API = 'https://addon-osvh.onrender.com';

function cleanText(str) {
    if (!str) return '';
    return str.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim();
}

function extractQuality(titleText) {
    const raw = titleText || '';
    const match = raw.match(/(\d{3,4}p)/);
    if (match) return match[0];
    if (raw.toUpperCase().includes('FREE')) return 'Auto';
    return 'Unknown';
}

async function getNotorrentStreams(tmdbId, mediaType = 'movie', seasonNum = null, episodeNum = null) {
    console.log(`[NoTorrent] Searching for ${mediaType} ${tmdbId}`);

    const tmdbKey = getTmdbApiKey();
    if (!tmdbKey) {
        console.error('[NoTorrent] No TMDB API key configured.');
        return [];
    }

    // Step 1: TMDB → IMDB ID
    let imdbId;
    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const { data } = await axios.get(
            `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${tmdbKey}&append_to_response=external_ids`,
            { timeout: 8000 }
        );
        imdbId = (data.external_ids && data.external_ids.imdb_id) || null;
    } catch (err) {
        console.error(`[NoTorrent] TMDB lookup failed: ${err.message}`);
        return [];
    }

    if (!imdbId) {
        console.warn('[NoTorrent] Failed to map IMDB ID from TMDB.');
        return [];
    }

    // Step 2: Fetch streams from NoTorrent Stremio addon API
    const apiUrl = (mediaType === 'tv' && seasonNum != null)
        ? `${NOTORRENT_API}/stream/series/${imdbId}:${seasonNum}:${episodeNum}.json`
        : `${NOTORRENT_API}/stream/movie/${imdbId}.json`;

    try {
        const { data } = await axios.get(apiUrl, { timeout: 20000 });
        const rawList = data.streams || [];
        const streams = [];

        for (const item of rawList) {
            if (item.externalUrl || !item.url) continue;
            if (item.url.includes('github.com') || item.url.includes('googleusercontent')) continue;

            const cleanTitleStr = cleanText(item.title || '');
            const quality = extractQuality(cleanTitleStr);

            let language = 'Default';
            const langMatch = cleanTitleStr.match(/\(([^)]+)\)/);
            if (langMatch) {
                language = langMatch[1].charAt(0).toUpperCase() + langMatch[1].slice(1).toLowerCase();
            }

            const proxyHeaders = (item.behaviorHints?.proxyHeaders?.request) || {};
            const headers = { ...(item.behaviorHints?.headers || {}), ...proxyHeaders };

            const nameParts = ['NoTorrent', language !== 'Default' ? language : ''].filter(p => p.trim() !== '');
            streams.push({
                name: nameParts.join(' \u2022 '),
                title: quality,
                url: item.url,
                quality,
                provider: 'NoTorrent',
                headers: Object.keys(headers).length > 0 ? headers : undefined
            });
        }

        console.log(`[NoTorrent] Total results found: ${streams.length}`);
        return streams;
    } catch (err) {
        console.error(`[NoTorrent] Fetch failed: ${err.message}`);
        return [];
    }
}

module.exports = { getNotorrentStreams };
