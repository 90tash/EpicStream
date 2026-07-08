const axios = require('axios');

const VIDLINK_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Referer': 'https://vidlink.pro'
};

async function getVidlinkStreams(tmdbId, mediaType = 'movie', seasonNum = null, episodeNum = null) {
    console.log(`[Vidlink] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}`);

    try {
        // Step 1: Encrypt the TMDB ID via enc-dec.app
        const encRes = await axios.get(
            `https://enc-dec.app/api/enc-vidlink?text=${encodeURIComponent(String(tmdbId))}`,
            { timeout: 8000 }
        );
        const encodedTmdb = encRes.data && encRes.data.result;
        if (!encodedTmdb) {
            console.log('[Vidlink] Encryption step returned no result.');
            return [];
        }

        // Step 2: Fetch stream playlist from Vidlink API
        const apiUrl = mediaType === 'tv'
            ? `https://vidlink.pro/api/b/tv/${encodedTmdb}/${seasonNum}/${episodeNum}?multiLang=0`
            : `https://vidlink.pro/api/b/movie/${encodedTmdb}?multiLang=0`;

        const apiRes = await axios.get(apiUrl, { headers: VIDLINK_HEADERS, timeout: 8000 });

        const playlist = apiRes.data && apiRes.data.stream && apiRes.data.stream.playlist;
        if (!playlist) {
            console.log('[Vidlink] No playlist URL in response.');
            return [];
        }

        console.log(`[Vidlink] Got stream.`);
        return [{
            name: 'Vidlink',
            title: 'Vidlink',
            url: playlist,
            quality: 'Auto',
            provider: 'Vidlink',
            headers: { 'Referer': 'https://vidlink.pro' }
        }];
    } catch (err) {
        console.error(`[Vidlink] Error: ${err.message}`);
        return [];
    }
}

module.exports = { getVidlinkStreams };
