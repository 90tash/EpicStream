const HISTORY_KEY = "epicstream_watch_history";
const WATCHED_EPISODES_KEY = "epicstream_watched_episodes";
const MAX_HISTORY = 20;

export const markEpisodeWatched = (showId, season, episode) => {
    try {
        const watched = JSON.parse(localStorage.getItem(WATCHED_EPISODES_KEY) || "{}");
        if (!watched[showId]) {
            watched[showId] = {};
        }
        if (!watched[showId][season]) {
            watched[showId][season] = {};
        }
        watched[showId][season][episode] = true;
        localStorage.setItem(WATCHED_EPISODES_KEY, JSON.stringify(watched));
    } catch (e) {
        console.error("Error marking episode as watched:", e);
    }
};

export const removeEpisodeWatched = (showId, season, episode) => {
    try {
        const watched = JSON.parse(localStorage.getItem(WATCHED_EPISODES_KEY) || "{}");
        if (watched[showId] && watched[showId][season]) {
            delete watched[showId][season][episode];
            if (Object.keys(watched[showId][season]).length === 0) {
                delete watched[showId][season];
            }
            if (Object.keys(watched[showId]).length === 0) {
                delete watched[showId];
            }
            localStorage.setItem(WATCHED_EPISODES_KEY, JSON.stringify(watched));
        }
    } catch (e) {
        console.error("Error removing watched episode:", e);
    }
};

export const getWatchedEpisodes = (showId) => {
    try {
        const watched = JSON.parse(localStorage.getItem(WATCHED_EPISODES_KEY) || "{}");
        return watched[showId] || {};
    } catch (e) {
        console.error("Error getting watched episodes:", e);
        return {};
    }
};

export const isEpisodeWatched = (showId, season, episode) => {
    try {
        const watched = JSON.parse(localStorage.getItem(WATCHED_EPISODES_KEY) || "{}");
        return !!(watched[showId]?.[season]?.[episode]);
    } catch (e) {
        console.error("Error checking if episode is watched:", e);
        return false;
    }
};

export const addToHistory = (item, type, season = null, episode = null, provider = null) => {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        const existingItem = history.find(h => h.id === item.id);
        
        // Remove existing entry for the same ID to move it to the top
        const filteredHistory = history.filter(h => h.id !== item.id);
        
        const historyItem = {
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            vote_average: item.vote_average,
            release_date: item.release_date,
            first_air_date: item.first_air_date,
            type,
            season,
            episode,
            provider: provider || existingItem?.provider || null,
            percentage: existingItem?.percentage || 0,
            currentTime: existingItem?.currentTime || 0,
            duration: existingItem?.duration || 0,
            timeStr: existingItem?.timeStr || "",
            timestamp: Date.now()
        };
        
        const newHistory = [historyItem, ...filteredHistory].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

        if (type === "tv" && season !== null && episode !== null) {
            markEpisodeWatched(item.id, season, episode);
        }
    } catch (e) {
        console.error("Error saving to watch history:", e);
    }
};

export const updateHistoryProgress = (id, progressData) => {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        const itemIndex = history.findIndex(h => h.id === Number(id));
        
        if (itemIndex > -1) {
            history[itemIndex] = { ...history[itemIndex], ...progressData, timestamp: Date.now() };
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
    } catch (e) {
        console.error("Error updating progress:", e);
    }
};

export const getHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch (e) {
        console.error("Error reading watch history:", e);
        return [];
    }
};

export const removeFromHistory = (id) => {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        const newHistory = history.filter(h => h.id !== id);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.error("Error removing from watch history:", e);
    }
};
