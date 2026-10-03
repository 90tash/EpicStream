const omdbCache = new Map();

/**
 * Fetches ratings and metadata from OMDb API via our proxy
 * @param {Object} options
 * @param {string} [options.imdbId] - IMDb ID (e.g. "tt0111161")
 * @param {string} [options.title] - Title as fallback if IMDb ID isn't available
 * @param {string} [options.year] - Release year
 * @param {string} [options.type] - "movie" or "series"
 * @returns {Promise<{
 *   imdbRating: string | null,
 *   rottenTomatoes: string | null,
 *   metacritic: string | null,
 *   poster: string | null
 * }>}
 */
export const getOmdbDetails = async ({ imdbId, title, year, type = "movie" } = {}) => {
    const cacheKey = imdbId || `${title}_${year || ""}_${type}`;
    if (omdbCache.has(cacheKey)) {
        return omdbCache.get(cacheKey);
    }

    try {
        const params = new URLSearchParams();
        if (imdbId) {
            params.set("i", imdbId);
        } else if (title) {
            params.set("t", title);
            if (year) params.set("y", year);
            if (type) params.set("type", type === "tv" ? "series" : type);
        } else {
            return null;
        }

        const res = await fetch(`/api/omdb?${params.toString()}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (data.Response === "False") return null;

        // Parse ratings
        let rottenTomatoes = null;
        let metacritic = data.Metascore && data.Metascore !== "N/A" ? data.Metascore : null;
        let imdbRating = data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : null;

        if (Array.isArray(data.Ratings)) {
            const rt = data.Ratings.find(r => r.Source === "Rotten Tomatoes");
            if (rt && rt.Value) {
                rottenTomatoes = rt.Value;
            }
            const mc = data.Ratings.find(r => r.Source === "Metacritic");
            if (mc && mc.Value) {
                metacritic = mc.Value.split("/")[0].trim();
            }
        }

        const poster = data.Poster && data.Poster !== "N/A" ? data.Poster : null;
        const awards = data.Awards && data.Awards !== "N/A" ? data.Awards : null;
        const boxOffice = data.BoxOffice && data.BoxOffice !== "N/A" ? data.BoxOffice : null;
        const imdbVotes = data.imdbVotes && data.imdbVotes !== "N/A" ? data.imdbVotes : null;

        const result = {
            imdbRating,
            imdbVotes,
            rottenTomatoes,
            metacritic,
            poster,
            boxOffice,
            BoxOffice: boxOffice,
            awards,
            Awards: awards
        };

        omdbCache.set(cacheKey, result);
        return result;
    } catch (err) {
        console.warn("Failed to fetch OMDb details:", err);
        return null;
    }
};
