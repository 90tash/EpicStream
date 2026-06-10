import { ChevronDown, ExternalLink, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { formatMediaType, getTitle, imageUrl, tmdbFetch } from "../utils/tmdb";
import "./watchPage.css";

const providers = [
    { id: "vidlink", label: "VidLink", showLoading: false },
    { id: "rive", label: "Rive", showLoading: true },
    { id: "playimdb", label: "PlayIMDb", showLoading: true },
];

const getPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [selectedProvider, setSelectedProvider] = useState("vidlink");
    const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
    const [content, setContent] = useState(null);
    const [imdbId, setImdbId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFrameLoading, setIsFrameLoading] = useState(true);
    const [error, setError] = useState("");

    const mediaType = type === "tv" ? "tv" : "movie";
    const season = getPositiveInt(searchParams.get("season"), 1);
    const episode = getPositiveInt(searchParams.get("episode"), 1);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchContent = async () => {
            setIsLoading(true);
            setError("");

            try {
                if (mediaType === "movie") {
                    const movieData = await tmdbFetch(`/movie/${id}`);
                    setContent(movieData);
                    setImdbId(movieData.imdb_id || null);
                } else {
                    const [tvData, idsData] = await Promise.all([
                        tmdbFetch(`/tv/${id}`),
                        tmdbFetch(`/tv/${id}/external_ids`),
                    ]);

                    setContent(tvData);
                    setImdbId(idsData.imdb_id || null);
                }
            } catch (fetchError) {
                console.error("Error loading watch page:", fetchError);
                setError("Unable to load this title right now.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [id, mediaType]);

    const providerUrls = useMemo(() => {
        const vidlinkParams = "primaryColor=ff0000&secondaryColor=9c7777&iconColor=ffffff&icons=default&player=default&title=true&poster=true&autoplay=false&nextbutton=true";
        const vidlinkUrl = mediaType === "tv"
            ? `https://vidlink.pro/tv/${id}/${season}/${episode}?${vidlinkParams}`
            : `https://vidlink.pro/movie/${id}?${vidlinkParams}`;

        const riveBase = `https://rivestream.ru/embed?type=${mediaType}&id=${id}`;
        const riveUrl = mediaType === "tv"
            ? `${riveBase}&season=${season}&episode=${episode}`
            : riveBase;

        const playImdbUrl = imdbId
            ? mediaType === "tv"
                ? `https://playimdb.com/e/${imdbId}?s=${season}&e=${episode}`
                : `https://playimdb.com/e/${imdbId}`
            : "";

        return {
            vidlink: vidlinkUrl,
            rive: riveUrl,
            playimdb: playImdbUrl,
        };
    }, [episode, id, imdbId, mediaType, season]);

    const selectedUrl = providerUrls[selectedProvider];
    const selectedProviderLabel = providers.find((provider) => provider.id === selectedProvider)?.label || "VidLink";
    const title = getTitle(content);
    const backdrop = content?.backdrop_path || content?.poster_path;

    useEffect(() => {
        setIsFrameLoading(true);
    }, [selectedUrl]);

    const handleClose = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    return (
        <div className="watch-page">
            {backdrop && (
                <img
                    className="watch-backdrop"
                    src={imageUrl(backdrop, "original")}
                    alt=""
                />
            )}
            <div className="watch-shade" />

            <button type="button" className="watch-close" onClick={handleClose} aria-label="Close player">
                <X size={32} />
            </button>

            <main className="watch-shell">
                <section className="watch-player-wrap" aria-label={`${title} player`}>
                    {isLoading || error || !selectedUrl ? (
                        <div className="watch-state">
                            {!error && !selectedUrl && selectedProvider === "playimdb" ? (
                                <>
                                    <div className="watch-spinner" />
                                    <strong>FETCHING PROVIDER, PLEASE WAIT....</strong>
                                </>
                            ) : error ? (
                                <strong>{error}</strong>
                            ) : (
                                <>
                                    <div className="watch-spinner" />
                                    <strong>FETCHING DATA, PLEASE WAIT....</strong>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {isFrameLoading && providers.find(p => p.id === selectedProvider)?.showLoading && (
                                <div className="watch-state floating">
                                    <div className="watch-spinner" />
                                    <strong>FETCHING DATA, PLEASE WAIT....</strong>
                                </div>
                            )}
                            <iframe
                                key={selectedUrl}
                                className="watch-frame"
                                src={selectedUrl}
                                title={`${title} on ${providers.find(provider => provider.id === selectedProvider)?.label}`}
                                allow="autoplay; fullscreen *; encrypted-media; picture-in-picture; allow-presentation"
                                allowFullScreen
                                webkitallowfullscreen={true}
                                mozallowfullscreen={true}
                                oallowfullscreen={true}
                                msallowfullscreen={true}
                                onLoad={() => setIsFrameLoading(false)}
                            />
                        </>
                    )}
                </section>

                <section className="watch-controls" aria-label="Playback controls">
                    <div className="watch-provider-field" aria-label="Selected provider">
                        <button
                            type="button"
                            className="watch-provider-trigger"
                            onClick={() => setIsProviderMenuOpen((value) => !value)}
                            aria-expanded={isProviderMenuOpen}
                        >
                            {selectedProviderLabel}
                            <ChevronDown size={20} className={isProviderMenuOpen ? "open" : ""} />
                        </button>

                        {isProviderMenuOpen && (
                            <div className="watch-provider-menu">
                                {providers.map((provider) => (
                                    <button
                                        type="button"
                                        key={provider.id}
                                        className={`watch-provider-option ${selectedProvider === provider.id ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedProvider(provider.id);
                                            setIsProviderMenuOpen(false);
                                        }}
                                    >
                                        {provider.label}
                                        {selectedProvider === provider.id && <span className="watch-active-dot" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <a
                        className={`watch-open-link ${selectedUrl ? "" : "disabled"}`}
                        href={selectedUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!selectedUrl}
                        aria-label="Open provider"
                        title="Open provider"
                    >
                        <ExternalLink size={18} />
                    </a>
                </section>

                <div className="watch-meta">
                    <span>{title}</span>
                    <span>{formatMediaType(mediaType)}</span>
                    {mediaType === "tv" && (
                        <>
                            <span>Season {season}</span>
                            <span>Episode {episode}</span>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WatchPage;
