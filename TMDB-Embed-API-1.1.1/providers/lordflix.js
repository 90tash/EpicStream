const axios = require('axios');
const { getTmdbApiKey } = require('../utils/tmdbKey');

const LORDFLIX_HEADERS = {
    'Accept': '*/*',
    'Origin': 'https://lordflix.org',
    'Referer': 'https://lordflix.org/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
};

const LORDFLIX_API = 'https://snowhouse.lordflix.club';
const MULTI_DECRYPT_API = 'https://enc-dec.app/api';
const SERVERS = ['Berlin', 'Marseille', 'Backrooms', 'Phoenix', 'Oslo', 'Luna', 'Sakura', 'Rio', 'Ativa', 'Moscow'];

// Matches the reference project's encodeQuote: encodeURIComponent with + encoded as %20
function encodeQuote(str) {
    return encodeURIComponent(str).replace(/%20/g, '+').replace(/\+/g, '%20');
}

async function getLordflixStreams(tmdbId, mediaType = 'movie', seasonNum = null, episodeNum = null) {
    console.log(`[Lordflix] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}`);

    const tmdbKey = getTmdbApiKey();
    if (!tmdbKey) {
        console.error('[Lordflix] No TMDB API key configured.');
        return [];
    }

    // Step 1: TMDB lookup for title, year, imdbId
    let info;
    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const { data } = await axios.get(
            `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${tmdbKey}&append_to_response=external_ids`,
            { timeout: 8000 }
        );
        info = {
            title: data.title || data.name || '',
            year: (data.release_date || data.first_air_date || '').split('-')[0],
            imdbId: (data.external_ids && data.external_ids.imdb_id) || ''
        };
    } catch (err) {
        console.error(`[Lordflix] TMDB lookup failed: ${err.message}`);
        return [];
    }

    if (!info.title || !info.imdbId) {
        console.error('[Lordflix] Missing title or IMDb ID from TMDB.');
        return [];
    }

    const typeParam = mediaType === 'tv' ? 'series' : 'movie';
    const titleEnc = encodeQuote(info.title);
    const streams = [];

    // Step 2: Query each server in parallel
    await Promise.all(SERVERS.map(async (server) => {
        try {
            let serverUrl = `${LORDFLIX_API}/?title=${titleEnc}&type=${typeParam}&year=${info.year || ''}`
                + `&imdb=${info.imdbId}&tmdb=${tmdbId}&server=${server}`;
            if (mediaType === 'tv') {
                serverUrl += `&season=${seasonNum}&episode=${episodeNum}`;
            }

            // Step 3: Get signed proxy URL from enc-dec.app
            const encBridgeRes = await axios.get(
                `${MULTI_DECRYPT_API}/enc-lordflix?url=${encodeQuote(serverUrl)}`,
                { timeout: 8000 }
            );
            const encBridgeJson = encBridgeRes.data;
            if (!encBridgeJson || encBridgeJson.status !== 200 || !encBridgeJson.result) return;

            const { url: proxyEncUrl, sign: signature } = encBridgeJson.result;
            if (!proxyEncUrl || !signature) return;

            // Step 4: Fetch encrypted stream data from proxy URL
            const remoteEncRes = await axios.get(proxyEncUrl, {
                headers: LORDFLIX_HEADERS,
                timeout: 8000,
                responseType: 'text'
            });
            const remoteEncData = typeof remoteEncRes.data === 'string'
                ? remoteEncRes.data
                : JSON.stringify(remoteEncRes.data);

            // Step 5: Decrypt via enc-dec.app
            const decRes = await axios.post(`${MULTI_DECRYPT_API}/dec-lordflix`,
                { text: remoteEncData, sign: signature },
                { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
            );
            const finalJson = decRes.data;
            if (!finalJson || finalJson.status !== 200 || !finalJson.result || finalJson.result.error) return;

            const streamList = finalJson.result.stream;
            if (!Array.isArray(streamList) || streamList.length === 0) return;

            const topStream = streamList[0];
            if (topStream.type === 'hls' && topStream.playlist) {
                streams.push({
                    name: `Lordflix[${server}]`,
                    title: `Lordflix[${server}]`,
                    url: topStream.playlist,
                    quality: 'Auto',
                    provider: 'Lordflix',
                    headers: LORDFLIX_HEADERS
                });
                console.log(`[Lordflix] Server ${server}: got stream.`);
            }
        } catch (err) {
            console.error(`[Lordflix] Server ${server} error: ${err.message}`);
        }
    }));

    console.log(`[Lordflix] Total streams: ${streams.length}`);
    return streams;
}

module.exports = { getLordflixStreams };
