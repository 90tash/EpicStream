import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Play, Info, Eye, Plus, X } from "lucide-react";
import { getTitle, getYear, getRating, formatMediaType, getStatusLabel, getReleaseCountdownInfo, imageUrl, tmdbFetch } from "../utils/tmdb";
import { addToHistory, getHistory, removeFromHistory } from "../utils/history";
import toast from "react-hot-toast";
import "./networkBrowse.css";

// Networks configuration with official TMDB provider logos
export const NETWORKS = [
    {
        id: "netflix",
        name: "Netflix",
        networkId: 213,
        providerId: 8,
        watchRegion: "IN",
        color: "#E50914",
        logo: "/networks/netflix.png"
    },
    {
        id: "amazon",
        name: "Amazon Prime",
        networkId: 1024,
        providerId: 119,
        watchRegion: "IN",
        color: "#00A8E1",
        logo: "/networks/amazon.png"
    },
    {
        id: "jiohotstar",
        name: "JioHotstar",
        networkId: 3919,
        providerId: 2336,
        watchRegion: "IN",
        color: "#0C43B7",
        logo: "/networks/jiohotstar.png"
    },
    {
        id: "zee5",
        name: "Zee5",
        networkId: 3025,
        providerId: 232,
        watchRegion: "IN",
        color: "#8230C6",
        logo: "/networks/zee5.png"
    },
    {
        id: "sonyliv",
        name: "Sony LIV",
        networkId: 3426,
        providerId: 237,
        watchRegion: "IN",
        color: "#00A8E1",
        logo: "/networks/sonyliv.png"
    },
    {
        id: "disney",
        name: "Disney+",
        networkId: 2739,
        providerId: 337,
        watchRegion: "US",
        color: "#4CC3FF",
        logo: "/networks/disney.png"
    },
    {
        id: "apple",
        name: "Apple TV+",
        networkId: 2552,
        providerId: 350,
        watchRegion: "IN",
        color: "#FFFFFF",
        logo: "/networks/apple.png"
    },
    {
        id: "hulu",
        name: "Hulu",
        networkId: 453,
        providerId: 15,
        watchRegion: "US",
        color: "#1CE783",
        logo: "/networks/hulu.png"
    },
    {
        id: "hbomax",
        name: "HBO Max",
        networkId: 3186,
        providerId: 1899,
        watchRegion: "US",
        color: "#9C27B0",
        logo: "/networks/hbomax.png"
    },
    {
        id: "paramount",
        name: "Paramount+",
        networkId: 4330,
        providerId: 531,
        watchRegion: "US",
        color: "#0064FF",
        logo: "/networks/paramount.png"
    },
    {
        id: "peacock",
        name: "Peacock",
        networkId: 3353,
        providerId: 386,
        watchRegion: "US",
        color: "#00E5FF",
        logo: "/networks/peacock.png"
    },
    {
        id: "crunchyroll",
        name: "Crunchyroll",
        networkId: 1112,
        providerId: 283,
        watchRegion: "US",
        color: "#F47521",
        logo: "/networks/crunchyroll.png"
    }
];

