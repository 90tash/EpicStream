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

export const getStatusLabel = (item) => {
    if (!item) return null;
    const type = getMediaType(item);

    // Check if it's a TV show with a new season
    if (type === "tv" && item.seasons && item.seasons.length > 0) {
        const validSeasons = item.seasons.filter(s => s.season_number > 0);
        if (validSeasons.length > 1) {
            // Sort seasons by season_number descending
            const sortedSeasons = [...validSeasons].sort((a, b) => b.season_number - a.season_number);
            const latestSeason = sortedSeasons[0];
            if (latestSeason.air_date) {
                const airDate = new Date(latestSeason.air_date);
                const today = new Date();
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(today.getDate() - 90);
                
                if (airDate > today || (airDate >= ninetyDaysAgo && airDate <= today)) {
                    return { text: "New Season", className: "status-newseason" };
                }
            }
        }
    }

    const releaseDateStr = item.release_date || item.first_air_date;
    if (!releaseDateStr) return null;

    const releaseDate = new Date(releaseDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    releaseDate.setHours(0, 0, 0, 0);

    if (releaseDate > today) {
        return { text: "Upcoming", className: "status-upcoming" };
    }

    // Recent release (within 60 days)
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    if (releaseDate >= sixtyDaysAgo && releaseDate <= today) {
        if (type === "movie") {
            if (item.has_digital_release) {
                return null;
            }
            return { text: "In Cinemas", className: "status-incinemas" };
        }
    }

    return null;
};


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
export const ACTIVE_PROVIDER = "vidsync"; // Option 1: VidSync (Default)
// export const ACTIVE_PROVIDER = "vidsrc_to"; // Option 2: VidSrc.to
// export const ACTIVE_PROVIDER = "vidsrc_me"; // Option 3: VidSrc.me (Alternative API format)
// export const ACTIVE_PROVIDER = "vidlink"; // Option 4: VidLink.pro (Default)

export const getPlayerUrl = (type, id, season = 1, episode = 1, provider = ACTIVE_PROVIDER, progress = 0, nxshaSettings = {}) => {
    const color = "ff2633"; // Project accent color
    const commonParams = `overlay=true&color=${color}`;
    
    switch (provider) {
        case "peachify": {
            const baseUrl = "https://peachify.top";
            let url = "";
            if (type === "movie") {
                url = `${baseUrl}/embed/movie/${id}`;
            } else {
                url = `${baseUrl}/embed/tv/${id}/${season}/${episode}`;
            }
            const params = ["accent=ff2633"];
            if (progress > 0) {
                params.push(`t=${Math.round(progress)}`);
            }
            return `${url}?${params.join("&")}`;
        }

        case "nxsha": {
            const baseUrl = "https://nxsha.space";
            let url = "";
            if (type === "movie") {
                url = `${baseUrl}/embed/movie/${id}`;
            } else {
                url = `${baseUrl}/embed/tv/${id}/${season}/${episode}`;
            }
            
            const server = nxshaSettings.server || "MbPly-[Multi-Lang]";
            const oneServer = nxshaSettings.oneServer ?? false;
            const sub = nxshaSettings.sub || "en";
            const lang = nxshaSettings.lang || "";
            const disableDl = nxshaSettings.disableDl ?? true;
            const disableAd = nxshaSettings.disableAd ?? true;
            
            const params = [];
            if (server) params.push(`server=${encodeURIComponent(server)}`);
            if (oneServer) params.push("one_server=true");
            if (sub) params.push(`sub=${encodeURIComponent(sub)}`);
            if (lang) params.push(`lang=${encodeURIComponent(lang)}`);
            if (disableDl) params.push("disable_dl_button=true");
            if (disableAd) params.push("disable_app_ad=true");
            
            if (params.length > 0) {
                url += `?${params.join("&")}`;
            }
            return url;
        }

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

export const prioritizeSimilarContent = (currentShow, recommendationsList) => {
    if (!currentShow || !recommendationsList || recommendationsList.length === 0) {
        return recommendationsList;
    }

    const currentLang = currentShow.original_language;
    const currentCountries = Array.isArray(currentShow.origin_country)
        ? currentShow.origin_country
        : (currentShow.production_countries?.map(c => c.iso_3166_1) || []);

    const currentGenres = currentShow.genres?.map(g => g.id || g) || [];
    
    // 1. Anime Detection
    const isCurrentAnime = currentGenres.includes(16) && 
        (currentCountries.includes("JP") || currentLang === "ja");

    // 2. Indian Content Detection
    const indianLanguages = ["hi", "te", "ta", "ml", "kn", "pa", "bn", "gu", "mr", "ur"];
    const isCurrentIndian = currentCountries.includes("IN") || indianLanguages.includes(currentLang);

    // 3. Korean Content Detection
    const isCurrentKorean = currentCountries.includes("KR") || currentLang === "ko";

    const scoredList = recommendationsList.map(item => {
        let score = 0;

        const itemLang = item.original_language;
        const itemCountries = Array.isArray(item.origin_country)
            ? item.origin_country
            : (item.production_countries?.map(c => c.iso_3166_1) || []);
        const itemGenres = item.genre_ids || item.genres?.map(g => g.id || g) || [];

        const isItemAnime = itemGenres.includes(16) && 
            (itemCountries.includes("JP") || itemLang === "ja");

        const isItemIndian = itemCountries.includes("IN") || indianLanguages.includes(itemLang);
        const isItemKorean = itemCountries.includes("KR") || itemLang === "ko";

        // Category matching rules
        if (isCurrentAnime) {
            score += isItemAnime ? 200 : -100;
        } else if (isItemAnime) {
            score -= 100; // Deprioritize anime if current is not anime
        }

        if (isCurrentIndian) {
            score += isItemIndian ? 200 : -100;
        } else if (isItemIndian) {
            score -= 100; // Deprioritize Indian if current is not Indian
        }

        if (isCurrentKorean) {
            score += isItemKorean ? 200 : -100;
        } else if (isItemKorean) {
            score -= 100; // Deprioritize Korean if current is not Korean
        }

        // Generic language matching (for Spanish, French, etc.)
        if (itemLang === currentLang) {
            score += 50;
        } else if (itemLang !== "en" && currentLang !== "en") {
            // If both are non-English and different, deprioritize slightly
            score -= 10;
        }

        // Generic country matching
        const matchingCountries = itemCountries.filter(c => currentCountries.includes(c));
        score += matchingCountries.length * 30;

        // Genre matching
        const matchingGenres = itemGenres.filter(g => currentGenres.includes(g));
        score += matchingGenres.length * 10;

        return { item, score };
    });

    // Sort by score descending
    const sorted = [...scoredList].sort((a, b) => b.score - a.score);
    return sorted.map(entry => entry.item);
};
