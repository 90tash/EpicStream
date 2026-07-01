const WATCHLIST_KEY = "epicstream_watchlist";

export const getWatchlist = () => {
    try {
        return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
    } catch (e) {
        console.error("Error reading watchlist:", e);
        return [];
    }
};

export const isInWatchlist = (id) => {
    const list = getWatchlist();
    return list.some(item => item.id === Number(id));
};

export const addToWatchlist = (item, type) => {
    try {
        const list = getWatchlist();
        if (list.some(h => h.id === Number(item.id))) return;
        
        const watchlistItem = {
            id: Number(item.id),
            title: item.title || item.name,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            vote_average: item.vote_average,
            release_date: item.release_date,
            first_air_date: item.first_air_date,
            type,
            timestamp: Date.now()
        };
        
        const newList = [watchlistItem, ...list];
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
    } catch (e) {
        console.error("Error saving to watchlist:", e);
    }
};

export const removeFromWatchlist = (id) => {
    try {
        const list = getWatchlist();
        const newList = list.filter(h => h.id !== Number(id));
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newList));
    } catch (e) {
        console.error("Error removing from watchlist:", e);
    }
};