const NetworkCard = ({ item, openDetails, openWatch, onAddToList, onWatchTrailer, activeListItemId }) => {
    const type = item.media_type || (item.title ? "movie" : "tv");
    const rating = getRating(item);
    const year = getYear(item);
    const statusLabel = getStatusLabel(item);
    const countdownInfo = getReleaseCountdownInfo(item.first_air_date || item.release_date);
    const isUpcoming = statusLabel?.text === "Upcoming" || !!countdownInfo?.isFuture;
    const isListOpen = activeListItemId === item.id;

    const [isWatched, setIsWatched] = useState(() => getHistory().some(h => h.id === item.id));
    const [isMobileActive, setIsMobileActive] = useState(false);
    const cardRef = useRef(null);

    const handlePlay = (e) => {
        e.stopPropagation();
        if (isUpcoming) {
            if (onWatchTrailer) {
                onWatchTrailer(item);
            } else {
                toast("Trailer not available yet", { icon: "🎬" });
            }
            return;
        }
        openWatch(item);
    };

    const handleWatched = (e) => {
        e.stopPropagation();
        if (isWatched) {
            removeFromHistory(item.id);
            setIsWatched(false);
            toast.success("Removed from watched");
        } else {
            addToHistory(item, type, type === "tv" ? 1 : null, type === "tv" ? 1 : null);
            setIsWatched(true);
            toast.success("Marked as watched");
        }
    };

    useEffect(() => {
        if (!isListOpen) {
            setIsMobileActive(false);
        }
    }, [isListOpen]);

    useEffect(() => {
        if (!isMobileActive) return;
        const handleOutsideClick = (e) => {
            if (cardRef.current && cardRef.current.contains(e.target)) return;
            setIsMobileActive(false);
        };
        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [isMobileActive]);

    const handleCardClick = (e) => {
        if (window.innerWidth <= 768) {
            if (!isMobileActive) {
                e.preventDefault();
                setIsMobileActive(true);
                return;
            }
        }
        openDetails(item);
    };

    const isCardActive = isMobileActive || isListOpen;

    return (
        <button
            type="button"
            ref={cardRef}
            className={`browse-card ${isCardActive ? "mobile-active" : ""}`}
            key={`${item.id}-${type}`}
            onClick={handleCardClick}
        >
            <div className="card-img-wrapper">
                <img 
                    src={imageUrl(item.poster_path || item.backdrop_path, "w500")} 
                    alt={getTitle(item)} 
                    loading="lazy"
                />
                {statusLabel && (
                    <span className={`card-status-badge ${statusLabel.className}`}>
                        {statusLabel.text}
                    </span>
                )}
                {/* Mobile view info overlay */}
                <div className="card-mobile-info-container">
                    <div className="card-mobile-title">{getTitle(item)}</div>
                    <div className="card-mobile-meta">
                        {rating && parseFloat(rating) > 0 && (
                            <span className="mobile-rating-wrapper">
                                <Star size={10} fill="currentColor" className="mobile-rating-star" />
                                <span className="rating-mono">{rating}</span> • 
                            </span>
                        )}
                        {year && <span>{year} • </span>}
                        <span>{type === "movie" ? "Movie" : "TV Show"}</span>
                    </div>
                </div>

                <div className={`card-hover-actions${isCardActive ? ' force-show' : ''}`}>
                    <button 
                        className="card-action-btn hover-play-btn"
                        title={isUpcoming ? "Watch Trailer" : "Play"}
                        aria-label={isUpcoming ? "Watch Trailer" : "Play"}
                        onClick={handlePlay}
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                    <button 
                        className="card-action-btn"
                        title="Info"
                        onClick={(e) => { e.stopPropagation(); openDetails(item); }}
                    >
                        <Info size={16} />
                    </button>
                    {!isUpcoming && (
                        <button 
                            className="card-action-btn"
                            title={isWatched ? "Remove from Watched" : "Mark as Watched"}
                            onClick={handleWatched}
                        >
                            <Eye size={16} color={isWatched ? "#4cd964" : "currentColor"} />
                        </button>
                    )}
                    <button 
                        className="card-action-btn"
                        title="Add to List"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onAddToList) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                onAddToList({ item, rect });
                            }
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <span className="card-title">{getTitle(item)}</span>
            <span className="card-meta">
                {rating && parseFloat(rating) > 0 && (
                    <>
                        <Star size={13} fill="currentColor" />
                        {rating}
                        <span className="dot" />
                    </>
                )}
                {year && (
                    <>
                        {year}
                        <span className="dot" />
                    </>
                )}
                {formatMediaType(type)}
            </span>
        </button>
    );
};

