import { create } from "zustand";

export const useContentStore = create((set) => ({
    contentType: localStorage.getItem("contentType") || "movie", // Initialize from localStorage or default to "tv"
    setContentType: (type) => {
        localStorage.setItem("contentType", type); // Save to localStorage
        set({ contentType: type }); // Update the state
    },
}));
