export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const imageUrl = (path, size = "w500", fallback = "/404.png") => (
    path ? `${IMAGE_BASE_URL}/${size}${path}` : fallback
);

export const tmdbFetch = async (path, params = {}) => {
    const query = new URLSearchParams({
        path,
        ...params,
    });

    const response = await fetch(`/api/tmdb?${query.toString()}`);

    if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status}`);
    }

    return response.json();
};

export const getTitle = (item) => item?.title || item?.name || "Untitled";

export const getYear = (item) => (
    item?.release_date || item?.first_air_date || ""
).slice(0, 4);

export const getMediaType = (item, fallback = "movie") => {
    if (item?.media_type) return item.media_type;
    if (item?.first_air_date || item?.name) return "tv";
    return fallback;
};

export const formatMediaType = (type) => {
    if (type === "tv") return "TV Show";
    if (type === "person") return "Person";
    return "Movie";
};

export const getRating = (item) => (
    typeof item?.vote_average === "number" ? item.vote_average.toFixed(1) : null
);

export const tmdbGetImages = async (type, id) => {
    try {
        const data = await tmdbFetch(`/${type}/${id}/images`, { include_image_language: "en,null" });
        return data;
    } catch (error) {
        console.error("Error fetching images:", error);
        return { logos: [], backdrops: [], posters: [] };
    }
};

export const tmdbGetSeason = async (tvId, seasonNumber) => {
    try {
        const data = await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
        return data;
    } catch (error) {
        console.error(`Error fetching season ${seasonNumber}:`, error);
        return { episodes: [] };
    }
};

export const tmdbGetRecommendations = async (type, id) => {
    try {
        let data = await tmdbFetch(`/${type}/${id}/recommendations`);
        if (!data.results || data.results.length === 0) {
            data = await tmdbFetch(`/${type}/${id}/similar`);
        }
        return data.results || [];
    } catch (error) {
        console.error(`Error fetching recommendations for ${type} ${id}:`, error);
        return [];
    }
};