const NetworkBrowse = ({ openDetails, openWatch, onAddToList, onWatchTrailer, activeListItemId }) => {
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [networkItems, setNetworkItems] = useState([]);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    const iconsSliderRef = useRef(null);
    const itemsSliderRef = useRef(null);

    // Scroll state for network icons row
    const [showIconsLeft, setShowIconsLeft] = useState(false);
    const [showIconsRight, setShowIconsRight] = useState(false);

    // Scroll state for items row
    const [showItemsLeft, setShowItemsLeft] = useState(false);
    const [showItemsRight, setShowItemsRight] = useState(false);

    const updateIconsArrows = () => {
        if (!iconsSliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = iconsSliderRef.current;
        setShowIconsLeft(scrollLeft > 2);
        setShowIconsRight(scrollLeft + clientWidth < scrollWidth - 2);
    };

    const updateItemsArrows = () => {
        if (!itemsSliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = itemsSliderRef.current;
        setShowItemsLeft(scrollLeft > 2);
        setShowItemsRight(scrollLeft + clientWidth < scrollWidth - 2);
    };

    useEffect(() => {
        const timer = setTimeout(updateIconsArrows, 150);
        window.addEventListener("resize", updateIconsArrows);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateIconsArrows);
        };
    }, []);

    useEffect(() => {
        if (!selectedNetwork) return;
        const timer = setTimeout(updateItemsArrows, 150);
        window.addEventListener("resize", updateItemsArrows);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateItemsArrows);
        };
    }, [networkItems, isLoadingItems, selectedNetwork]);

    // Fetch popular items when network is selected
    useEffect(() => {
        if (!selectedNetwork) {
            setNetworkItems([]);
            setIsLoadingItems(false);
            return;
        }

        let isMounted = true;
        setIsLoadingItems(true);

        const fetchNetworkContent = async () => {
            try {
                const today = new Date().toISOString().split("T")[0];
                let combinedItems = [];

                // 1. Primary: Query using watch provider (for trending movies and shows actually streaming on this platform)
                if (selectedNetwork.providerId) {
                    const region = selectedNetwork.watchRegion || "IN";
                    const [tvData, movieData] = await Promise.allSettled([
                        tmdbFetch("/discover/tv", {
                            with_watch_providers: selectedNetwork.providerId,
                            watch_region: region,
                            sort_by: "popularity.desc",
                            "first_air_date.lte": today,
                            include_null_first_air_dates: false
                        }),
                        tmdbFetch("/discover/movie", {
                            with_watch_providers: selectedNetwork.providerId,
                            watch_region: region,
                            sort_by: "popularity.desc",
                            "primary_release_date.lte": today
                        })
                    ]);

                    const tvResults = (tvData.status === "fulfilled" && tvData.value?.results)
                        ? tvData.value.results.map(item => ({ ...item, media_type: "tv" }))
                        : [];
                    const movieResults = (movieData.status === "fulfilled" && movieData.value?.results)
                        ? movieData.value.results.map(item => ({ ...item, media_type: "movie" }))
                        : [];

                    combinedItems = [...tvResults, ...movieResults]
                        .filter(item => item.poster_path || item.backdrop_path)
                        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                }

                // 2. Fallback: If watch provider returned no items, fallback to with_networks
                if (combinedItems.length === 0 && selectedNetwork.networkId) {
                    const data = await tmdbFetch("/discover/tv", {
                        with_networks: selectedNetwork.networkId,
                        sort_by: "popularity.desc",
                        "first_air_date.lte": today,
                        include_null_first_air_dates: false
                    });
                    combinedItems = (data?.results || []).map(item => ({ ...item, media_type: "tv" }));
                }

                if (!isMounted) return;
                setNetworkItems(combinedItems);
            } catch (err) {
                console.error("Failed to load network content:", err);
                if (isMounted) setNetworkItems([]);
            } finally {
                if (isMounted) setIsLoadingItems(false);
            }
        };

        fetchNetworkContent();

        return () => {
            isMounted = false;
        };
    }, [selectedNetwork]);

    const handleSelectNetwork = (network) => {
        if (selectedNetwork?.id === network.id) {
            setSelectedNetwork(null);
        } else {
            setSelectedNetwork(network);
        }
    };

    const scrollIcons = (direction) => {
        if (!iconsSliderRef.current) return;
        const { scrollLeft, clientWidth } = iconsSliderRef.current;
        iconsSliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75,
            behavior: "smooth"
        });
    };

    const scrollItems = (direction) => {
        if (!itemsSliderRef.current) return;
        const { scrollLeft, clientWidth } = itemsSliderRef.current;
        itemsSliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth,
            behavior: "smooth"
        });
    };

    return (
        <section className="network-browse-wrapper">
            {/* 1. Browse by network Row */}
            <div className="network-browse-section">
                <div className="row-heading">
                    <h2 className="section-title">Browse by network</h2>
                </div>

                <div className="network-icons-container">
                    {showIconsLeft && (
                        <button 
                            className="network-slider-arrow left" 
                            onClick={() => scrollIcons("left")} 
                            aria-label="Scroll networks left"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    <div 
                        className="network-icons-slider" 
                        ref={iconsSliderRef}
                        onScroll={updateIconsArrows}
                    >
                        {NETWORKS.map((network) => {
                            const isSelected = selectedNetwork?.id === network.id;
                            return (
                                <button
                                    key={network.id}
                                    type="button"
                                    className={`network-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleSelectNetwork(network)}
                                    style={{ "--network-color": network.color }}
                                >
                                    <div className={`network-icon-box network-${network.id}`}>
                                        <img 
                                            src={network.logo} 
                                            alt={network.name} 
                                            className="network-logo-img" 
                                            loading="lazy" 
                                            draggable="false"
                                        />
                                    </div>
                                    <span className="network-label">{network.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {showIconsRight && (
                        <button 
                            className="network-slider-arrow right" 
                            onClick={() => scrollIcons("right")} 
                            aria-label="Scroll networks right"
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Dynamic "Popular on [Network]" Section (shows under network row when selected) */}
            {selectedNetwork && (
                <div 
                    className="network-popular-section"
                    style={{ "--network-color": selectedNetwork.color }}
                >
                    <div className="network-popular-header">
                        <h2 className="section-title">
                            Popular on <span className="network-heading-brand">{selectedNetwork.name}</span>
                        </h2>

                        <button 
                            type="button"
                            className="network-clear-btn"
                            onClick={() => setSelectedNetwork(null)}
                            aria-label="Clear selection"
                        >
                            <X size={14} />
                            <span>Clear selection</span>
                        </button>
                    </div>

                    <div className="network-items-slider-wrapper slider-wrapper">
                        {showItemsLeft && (
                            <button 
                                type="button"
                                className="row-arrow left" 
                                onClick={() => scrollItems("left")} 
                                aria-label="Scroll items left"
                            >
                                <ChevronLeft size={36} />
                            </button>
                        )}

                        <div 
                            className="browse-slider network-items-slider" 
                            ref={itemsSliderRef}
                            onScroll={updateItemsArrows}
                        >
                            {isLoadingItems ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="browse-card skeleton-card" />
                                ))
                            ) : networkItems.length > 0 ? (
                                networkItems.map((item, index) => (
                                    <NetworkCard 
                                        key={`${selectedNetwork.id}-${item.id}`}
                                        item={item}
                                        index={index}
                                        openDetails={openDetails}
                                        openWatch={openWatch}
                                        onAddToList={onAddToList}
                                        onWatchTrailer={onWatchTrailer}
                                        activeListItemId={activeListItemId}
                                    />
                                ))
                            ) : (
                                <p className="network-empty-message">No popular titles found for this platform.</p>
                            )}
                        </div>

                        {showItemsRight && (
                            <button 
                                type="button"
                                className="row-arrow right" 
                                onClick={() => scrollItems("right")} 
                                aria-label="Scroll items right"
                            >
                                <ChevronRight size={36} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default NetworkBrowse;
