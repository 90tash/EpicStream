const HISTORY_KEY = "epicstream_watch_history";
const MAX_HISTORY = 20;

export const addToHistory = (item, type, season = null, episode = null) => {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        
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
            timestamp: Date.now()
        };
        
        const newHistory = [historyItem, ...filteredHistory].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
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
