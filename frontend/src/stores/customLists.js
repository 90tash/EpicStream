import { create } from "zustand";
import { useWatchlistStore } from "./watchlist";

const CUSTOM_LISTS_KEY = "epicstream_custom_lists";

const getCustomLists = () => {
    try {
        return JSON.parse(localStorage.getItem(CUSTOM_LISTS_KEY) || "[]");
    } catch (e) {
        console.error("Error reading custom lists:", e);
        return [];
    }
};

const saveCustomLists = (lists) => {
    try {
        localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(lists));
    } catch (e) {
        console.error("Error saving custom lists:", e);
    }
};

export const useCustomListsStore = create((set, get) => ({
    customLists: getCustomLists(),

    createList: (name) => {
        const currentLists = get().customLists;
        // Maximum of 15 lists total (14 custom lists + 1 default watchlist)
        if (currentLists.length >= 14) {
            return { success: false, error: "Maximum limit of 15 lists reached." };
        }
        
        const trimmed = name.trim();
        if (!trimmed) {
            return { success: false, error: "List name cannot be empty." };
        }
        if (trimmed.length > 50) {
            return { success: false, error: "List name must be 50 characters or less." };
        }

        const nameExists = currentLists.some(
            (l) => l.name.toLowerCase() === trimmed.toLowerCase() || trimmed.toLowerCase() === "my watchlist"
        );
        if (nameExists) {
            return { success: false, error: "A list with this name already exists." };
        }

        const newList = {
            id: "list_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            name: trimmed,
            items: []
        };

        const updated = [...currentLists, newList];
        saveCustomLists(updated);
        set({ customLists: updated });
        return { success: true, list: newList };
    },

    deleteList: (id) => {
        const currentLists = get().customLists;
        const updated = currentLists.filter(l => l.id !== id);
        saveCustomLists(updated);
        set({ customLists: updated });
    },

    toggleItemInList: (listId, item, type) => {
        if (listId === "watchlist") {
            useWatchlistStore.getState().toggleItem(item, type);
            return;
        }

        const currentLists = get().customLists;
        const listIndex = currentLists.findIndex(l => l.id === listId);
        if (listIndex === -1) return;

        const list = currentLists[listIndex];
        const itemId = Number(item.id);
        const exists = list.items.some(i => i.id === itemId);

        let updatedItems;
        if (exists) {
            updatedItems = list.items.filter(i => i.id !== itemId);
        } else {
            const newItem = {
                id: itemId,
                title: item.title || item.name,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                vote_average: item.vote_average,
                release_date: item.release_date,
                first_air_date: item.first_air_date,
                type,
                timestamp: Date.now()
            };
            updatedItems = [newItem, ...list.items];
        }

        const updatedLists = [...currentLists];
        updatedLists[listIndex] = { ...list, items: updatedItems };
        saveCustomLists(updatedLists);
        set({ customLists: updatedLists });
    },

    isItemInList: (listId, itemId) => {
        if (listId === "watchlist") {
            return useWatchlistStore.getState().isItemInList(itemId);
        }
        const list = get().customLists.find(l => l.id === listId);
        return list ? list.items.some(i => i.id === Number(itemId)) : false;
    },

    getListsForItem: (itemId) => {
        const itemNumId = Number(itemId);
        const inWatchlist = useWatchlistStore.getState().isItemInList(itemNumId);
        const matchingLists = [];
        if (inWatchlist) {
            matchingLists.push("watchlist");
        }
        get().customLists.forEach(list => {
            if (list.items.some(i => i.id === itemNumId)) {
                matchingLists.push(list.id);
            }
        });
        return matchingLists;
    }
}));
