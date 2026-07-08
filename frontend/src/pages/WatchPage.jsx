/* eslint-disable react/prop-types */
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
    Star,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    formatMediaType,
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

const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s]
        .map((value) => (value < 10 ? `0${value}` : `${value}`))
        .filter((value, index) => value !== "00" || index > 0)
        .join(":");
};

// HLS Video Player Component using dynamic hls.js
const HlsPlayer = ({ src, poster, savedProgress, onProgress }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Clean up previous Hls instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        let hlsInstance = null;

        const loadVideo = () => {
            const isHls = src.includes(".m3u8") || src.includes("m3u8-proxy");

            if (isHls) {
                if (Hls.isSupported()) {
                    hlsInstance = new Hls({
                        maxMaxBufferLength: 30,
                        enableWorker: true,
                    });
                    hlsInstance.loadSource(src);
                    hlsInstance.attachMedia(video);
                    hlsRef.current = hlsInstance;

                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                        if (savedProgress > 0) {
                            video.currentTime = savedProgress;
                        }
                        video.play().catch(() => {});
                    });

                    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hlsInstance.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hlsInstance.recoverMediaError();
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    // Native HLS support (Safari / iOS)
                    video.src = src;
                    video.addEventListener("loadedmetadata", () => {
                        if (savedProgress > 0) {
                            video.currentTime = savedProgress;
                        }
                        video.play().catch(() => {});
                    });
                }
            } else {
                // Direct MP4 / other playable video files
                video.src = src;
                video.addEventListener("loadedmetadata", () => {
                    if (savedProgress > 0) {
                        video.currentTime = savedProgress;
                    }
                    video.play().catch(() => {});
                });
            }
        };

        if (typeof Hls === "undefined") {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
            script.async = true;
            script.onload = loadVideo;
            document.body.appendChild(script);
        } else {
            loadVideo();
        }

        return () => {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        };
    }, [src, savedProgress]);

    // Handle progress events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            if (video.duration) {
                const percentage = Math.round((video.currentTime / video.duration) * 100);
                onProgress({
                    currentTime: video.currentTime,
                    duration: video.duration,
                    percentage,
                });
            }
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, [onProgress, src]);

    return (
        <video
            ref={videoRef}
            className="watch-frame"
            poster={poster}
            controls
            playsInline
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
        />
    );
};

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
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [error, setError] = useState("");
    const [episodeQuery, setEpisodeQuery] = useState("");
    const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);
    
    // Direct stream list and active stream source
    const [streams, setStreams] = useState([]);
    const [activeStream, setActiveStream] = useState(null);
    const [isStreamsLoading, setIsStreamsLoading] = useState(false);

    const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
    const providerMenuRef = useRef(null);
    const seasonMenuRef = useRef(null);
    const [openUpward, setOpenUpward] = useState(false);
    const [titleLogo, setTitleLogo] = useState(null);
    const [logoError, setLogoError] = useState(false);

    const title = getTitle(details);
    const anime = mediaType === "tv" && isAnime(details);

    const savedProgress = useMemo(() => {
        const historyItem = getHistory().find(h => h.id === Number(id));
        if (mediaType === "tv") {
            const isSameEpisode = historyItem?.season === season && historyItem?.episode === episode;
            return isSameEpisode ? Math.floor(historyItem.currentTime || 0) : 0;
        }
        return Math.floor(historyItem?.currentTime || 0);
    }, [id, mediaType, season, episode]);

    const seasonsList = useMemo(
        () => details?.seasons?.filter((item) => item.season_number > 0) || [],
        [details]
    );

    const currentSeason = seasonsList.find((item) => item.season_number === season);
    const currentEpisode = episodes.find((item) => item.episode_number === episode);
    const activeEpisodeIndex = episodes.findIndex((item) => item.episode_number === episode);
    const previousEpisode = activeEpisodeIndex > 0 ? episodes[activeEpisodeIndex - 1] : null;
    const nextEpisode = activeEpisodeIndex > -1 && activeEpisodeIndex < episodes.length - 1
        ? episodes[activeEpisodeIndex + 1]
        : null;

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

    // Fetch video streams from TMDB Embed API
    useEffect(() => {
        if (!id) return;

        const fetchStreams = async () => {
            setIsStreamsLoading(true);
            setError("");
            setStreams([]);
            setActiveStream(null);

            try {
                const apiBase = import.meta.env.VITE_TMDB_EMBED_API_URL || "http://localhost:8787";
                const endpoint = mediaType === "tv"
                    ? `${apiBase}/api/streams/series/${id}/${season}/${episode}`
                    : `${apiBase}/api/streams/movie/${id}`;

                const response = await fetch(endpoint);
                if (!response.ok) throw new Error("Failed to fetch streams");

                const data = await response.json();
                if (data.success && Array.isArray(data.streams) && data.streams.length > 0) {
                    setStreams(data.streams);
                    
                    // Look if there is a saved provider in the history for this title
                    const historyItem = getHistory().find(h => h.id === Number(id));
                    const matchedStream = data.streams.find(s => s.provider === historyItem?.provider);
                    
                    // Default to matched provider, or falls back to first stream
                    setActiveStream(matchedStream || data.streams[0]);
                } else {
                    setError("No streaming sources found for this title.");
                }
            } catch (err) {
                console.error("Error fetching direct streams:", err);
                setError("Unable to connect to the streaming server. Please ensure the API is running.");
            } finally {
                setIsStreamsLoading(false);
            }
        };

        fetchStreams();
    }, [id, mediaType, season, episode]);

    useEffect(() => {
        if (!details) return;
        addToHistory(details, mediaType, mediaType === "tv" ? season : null, mediaType === "tv" ? episode : null, activeStream?.provider || null);
    }, [details, episode, mediaType, season, activeStream]);

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

    useEffect(() => {
        if (isProviderMenuOpen && providerMenuRef.current) {
            const rect = providerMenuRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = 180;
            if (spaceBelow < menuHeight) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    }, [isProviderMenuOpen]);

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

    const releaseDate = details?.release_date || details?.first_air_date;
    const runtime = mediaType === "movie"
        ? formatRuntime(details?.runtime)
        : formatRuntime(currentEpisode?.runtime || details?.episode_run_time?.[0]);
    const rating = details?.vote_average ? details.vote_average.toFixed(1) : null;
    const overview = currentEpisode?.overview || details?.overview || "No description available.";
    const backdrop = details?.backdrop_path || details?.poster_path;
    const poster = details?.poster_path || details?.backdrop_path;

    return (
        <div className="watch-page">
            {backdrop && (
                <img className="watch-backdrop" src={imageUrl(backdrop, "original")} alt="" />
            )}
            <div className="watch-shade" />

            <main className={`watch-shell ${mediaType === "movie" ? "movie-mode" : "series-mode"}`}>
                <section className="watch-main-grid">
                    <div className="watch-primary">
                        <section className="watch-player-card" aria-label={`${title} player`}>
                            {(isLoading || isStreamsLoading || error) && (
                                <div className="watch-state">
                                    {!error && <div className="watch-spinner" />}
                                    <strong>{error || (isLoading ? "Preparing player..." : "Fetching video streams...")}</strong>
                                </div>
                            )}

                            {!isLoading && !isStreamsLoading && !error && activeStream && (
                                <HlsPlayer
                                    src={activeStream.url}
                                    poster={imageUrl(backdrop, "original")}
                                    savedProgress={savedProgress}
                                    onProgress={(progress) => {
                                        updateHistoryProgress(id, {
                                            percentage: progress.percentage,
                                            currentTime: progress.currentTime,
                                            duration: progress.duration,
                                            timeStr: formatTime(progress.currentTime),
                                        });
                                    }}
                                />
                            )}
                        </section>

                        <div className="watch-quick-nav">
                            <div className="watch-quick-nav-left">
                                {mediaType === "tv" && (
                                    <>
                                        <button
                                            type="button"
                                            className="watch-nav-btn"
                                            disabled={!previousEpisode}
                                            onClick={() => previousEpisode && navigateToEpisode(previousEpisode.episode_number)}
                                        >
                                            <ChevronLeft size={15} />
                                            Prev
                                        </button>
                                        <button
                                            type="button"
                                            className="watch-nav-btn"
                                            disabled={!nextEpisode}
                                            onClick={() => nextEpisode && navigateToEpisode(nextEpisode.episode_number)}
                                        >
                                            Next
                                            <ChevronRight size={15} />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="watch-server-box" ref={providerMenuRef}>
                                <button
                                    type="button"
                                    className="watch-server-trigger"
                                    onClick={() => setIsProviderMenuOpen((value) => !value)}
                                    aria-expanded={isProviderMenuOpen}
                                >
                                    <strong>
                                        {activeStream ? activeStream.title || activeStream.name : "Select Source"}
                                        <ChevronDown size={16} />
                                    </strong>
                                </button>
                                {isProviderMenuOpen && streams.length > 0 && (
                                    <div className={`watch-provider-menu ${openUpward ? "open-up" : ""}`}>
                                        {streams.map((stream, idx) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                className={activeStream?.url === stream.url ? "active" : ""}
                                                onClick={() => {
                                                    setActiveStream(stream);
                                                    setIsProviderMenuOpen(false);
                                                }}
                                            >
                                                {stream.title || stream.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {mediaType === "tv" && (
                        <aside className="watch-side-panel">
                            <div className="watch-sidebar-controls">
                                <label className="watch-filter">
                                    <Search size={16} />
                                    <input
                                        ref={episodeFilterRef}
                                        value={episodeQuery}
                                        onChange={(event) => setEpisodeQuery(event.target.value)}
                                        placeholder="Filter episodes..."
                                    />
                                </label>

                                {seasonsList.length > 0 && (
                                    <div className="watch-season-menu" ref={seasonMenuRef}>
                                        <button
                                            type="button"
                                            className="watch-season-trigger"
                                            onClick={() => setIsSeasonMenuOpen((value) => !value)}
                                            aria-expanded={isSeasonMenuOpen}
                                        >
                                            {currentSeason?.name || `Season ${season}`}
                                            <ChevronDown size={16} />
                                        </button>
                                        {isSeasonMenuOpen && (
                                            <div className="watch-season-list">
                                                {seasonsList.map((item) => (
                                                    <button
                                                        type="button"
                                                        key={item.id}
                                                        className={item.season_number === season ? "active" : ""}
                                                        onClick={() => handleSeasonChange(item.season_number)}
                                                    >
                                                        {item.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="watch-episode-list">
                                {isEpisodesLoading ? (
                                    <div className="watch-panel-empty">Loading episodes...</div>
                                ) : filteredEpisodes.length > 0 ? (
                                    filteredEpisodes.map((item) => (
                                        <button
                                            type="button"
                                            key={item.id}
                                            className={`watch-episode-card ${item.episode_number === episode ? "active" : ""}`}
                                            onClick={() => navigateToEpisode(item.episode_number)}
                                        >
                                            <div className="watch-episode-thumb">
                                                <img
                                                    src={imageUrl(item.still_path, "w300", "/hero.png")}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                                <span>EP {item.episode_number}</span>
                                            </div>
                                            <div className="watch-episode-copy">
                                                <strong>{item.name || `Episode ${item.episode_number}`}</strong>
                                                <p>{item.overview || "No description available."}</p>
                                                <small>{formatDate(item.air_date)}</small>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="watch-panel-empty">No matching episodes.</div>
                                )}
                            </div>
                        </aside>
                    )}
                </section>

                <section className="watch-details">
                    <div className="watch-poster-wrap">
                        <img src={imageUrl(poster, "w500", "/hero.png")} alt="" loading="lazy" />
                    </div>

                    <div className="watch-details-copy">
                        <div className="watch-title-row">
                            <div className="watch-title-container">
                                {!logoError && titleLogo ? (
                                    <img 
                                        src={imageUrl(titleLogo, "w500")} 
                                        alt={title} 
                                        className="watch-title-logo"
                                        onError={() => setLogoError(true)}
                                    />
                                ) : (
                                    <h2>{title}</h2>
                                ) }
                            </div>
                        </div>

                        <div className="watch-meta-row">
                            {rating && (
                                <>
                                    <span className="rating">
                                        <Star size={13} fill="currentColor" />
                                        {rating}
                                    </span>
                                    <span className="dot" />
                                </>
                            )}
                            <span>{anime ? "Anime" : formatMediaType(mediaType)}</span>
                            {releaseDate && (
                                <>
                                    <span className="dot" />
                                    <span>{formatDate(releaseDate)}</span>
                                </>
                            )}
                            {runtime && (
                                <>
                                    <span className="dot" />
                                    <span>{runtime}</span>
                                </>
                            )}
                        </div>

                        {mediaType === "tv" && currentEpisode && (
                            <h3 className="watch-episode-title">
                                {currentEpisode.name || `Episode ${currentEpisode.episode_number}`}
                            </h3>
                        )}

                        <p className="watch-overview">{overview}</p>

                        {details?.genres?.length > 0 && (
                            <div className="watch-genres">
                                {details.genres.slice(0, 5).map((genre) => (
                                    <span key={genre.id}>{genre.name}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default WatchPage;
