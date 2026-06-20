export const isAnime = (media) => {
    if (!media) return false;

    // Check if original language is Japanese
    const isJapanese = media.original_language === "ja";

    // Check if genres contain Animation
    const hasAnimationGenre = media.genres?.some(
        (genre) => genre.id === 16 || 
                   (typeof genre === "string" && genre.toLowerCase() === "animation") || 
                   (genre.name && genre.name.toLowerCase() === "animation")
    );

    return isJapanese && hasAnimationGenre;
};

export const anilistFetch = async (query, variables = {}) => {
    const response = await fetch("/api/anilist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`AniList query failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
};

export const fetchAnilistAnimeList = async (searchQuery) => {
    const query = `
        query ($search: String, $type: MediaType) {
            Page (page: 1, perPage: 8) {
                media (search: $search, type: $type) {
                    id
                    title {
                        romaji
                        english
                        native
                        userPreferred
                    }
                    format
                    startDate {
                        year
                    }
                }
            }
        }
    `;

    const variables = {
        search: searchQuery,
        type: "ANIME",
    };

    try {
        const responseData = await anilistFetch(query, variables);
        return responseData?.data?.Page?.media || [];
    } catch (error) {
        console.error("Error searching anime on AniList:", error);
        return [];
    }
};

export const findBestAnilistMatch = (mediaList, tmdbTitle, tmdbYear, isMovie) => {
    if (!mediaList || mediaList.length === 0) return null;

    let bestMatch = null;
    let highestScore = -1;

    const normalizedTmdbTitle = tmdbTitle.toLowerCase().trim();

    for (const media of mediaList) {
        let score = 0;

        // 1. Format Scoring (TV vs Movie)
        if (isMovie) {
            if (media.format === "MOVIE") {
                score += 3;
            } else if (media.format === "SPECIAL" || media.format === "OVA") {
                score += 1;
            }
        } else {
            // TV series can be TV, TV_SHORT, OVA, ONA, SPECIAL
            if (media.format && media.format !== "MOVIE") {
                score += 3;
            }
        }

        // 2. Year Scoring
        if (media.startDate?.year && tmdbYear) {
            const diff = Math.abs(media.startDate.year - Number.parseInt(tmdbYear, 10));
            if (diff === 0) {
                score += 5; // Exact year match
            } else if (diff === 1) {
                score += 2; // Close year match
            }
        }

        // 3. Title Matching (Compare Romaji, English, Native, userPreferred)
        const titles = [
            media.title.english,
            media.title.romaji,
            media.title.native,
            media.title.userPreferred
        ]
            .filter(Boolean)
            .map((t) => t.toLowerCase().trim());

        if (titles.includes(normalizedTmdbTitle)) {
            score += 6; // Exact title match
        } else if (titles.some((t) => t.includes(normalizedTmdbTitle) || normalizedTmdbTitle.includes(t))) {
            score += 3; // Substring title match
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = media;
        }
    }

    // A low-scoring match (< 3) is likely incorrect, fallback to null to keep it safe
    return highestScore >= 3 ? bestMatch : null;
};
