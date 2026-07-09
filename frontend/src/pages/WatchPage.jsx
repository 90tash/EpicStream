/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Search, LayoutGrid, List } from "lucide-react";
import {
    ACTIVE_PROVIDER,
    formatMediaType,
    getPlayerUrl,
    getTitle,
    imageUrl,
    tmdbFetch,
    tmdbGetImages,
    tmdbGetSeason,
} from "../utils/tmdb";
import { addToHistory, updateHistoryProgress, getHistory } from "../utils/history";
import { isAnime } from "../utils/anilist";
import "./watchPage.css";

const getPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
};

const getProviderLabel = (provider) => {
    const labels = {
        vidlink: "VidLink",
        vidsync: "VidSync",
        videasy: "Videasy",
        "1embed": "1Embed",
        vidfast: "VidFast",
        vidcore: "VidCore",
    };
    return labels[provider] || provider;
};

const WATCH_PROVIDERS = [
    { id: "vidsync", name: "VidSync" },
    { id: "videasy", name: "Videasy" },
    { id: "vidlink", name: "VidLink" },
    { id: "1embed", name: "1Embed" },
    { id: "vidfast", name: "VidFast" },
    { id: "vidcore", name: "VidCore" }
];

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const episodeFilterRef = useRef(null);

    const mediaType = type === "tv" ? "tv" : "movie";
    const season = getPositiveInt(searchParams.get("season"), 1);
    const episode = getPositiveInt(searchParams.get("episode"), 1);

    const [details, setDetails] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFrameLoading, setIsFrameLoading] = useState(true);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [error, setError] = useState("");
    const [episodeQuery, setEpisodeQuery] = useState("");
    
    const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);
    const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // View mode: 'detailed' (cards with thumbs) or 'list' (compact rows)
    const [viewMode, setViewMode] = useState("detailed");

    // Scroll tracking for showing/hiding the scrollbar
    const [isScrollingEpisodes, setIsScrollingEpisodes] = useState(false);
    const scrollTimeoutRef = useRef(null);
    // Timeout tracking for delaying marquee sliding animation
    const marqueeTimeoutRef = useRef(null);

    const handleEpisodesScroll = () => {
        setIsScrollingEpisodes(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrollingEpisodes(false);
        }, 1000); // Fade scrollbar out after 1 second of inactivity
    };

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (marqueeTimeoutRef.current) {
                clearTimeout(marqueeTimeoutRef.current);
            }
        };
    }, []);

    // Marquee slide logic for long titles in List view on hover (delayed by 3 seconds)
    const handleRowMouseEnter = (event) => {
        // Clear any existing active timers to avoid multiple schedules
        if (marqueeTimeoutRef.current) {
            clearTimeout(marqueeTimeoutRef.current);
        }

        const target = event.currentTarget;

        // Schedule marquee to start only after 3 seconds of continuous hover
        marqueeTimeoutRef.current = setTimeout(() => {
            const titleEl = target.querySelector(".watch-sidebar-ep-row-title");
            const innerEl = target.querySelector(".watch-sidebar-ep-row-title-inner");
            if (!titleEl || !innerEl) return;

            const clientWidth = titleEl.clientWidth;
            const scrollWidth = innerEl.scrollWidth;

            if (scrollWidth > clientWidth) {
                const overflowAmount = scrollWidth - clientWidth;
                const speed = 30; // pixels per second
                const duration = overflowAmount / speed;

                titleEl.style.setProperty("--scroll-amount", `${overflowAmount}px`);
                titleEl.style.setProperty("--scroll-duration", `${duration}s`);
                titleEl.classList.add("has-overflow");
            }
        }, 3000); // 3-second delay
    };

    const handleRowMouseLeave = (event) => {
        // Cancel scheduled marquee if the user moves away before 3 seconds
        if (marqueeTimeoutRef.current) {
            clearTimeout(marqueeTimeoutRef.current);
        }

        const titleEl = event.currentTarget.querySelector(".watch-sidebar-ep-row-title");
        if (titleEl) {
            titleEl.classList.remove("has-overflow");
            titleEl.style.removeProperty("--scroll-amount");
            titleEl.style.removeProperty("--scroll-duration");
        }
    };

    // Default to the last used provider for this item, or default to "vidsync" as requested
    const [selectedProvider, setSelectedProvider] = useState(() => {
        try {
            const historyItem = getHistory().find(h => h.id === Number(id));
            if (historyItem?.provider) {
                const found = WATCH_PROVIDERS.some(p => p.id === historyItem.provider);
                if (found) return historyItem.provider;
            }
        } catch (e) {
            console.error("Failed to parse history for provider:", e);
        }
        return "vidsync"; // Default to vidsync
    });

    // Control bar visibility (fade out on inactivity)
    const [showOverlays, setShowOverlays] = useState(true);
    const overlayTimeoutRef = useRef(null);

    const resetOverlayTimeout = () => {
        setShowOverlays(true);
        if (overlayTimeoutRef.current) {
            clearTimeout(overlayTimeoutRef.current);
        }
        // Only trigger auto-fadeout if menus and sidebars are closed
        if (!isProviderMenuOpen && !isSidebarOpen) {
            overlayTimeoutRef.current = setTimeout(() => {
                setShowOverlays(false);
            }, 3000); // 3 seconds of inactivity
        }
    };

    // Re-trigger overlay timer when menu/sidebar state changes
    useEffect(() => {
        resetOverlayTimeout();
    }, [isProviderMenuOpen, isSidebarOpen]);

    // Handle mouse movement to show controls
    useEffect(() => {
        const handleMouseMove = () => {
            resetOverlayTimeout();
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (overlayTimeoutRef.current) {
                clearTimeout(overlayTimeoutRef.current);
            }
        };
    }, [isProviderMenuOpen, isSidebarOpen]);

    const providerMenuRef = useRef(null);
    const seasonMenuRef = useRef(null);
    const [titleLogo, setTitleLogo] = useState(null);
    const [logoError, setLogoError] = useState(false);

    const title = getTitle(details);
    const anime = mediaType === "tv" && isAnime(details);
    
    const playerUrl = useMemo(
        () => getPlayerUrl(mediaType, id, season, episode, selectedProvider),
        [episode, id, mediaType, season, selectedProvider]
    );

    const seasonsList = useMemo(
        () => details?.seasons?.filter((item) => item.season_number > 0) || [],
        [details]
    );

    const currentSeason = seasonsList.find((item) => item.season_number === season);
    const currentEpisode = episodes.find((item) => item.episode_number === episode);

    const filteredEpisodes = useMemo(() => {
        const query = episodeQuery.trim().toLowerCase();
        if (!query) return episodes;

        return episodes.filter((item) => (
            item.name?.toLowerCase().includes(query) ||
            String(item.episode_number).includes(query)
        ));
    }, [episodeQuery, episodes]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setIsLoading(true);
        setError("");
        setDetails(null);
        setEpisodes([]);
        setEpisodeQuery("");

        const fetchWatchData = async () => {
            try {
                const [detailsData, images] = await Promise.all([
                    tmdbFetch(`/${mediaType}/${id}`),
                    tmdbGetImages(mediaType, id),
                ]);
                setDetails(detailsData);

                // Find title logo
                const logos = images.logos || [];
                const logoPath = logos.find(l => l.iso_639_1 === "en")?.file_path ||
                                 logos.find(l => l.iso_639_1 === null)?.file_path ||
                                 logos[0]?.file_path;
                setTitleLogo(logoPath);
                setLogoError(false);
            } catch (fetchError) {
                console.error("Error loading watch page:", fetchError);
                setError("Unable to load this title right now.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWatchData();
    }, [id, mediaType]);

    useEffect(() => {
        if (mediaType !== "tv" || !id) return;

        const fetchEpisodes = async () => {
            setIsEpisodesLoading(true);
            try {
                const seasonData = await tmdbGetSeason(id, season);
                setEpisodes(seasonData.episodes || []);
            } finally {
                setIsEpisodesLoading(false);
            }
        };

        fetchEpisodes();
    }, [id, mediaType, season]);

    useEffect(() => {
        setIsFrameLoading(true);
    }, [playerUrl]);

    // Update document title
    useEffect(() => {
        if (!details) {
            document.title = "EpicStream";
            return undefined;
        }

        if (mediaType === "tv") {
            const episodeTitle = currentEpisode?.name ? ` - ${currentEpisode.name}` : "";
            document.title = `${title} S${season}:E${episode}${episodeTitle} - EpicStream`;
        } else {
            document.title = `${title} - EpicStream`;
        }

        return () => {
            document.title = "EpicStream";
        };
    }, [currentEpisode, details, episode, mediaType, season, title]);

    // Save history with provider details
    useEffect(() => {
        if (!details) return;
        addToHistory(details, mediaType, mediaType === "tv" ? season : null, mediaType === "tv" ? episode : null, selectedProvider);
    }, [details, episode, mediaType, season, selectedProvider]);

    // Lock body scrolling
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;

        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
        document.body.style.height = "100%";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
            document.body.style.width = originalWidth;
            document.body.style.height = originalHeight;
        };
    }, []);

    // postMessage tracking
    useEffect(() => {
        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return [h, m, s]
                .map((value) => (value < 10 ? `0${value}` : `${value}`))
                .filter((value, index) => value !== "00" || index > 0)
                .join(":");
        };

        const handleMessage = (event) => {
            const trustedOrigins = [
                "https://player.videasy.to",
                "https://player.videasy.net",
                "https://vidlink.pro",
                "https://vidfast.pro",
                "https://vidfast.in",
                "https://vidfast.io",
                "https://vidfast.me",
                "https://vidfast.net",
                "https://vidfast.pm",
                "https://vidfast.xyz",
                "https://vidfast.vc",
                "https://vidfast.bz",
                "https://1embed.cc",
                "https://vidsync.live",
                "https://vidcore.net",
            ];

            if (!trustedOrigins.includes(event.origin)) return;

            try {
                let data = event.data;
                if (typeof data === "string") data = JSON.parse(data);

                let playerState = data?.type === "PLAYER_EVENT" ? data.data : null;

                if (!playerState && data?.type && (data.type === "VIDEO_PROGRESS" || data.type === "VIDEO_NINETY_PERCENT" || data.type === "VIDEO_ENDED")) {
                    const payload = data.payload || {};
                    const time = payload.currentTime !== undefined ? payload.time : payload.time;
                    const duration = payload.duration || 0;
                    let percentage = duration > 0 ? Math.round((time / duration) * 100) : 0;
                    if (data.type === "VIDEO_NINETY_PERCENT") percentage = 90;
                    if (data.type === "VIDEO_ENDED") percentage = 100;

                    playerState = {
                        currentTime: time || 0,
                        time: time || 0,
                        duration: duration || 0,
                        percentage,
                    };
                }

                if (!playerState && data?.type === "VIDSYNC_PLAYER_EVENT") {
                    const vidsyncData = data.data || {};
                    const time = vidsyncData.currentTime !== undefined ? vidsyncData.time : vidsyncData.time;
                    const duration = vidsyncData.duration || 0;
                    const percentage = duration > 0 ? Math.round((time / duration) * 100) : 0;

                    playerState = {
                        currentTime: time || 0,
                        time: time || 0,
                        duration: duration || 0,
                        percentage,
                    };
                }

                if (!playerState && data?.type && (data.type === "timeupdate" || data.type === "ended")) {
                    const vidcoreData = data.data || {};
                    const time = vidcoreData.currentTime;
                    const duration = vidcoreData.duration || 0;
                    let percentage = vidcoreData.percent !== undefined ? Math.round(vidcoreData.percent * 100) : (duration > 0 ? Math.round((time / duration) * 100) : 0);
                    if (data.type === "ended") percentage = 100;

                    playerState = {
                        currentTime: time || 0,
                        time: time || 0,
                        duration: duration || 0,
                        percentage,
                    };
                }

                if (!playerState) {
                    playerState = data?.data || data;
                }

                if (!playerState || (playerState.time === undefined && playerState.currentTime === undefined)) {
                    return;
                }

                const time = playerState.time !== undefined ? playerState.time : playerState.currentTime;
                const duration = playerState.duration || 0;
                const percentage = playerState.percentage !== undefined ? playerState.percentage : (duration > 0 ? Math.round((time / duration) * 100) : 0);

                updateHistoryProgress(id, {
                    percentage,
                    currentTime: time,
                    duration,
                    timeStr: formatTime(time),
                });
            } catch {
                // Ignore errors
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (providerMenuRef.current && !providerMenuRef.current.contains(event.target)) {
                setIsProviderMenuOpen(false);
            }
            if (seasonMenuRef.current && !seasonMenuRef.current.contains(event.target)) {
                setIsSeasonMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const navigateToEpisode = (episodeNumber, targetSeason = season) => {
        setSearchParams({
            season: String(targetSeason),
            episode: String(episodeNumber),
        });
    };

    const handleSeasonChange = (seasonNumber) => {
        setEpisodeQuery("");
        setIsSeasonMenuOpen(false);
        navigateToEpisode(1, seasonNumber);
    };

    return (
        <div className="watch-page">
            {/* Transparent Interaction Overlay to capture mouse events above the iframe when controls are hidden */}
            <div 
                className="watch-interaction-overlay"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 9998,
                    background: "transparent",
                    pointerEvents: showOverlays ? "none" : "auto"
                }}
                onMouseMove={resetOverlayTimeout}
                onClick={resetOverlayTimeout}
            />

            {/* Safe Area Notch-aware floating Back Button */}
            <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className={`watch-back-btn ${showOverlays ? "visible" : ""}`}
            >
                <ChevronLeft size={24} style={{ marginRight: "2px" }} />
            </button>

            {/* Floating Top-Center Provider Selector */}
            <div className={`watch-provider-floating ${showOverlays ? "visible" : ""}`} ref={providerMenuRef}>
                <button
                    type="button"
                    className="watch-provider-btn"
                    onClick={() => setIsProviderMenuOpen(prev => !prev)}
                    aria-expanded={isProviderMenuOpen}
                >
                    <span>Server: {getProviderLabel(selectedProvider)}</span>
                    <ChevronDown size={15} style={{ 
                        transform: isProviderMenuOpen ? "rotate(180deg)" : "rotate(0)", 
                        transition: "transform 0.2s ease" 
                    }} />
                </button>
                {isProviderMenuOpen && (
                    <div className="watch-provider-dropdown">
                        {WATCH_PROVIDERS.map((provider) => (
                            <button
                                key={provider.id}
                                type="button"
                                className={`watch-provider-option ${selectedProvider === provider.id ? "active" : ""}`}
                                onClick={() => {
                                    setSelectedProvider(provider.id);
                                    setIsProviderMenuOpen(false);
                                }}
                            >
                                {provider.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Right-Center Semicircle Sidebar Toggle Handle */}
            {mediaType === "tv" && (
                <button
                    type="button"
                    className={`watch-sidebar-toggle-btn ${showOverlays && !isSidebarOpen ? "visible" : ""}`}
                    onClick={() => setIsSidebarOpen(prev => !prev)}
                    aria-label="Toggle episode list"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Sidebar Drawer Backdrop Overlay */}
            {isSidebarOpen && mediaType === "tv" && (
                <div 
                    className="watch-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Collapsible Slide-In Episodes Sidebar */}
            {mediaType === "tv" && (
                <aside className={`watch-sidebar-drawer ${isSidebarOpen ? "open" : ""}`}>
                    <div className="watch-sidebar-body">
                        {/* One-Line Episode controls at the very top */}
                        <div className="watch-sidebar-controls-wrapper">
                            {anime && (
                                <div style={{ marginBottom: "10px" }}>
                                    <span className="watch-anime-badge">Anime</span>
                                </div>
                            )}
                            <div className="watch-sidebar-controls-row">
                                {/* Search Filter input (first as requested) */}
                                <div className="watch-sidebar-filter">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        value={episodeQuery}
                                        onChange={(e) => setEpisodeQuery(e.target.value)}
                                        placeholder="Filter episodes..."
                                    />
                                </div>

                                {/* Season Selector Dropdown (second as requested) */}
                                {seasonsList.length > 0 && (
                                    <div className="watch-season-menu-wrapper" ref={seasonMenuRef}>
                                        <button
                                            type="button"
                                            className="watch-season-menu-trigger"
                                            onClick={() => setIsSeasonMenuOpen(prev => !prev)}
                                        >
                                            <span>{currentSeason ? `Season ${currentSeason.season_number}` : `Season ${season}`}</span>
                                            <ChevronDown size={14} />
                                        </button>
                                        {isSeasonMenuOpen && (
                                            <div className="watch-season-menu-dropdown">
                                                {seasonsList.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        className={`watch-season-menu-option ${item.season_number === season ? "active" : ""}`}
                                                        onClick={() => handleSeasonChange(item.season_number)}
                                                    >
                                                        {item.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* View Mode Toggle Button (third as requested) */}
                                <button
                                    type="button"
                                    className="watch-sidebar-view-toggle"
                                    onClick={() => setViewMode(prev => prev === "detailed" ? "list" : "detailed")}
                                    title={viewMode === "detailed" ? "Compact View" : "Detailed View"}
                                >
                                    {viewMode === "detailed" ? <List size={16} /> : <LayoutGrid size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Episodes List */}
                        <div 
                            className={`watch-sidebar-episodes ${isScrollingEpisodes ? "is-scrolling" : ""}`}
                            onScroll={handleEpisodesScroll}
                        >
                            {isEpisodesLoading ? (
                                <div className="watch-sidebar-status">
                                    <div className="watch-sidebar-spinner" />
                                    <span>Loading episodes...</span>
                                </div>
                            ) : filteredEpisodes.length > 0 ? (
                                filteredEpisodes.map((item) => (
                                    viewMode === "detailed" ? (
                                        /* Detailed View Card */
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`watch-sidebar-episode-card ${item.episode_number === episode ? "active" : ""}`}
                                            onClick={() => {
                                                navigateToEpisode(item.episode_number);
                                                if (window.innerWidth < 768) {
                                                    setIsSidebarOpen(false);
                                                }
                                            }}
                                        >
                                            <div className="watch-sidebar-episode-thumb">
                                                <img
                                                    src={imageUrl(item.still_path, "w300", "/hero.png")}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                                <span className="watch-sidebar-ep-badge">{item.episode_number}</span>
                                            </div>
                                            <div className="watch-sidebar-episode-info">
                                                <strong>{item.name || `Episode ${item.episode_number}`}</strong>
                                                <p>{item.overview || "No description available."}</p>
                                                <small>{formatDate(item.air_date)}</small>
                                            </div>
                                        </button>
                                    ) : (
                                        /* Compact List View Row */
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`watch-sidebar-episode-row ${item.episode_number === episode ? "active" : ""}`}
                                            onMouseEnter={handleRowMouseEnter}
                                            onMouseLeave={handleRowMouseLeave}
                                            onClick={() => {
                                                navigateToEpisode(item.episode_number);
                                                if (window.innerWidth < 768) {
                                                    setIsSidebarOpen(false);
                                                }
                                            }}
                                        >
                                            <span className="watch-sidebar-ep-row-number">{item.episode_number}</span>
                                            <span className="watch-sidebar-ep-row-title">
                                                <span className="watch-sidebar-ep-row-title-inner">
                                                    {item.name || `Episode ${item.episode_number}`}
                                                </span>
                                            </span>
                                        </button>
                                    )
                                ))
                            ) : (
                                <div className="watch-sidebar-status">
                                    <span>No matching episodes.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            {/* Spinner loader state when changing source */}
            {(isLoading || error) && (
                <div className="watch-state" style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "18px",
                    padding: "24px",
                    background: "rgba(4, 5, 6, 0.88)",
                    color: "#fff",
                    textAlign: "center"
                }}>
                    {!error && <div className="watch-spinner" />}
                    <strong>{error || "Preparing player..."}</strong>
                </div>
            )}

            {!isLoading && !error && (
                <>
                    {isFrameLoading && (
                        <div className="watch-state floating" style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "18px",
                            padding: "24px",
                            background: "rgba(4, 5, 6, 0.54)",
                            color: "#fff",
                            textAlign: "center",
                            pointerEvents: "none"
                        }}>
                            <div className="watch-spinner" />
                            <strong>Loading stream...</strong>
                        </div>
                    )}
                    <iframe
                        src={playerUrl}
                        className="watch-player-iframe"
                        scrolling="no"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture; web-share"
                        title="EpicStream Video Player"
                        onLoad={() => setIsFrameLoading(false)}
                    />
                </>
            )}
        </div>
    );
};

export default WatchPage;
