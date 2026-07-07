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
    ACTIVE_PROVIDER,
    formatMediaType,
    getPlayerUrl,
    getTitle,
    imageUrl,
    tmdbFetch,
    tmdbGetImages,
    tmdbGetSeason,
} from "../utils/tmdb";
import { addToHistory, updateHistoryProgress } from "../utils/history";
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

const WATCH_PROVIDERS = ["vidlink", "vidsync", "videasy", "1embed", "vidfast", "vidcore"];





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
    const [selectedProvider, setSelectedProvider] = useState(ACTIVE_PROVIDER);
    const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
    const providerMenuRef = useRef(null);
    const seasonMenuRef = useRef(null);
    const [openUpward, setOpenUpward] = useState(false);
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

    useEffect(() => {
        setIsFrameLoading(true);
    }, [playerUrl]);

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
        if (!details) return;
        addToHistory(details, mediaType, mediaType === "tv" ? season : null, mediaType === "tv" ? episode : null);
    }, [details, episode, mediaType, season]);

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

                // Handle 1Embed progress/ninety_percent/ended events
                if (!playerState && data?.type && (data.type === "VIDEO_PROGRESS" || data.type === "VIDEO_NINETY_PERCENT" || data.type === "VIDEO_ENDED")) {
                    const payload = data.payload || {};
                    const time = payload.currentTime !== undefined ? payload.currentTime : payload.time;
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

                // Handle VidSync events
                if (!playerState && data?.type === "VIDSYNC_PLAYER_EVENT") {
                    const vidsyncData = data.data || {};
                    const time = vidsyncData.currentTime !== undefined ? vidsyncData.currentTime : vidsyncData.time;
                    const duration = vidsyncData.duration || 0;
                    const percentage = duration > 0 ? Math.round((time / duration) * 100) : 0;

                    playerState = {
                        currentTime: time || 0,
                        time: time || 0,
                        duration: duration || 0,
                        percentage,
                    };
                }

                // Handle VidCore events
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
                // Ignore malformed provider messages.
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
                            {(isLoading || error) && (
                                <div className="watch-state">
                                    {!error && <div className="watch-spinner" />}
                                    <strong>{error || "Preparing player..."}</strong>
                                </div>
                            )}

                            {!isLoading && !error && (
                                <>
                                    {isFrameLoading && (
                                        <div className="watch-state floating">
                                            <div className="watch-spinner" />
                                            <strong>Loading stream...</strong>
                                        </div>
                                    )}
                                    <iframe
                                        key={playerUrl}
                                        className="watch-frame"
                                        src={playerUrl}
                                        title={`${title} player`}
                                        allow="autoplay; fullscreen *; encrypted-media; picture-in-picture; allow-presentation"
                                        allowFullScreen
                                        onLoad={() => setIsFrameLoading(false)}
                                    />
                                </>
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
                                        {getProviderLabel(selectedProvider)}
                                        <ChevronDown size={16} />
                                    </strong>
                                </button>
                                {isProviderMenuOpen && (
                                    <div className={`watch-provider-menu ${openUpward ? "open-up" : ""}`}>
                                        {WATCH_PROVIDERS.map((provider) => (
                                            <button
                                                type="button"
                                                key={provider}
                                                className={selectedProvider === provider ? "active" : ""}
                                                onClick={() => {
                                                    setSelectedProvider(provider);
                                                    setIsProviderMenuOpen(false);
                                                }}
                                            >
                                                {getProviderLabel(provider)}
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
                                )}
                            </div>
                            {anime && <span className="watch-anime-badge">Anime</span>}
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
