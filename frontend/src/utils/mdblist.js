const mdbListCache = new Map();

/**
 * Fetches ratings and metadata from MDBList API via proxy
 * @param {Object} options
 * @param {string} [options.imdbId] - IMDb ID (e.g. "tt0111161")
 * @param {string} [options.title] - Title as fallback search
 * @param {string} [options.year] - Release year
 * @param {string} [options.type] - "movie" or "show"
 * @returns {Promise<{
 *   letterboxd: string | null,
 *   trakt: string | null,
 *   imdb: string | null,
 *   tomatoes: string | null,
 *   tomatoesAudience: string | null,
 *   metacritic: string | null,
 *   score: number | null,
 *   streams: Array<{ id: number, name: string }>,
 *   poster: string | null,
 *   backdrop: string | null
 * }>}
 */
export const getMdbListDetails = async ({ imdbId, title, year, type = "movie" } = {}) => {
    const cacheKey = imdbId || `${title}_${year || ""}_${type}`;
    if (mdbListCache.has(cacheKey)) {
        return mdbListCache.get(cacheKey);
    }

    try {
        let endpoint = `/api/mdblist?`;
        if (imdbId) {
            endpoint += `i=${encodeURIComponent(imdbId)}`;
        } else if (title) {
            endpoint += `s=${encodeURIComponent(title)}`;
            if (year) endpoint += `&y=${encodeURIComponent(year)}`;
            endpoint += `&m=${type === "tv" ? "show" : "movie"}`;
        } else {
            return null;
        }

        const res = await fetch(endpoint);
        if (!res.ok) return null;

        const data = await res.json();
        let item = data;

        // If queried via search 's', result is in data.search array
        if (data.search && Array.isArray(data.search)) {
            if (data.search.length === 0) return null;
            const first = data.search[0];
            if (first.imdbid) {
                // Fetch full details by imdbid
                const fullRes = await fetch(`/api/mdblist?i=${encodeURIComponent(first.imdbid)}`);
                if (fullRes.ok) {
                    item = await fullRes.json();
                } else {
                    item = first;
                }
            } else {
                item = first;
            }
        }

        if (!item || item.response === false) return null;

        // Extract ratings
        let letterboxd = null;
        let trakt = null;
        let imdb = null;
        let tomatoes = null;
        let tomatoesAudience = null;
        let metacritic = null;

        if (Array.isArray(item.ratings)) {
            const lb = item.ratings.find(r => r.source === "letterboxd");
            if (lb && lb.value !== null && lb.value !== undefined) {
                letterboxd = typeof lb.value === "number" ? lb.value.toFixed(1) : String(lb.value);
            }

            const tr = item.ratings.find(r => r.source === "trakt");
            if (tr && tr.value !== null && tr.value !== undefined) {
                trakt = `${tr.value}%`;
            }

            const im = item.ratings.find(r => r.source === "imdb");
            if (im && im.value !== null && im.value !== undefined) {
                imdb = typeof im.value === "number" ? im.value.toFixed(1) : String(im.value);
            }

            const rt = item.ratings.find(r => r.source === "tomatoes");
            if (rt && rt.value !== null && rt.value !== undefined) {
                tomatoes = `${rt.value}%`;
            }

            const rta = item.ratings.find(r => r.source === "tomatoesaudience");
            if (rta && rta.value !== null && rta.value !== undefined) {
                tomatoesAudience = `${rta.value}%`;
            }

            const mc = item.ratings.find(r => r.source === "metacritic");
            if (mc && mc.value !== null && mc.value !== undefined) {
                metacritic = String(mc.value);
            }
        }

        const result = {
            letterboxd,
            trakt,
            imdb,
            tomatoes,
            tomatoesAudience,
            metacritic,
            score: typeof item.score === "number" ? item.score : null,
            streams: Array.isArray(item.streams) ? item.streams : [],
            poster: item.poster || null,
            backdrop: item.backdrop || null,
            certification: item.certification || null
        };

        mdbListCache.set(cacheKey, result);
        return result;
    } catch (err) {
        console.warn("Failed to fetch MDBList details:", err);
        return null;
    }
};
