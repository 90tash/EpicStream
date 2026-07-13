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
    if (item?.profile_path || item?.known_for_department) return "person";
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

// =========================================================================
// EMBED PLAYER PROVIDER CONFIGURATION
// To switch the main embed provider, uncomment your preferred option below 
// and ensure all others are commented out.
// =========================================================================
export const ACTIVE_PROVIDER = "videasy"; // Option 1: Videasy
// export const ACTIVE_PROVIDER = "vidsrc_to"; // Option 2: VidSrc.to
// export const ACTIVE_PROVIDER = "vidsrc_me"; // Option 3: VidSrc.me (Alternative API format)
// export const ACTIVE_PROVIDER = "vidlink"; // Option 4: VidLink.pro (Default)

export const getPlayerUrl = (type, id, season = 1, episode = 1, provider = ACTIVE_PROVIDER, progress = 0) => {
    const color = "ff2633"; // Project accent color
    const commonParams = `overlay=true&color=${color}`;
    
    switch (provider) {
        case "videasy":
            if (type === "movie") {
                return `https://player.videasy.to/movie/${id}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1&${commonParams}`;
            }
            return `https://player.videasy.to/tv/${id}/${season}/${episode}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&${commonParams}`;
            
        case "mapple": {
            const theme = "ff2633"; // Project accent color
            if (type === "movie") {
                return `https://mapple.uk/watch/movie/${id}?autoPlay=true&theme=${theme}&title=true&poster=true`;
            }
            return `https://mapple.uk/watch/tv/${id}-${season}-${episode}?autoPlay=true&theme=${theme}&nextButton=true&autoNext=true&title=true&poster=true`;
        }
            
        case "vidfast": {
            const theme = "ff2633"; // Project accent color
            if (type === "movie") {
                return `https://vidfast.vc/movie/${id}?autoPlay=true&theme=${theme}`;
            }
            return `https://vidfast.vc/tv/${id}/${season}/${episode}?autoPlay=true&theme=${theme}&nextButton=true&autoNext=true`;
        }
            
        case "vidsync": {
            const theme = "ff2633"; // Project accent color
            if (type === "movie") {
                return `https://vidsync.live/embed/movie/${id}?autoPlay=true&theme=${theme}`;
            }
            return `https://vidsync.live/embed/tv/${id}/${season}/${episode}?autoPlay=true&theme=${theme}&nextButton=true&autoNext=true`;
        }
            
        case "vidsuper": {
            const themeColor = "ff2633"; // Project accent color
            const progressParam = progress > 0 ? `&progress=${progress}` : "";
            const common = `autoplay=true&overlay=true&skip_intro=true&color=${themeColor}${progressParam}`;
            if (type === "movie") {
                return `https://vidsuper.net/movie/${id}?${common}`;
            }
            return `https://vidsuper.net/tv/${id}/${season}/${episode}?${common}&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
        }
            
        case "cinezo": {
            const primaryColor = "ff2633"; // Vibrant red accent
            const secondaryColor = "c90713"; // Dark red
            const common = `primarycolor=${primaryColor}&secondarycolor=${secondaryColor}&iconcolor=ffffff&autoplay=true&poster=true&chromecast=true&servericon=true&setting=true&pip=true`;
            if (type === "movie") {
                return `https://player.cinezo.live/embed/movie/${id}?${common}`;
            }
            return `https://player.cinezo.live/embed/tv/${id}/${season}/${episode}?${common}`;
        }

            
        case "vidlink": {
            const primaryColor = "ff2633"; // Vibrant red
            const secondaryColor = "c90713"; // Dark red
            const iconColor = "f6f7fb"; // Light grey icon color matching app text
            const params = `primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&nextbutton=true&autoplay=true`;
            
            if (type === "movie") {
                return `https://vidlink.pro/movie/${id}?${params}`;
            }
            return `https://vidlink.pro/tv/${id}/${season}/${episode}?${params}`;
        }
            
        case "vidking": {
            const themeColor = "ff2633";
            const common = `color=${themeColor}&autoPlay=true`;
            const progressParam = progress > 0 ? `&progress=${progress}` : "";
            
            if (type === "movie") {
                return `https://www.vidking.net/embed/movie/${id}?${common}${progressParam}`;
            }
            return `https://www.vidking.net/embed/tv/${id}/${season}/${episode}?${common}&nextEpisode=true&episodeSelector=true${progressParam}`;
        }
            
        default:
            if (type === "movie") {
                return `https://player.videasy.to/movie/${id}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1&${commonParams}`;
            }
            return `https://player.videasy.to/tv/${id}/${season}/${episode}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true&${commonParams}`;
    }
};

export const getAnimePlayerUrl = (animeId, episode = 1, type = "tv") => {
    switch (ACTIVE_PROVIDER) {
        case "videasy":
            return type === "movie"
                ? `https://player.videasy.to/anime/${animeId}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1`
                : `https://player.videasy.to/anime/${animeId}/${episode}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1`;
                
        case "vidsrc_to":
            return type === "movie"
                ? `https://vidsrc.to/embed/anime/${animeId}`
                : `https://vidsrc.to/embed/anime/${animeId}/${episode}`;
                
        case "vidlink":
            return type === "movie"
                ? `https://vidlink.pro/embed/anime/${animeId}`
                : `https://vidlink.pro/embed/anime/${animeId}/${episode}`;
                
        default:
            return type === "movie"
                ? `https://player.videasy.to/anime/${animeId}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1`
                : `https://player.videasy.to/anime/${animeId}/${episode}?autoplay=true&autoPlay=true&autoplay=1&autoPlay=1`;
    }
};
