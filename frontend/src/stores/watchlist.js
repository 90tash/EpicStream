import { create } from "zustand";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "../utils/watchlist";

export const useWatchlistStore = create((set, get) => ({
    watchlist: getWatchlist(),
    
    toggleItem: (item, type) => {
        const id = Number(item.id);
        const inList = get().watchlist.some(i => i.id === id);
        
        if (inList) {
            removeFromWatchlist(id);
        } else {
            addToWatchlist(item, type);
        }
        
        set({ watchlist: getWatchlist() });
    },
    
    isItemInList: (id) => {
        return get().watchlist.some(item => item.id === Number(id));
    }
}));
