const axios = require('axios');
const { getTmdbApiKey } = require('../utils/tmdbKey');

const VIDEASY_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://player.videasy.net',
    'Referer': 'https://player.videasy.net/'
};

// Each server maps a name to its API URL. moviesOnly:true skips TV requests.
const SERVERS = {
    'Neon':   { url: 'https://api.videasy.net/myflixerzupcloud/sources-with-title' },
    'Yoru':   { url: 'https://api.videasy.net/cdn/sources-with-title', moviesOnly: true },
    'Cypher': { url: 'https://api.videasy.net/moviebox/sources-with-title' },
    'Reyna':  { url: 'https://api.videasy.net/primewire/sources-with-title' },
    'Omen':   { url: 'https://api.videasy.net/onionplay/sources-with-title' },
    'Breach': { url: 'https://api.videasy.net/m4uhd/sources-with-title' },
    'Ghost':  { url: 'https://api.videasy.net/primesrcme/sources-with-title' },
    'Sage':   { url: 'https://api.videasy.net/1movies/sources-with-title' },
    'Vyse':   { url: 'https://api.videasy.net/hdmovie/sources-with-title' },
    'Raze':   { url: 'https://api.videasy.net/superflix/sources-with-title' }
};

const DECRYPT_URL = 'https://enc-dec.app/api/dec-videasy';

async function getVideasyStreams(tmdbId, mediaType = 'movie', seasonNum = null, episodeNum = null) {
    console.log(`[Videasy] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}`);

    const tmdbKey = getTmdbApiKey();
    if (!tmdbKey) {
        console.error('[Videasy] No TMDB API key configured.');
        return [];
    }

    // Step 1: Resolve title/year/imdbId from TMDB
    let details;
    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const { data } = await axios.get(
            `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${tmdbKey}&append_to_response=external_ids`,
            { timeout: 8000 }
        );
        details = {
            title: data.title || data.name || '',
            year: (data.release_date || data.first_air_date || '').split('-')[0],
            imdbId: (data.external_ids && data.external_ids.imdb_id) || '',
            type
        };
    } catch (err) {
        console.error(`[Videasy] TMDB lookup failed: ${err.message}`);
        return [];
    }

    if (!details.title) {
        console.error('[Videasy] No title returned from TMDB.');
        return [];
    }

    const allStreams = [];
    const seen = new Set();

    // Step 2: Query each server in parallel
    await Promise.all(Object.entries(SERVERS).map(async ([name, server]) => {
        if (server.moviesOnly && mediaType === 'tv') return;

        let apiUrl = `${server.url}?title=${encodeURIComponent(details.title)}`
            + `&mediaType=${details.type}&year=${details.year}`
            + `&tmdbId=${tmdbId}&imdbId=${details.imdbId || ''}`;
        if (mediaType === 'tv') apiUrl += `&seasonId=${seasonNum}&episodeId=${episodeNum}`;

        try {
            const encRes = await axios.get(apiUrl, {
                headers: VIDEASY_HEADERS,
                timeout: 8000,
                responseType: 'text'
            });

            const encryptedText = typeof encRes.data === 'string' ? encRes.data : JSON.stringify(encRes.data);
            if (!encryptedText || encryptedText.length < 20 || encryptedText.startsWith('<')) return;

            // Step 3: Decrypt via enc-dec.app
            const decRes = await axios.post(DECRYPT_URL,
                { text: encryptedText, id: String(tmdbId) },
                { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
            );

            const resData = (decRes.data && decRes.data.result) || decRes.data;
            if (!resData || !Array.isArray(resData.sources)) return;

            for (const s of resData.sources) {
                if (!s.url || seen.has(s.url)) continue;
                seen.add(s.url);
                allStreams.push({
                    name: `Videasy ${name}`,
                    title: `Videasy ${name} - ${s.quality || 'Auto'}`,
                    url: s.url,
                    quality: s.quality || 'Auto',
                    provider: 'Videasy',
                    headers: {
                        'Referer': 'https://player.videasy.net/',
                        'Origin': 'https://player.videasy.net'
                    }
                });
            }
            console.log(`[Videasy] Server ${name}: ${resData.sources.length} source(s)`);
        } catch {
            // server unreachable or returned no data — skip silently
        }
    }));

    console.log(`[Videasy] Total streams: ${allStreams.length}`);
    return allStreams;
}

module.exports = { getVideasyStreams };
