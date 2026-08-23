import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef, Fragment } from "react";
import { ChevronLeft, ChevronRight, Star, ChevronDown, LayoutGrid, Plus, Check, X, Bookmark, Heart, Play, Eye, Info } from "lucide-react";
import "./movieTvDetails.css";
import toast from "react-hot-toast";
import ListModal from "../components/ListModal";
import { getTitle, imageUrl, tmdbFetch, tmdbGetSeason, tmdbGetRecommendations, tmdbGetImages, prioritizeSimilarContent, getStatusLabel } from "../utils/tmdb";
import { addToHistory, getWatchedEpisodes, removeEpisodeWatched, getHistory, removeFromHistory } from "../utils/history";
import { useWatchlistStore } from "../stores/watchlist";
import { useCustomListsStore } from "../stores/customLists";


const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
};

const formatEpisodeDate = (dateStr) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${monthName} ${day}, ${year}`;
    } catch {
        return dateStr;
    }
};

/* eslint-disable react/prop-types */
const SimilarCard = ({ item, type, navigate, onAddToList, activeListItemId }) => {
    const [bannerUrl, setBannerUrl] = useState(imageUrl(item.backdrop_path || item.poster_path, "w780"));
    const [isWatched, setIsWatched] = useState(() => getHistory().some(h => h.id === item.id));
    const [isMobileActive, setIsMobileActive] = useState(false);
    const isListOpen = activeListItemId === item.id;
    const cardRef = useRef(null);

    useEffect(() => {
        const fetchTitledBanner = async () => {
            try {
                const data = await tmdbGetImages(type, item.id);
                if (data.backdrops && data.backdrops.length > 0) {
                    const titledBackdrops = data.backdrops.filter(b => b.iso_639_1 !== null);
                    if (titledBackdrops.length > 0) {
                        const enTitled = titledBackdrops.find(b => b.iso_639_1 === 'en');
                        const selected = enTitled || titledBackdrops[0];
                        setBannerUrl(imageUrl(selected.file_path, "w780"));
                    }
                }
            } catch (error) {
                console.error("Error fetching images for similar item:", error);
            }
        };
        fetchTitledBanner();
    }, [item.id, type]);

    const handlePlay = (e) => {
        e.stopPropagation();
        addToHistory(item, type, type === "tv" ? 1 : null, type === "tv" ? 1 : null);
        navigate(`/watch/${type}/${item.id}${type === "tv" ? "?season=1&episode=1" : ""}`);
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
                e.stopPropagation();
                setIsMobileActive(true);
                return;
            }
        }
        navigate(`/${type}/${item.id}`, { state: { movie: item } });
        window.scrollTo(0, 0);
    };

    const isCardActive = isMobileActive || isListOpen;

    return (
        <div 
            ref={cardRef}
            className={`similar-card ${isCardActive ? "mobile-active" : ""}`} 
            onClick={handleCardClick}
        >
            <div className="similar-card-img-wrapper">
                <picture>
                    <source media="(max-width: 900px)" srcSet={imageUrl(item.poster_path || item.backdrop_path, "w500")} />
                    <img
                        src={bannerUrl}
                        alt={getTitle(item)}
                        loading="lazy"
                    />
                </picture>
                <div className="similar-card-shade" />
                
                {/* Mobile view info overlay */}
                <div className="card-mobile-info-container">
                    <div className="card-mobile-title">{getTitle(item)}</div>
                    <div className="card-mobile-meta">
                        {typeof item.vote_average === 'number' && item.vote_average > 0 && (
                            <span className="mobile-rating-wrapper">
                                <Star size={10} fill="currentColor" className="mobile-rating-star" />
                                <span className="rating-mono">{item.vote_average.toFixed(1)}</span> • 
                            </span>
                        )}
                        {((item.release_date || item.first_air_date || "").slice(0, 4)) && (
                            <span>{(item.release_date || item.first_air_date || "").slice(0, 4)} • </span>
                        )}
                        <span>{type === "movie" ? "Movie" : "TV Show"}</span>
                    </div>
                </div>

                <div className={`card-hover-actions${isCardActive ? ' force-show' : ''}`}>
                    <button 
                        className="card-action-btn hover-play-btn"
                        title="Play"
                        onClick={handlePlay}
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                    <button 
                        className="card-action-btn"
                        title="Info"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/${type}/${item.id}`, { state: { movie: item } });
                            window.scrollTo(0, 0);
                        }}
                    >
                        <Info size={16} />
                    </button>
                    <button 
                        className="card-action-btn"
                        title={isWatched ? "Remove from Watched" : "Mark as Watched"}
                        onClick={handleWatched}
                    >
                        <Eye size={16} color={isWatched ? "#4cd964" : "currentColor"} />
                    </button>
                    <button 
                        className="card-action-btn"
                        title="Add to List"
                        onClick={(e) => { e.stopPropagation(); if(onAddToList) { const rect = e.currentTarget.getBoundingClientRect(); onAddToList({ item, rect }); } }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
            <span className="similar-card-title">{getTitle(item)}</span>
            <div className="similar-card-meta">
                {item.vote_average > 0 && (
                    <span className="rating-value-wrapper">
                        <Star size={13} fill="currentColor" /> 
                        {item.vote_average.toFixed(1)}
                    </span>
                )}
                {((item.release_date || item.first_air_date || "").slice(0, 4)) && (
                    <span>{(item.release_date || item.first_air_date || "").slice(0, 4)}</span>
                )}
                <span>{type === "movie" ? "Movie" : "TV Show"}</span>
            </div>
        </div>
    );
};

const TvDetails = () => {
    const { state } = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [tv, setTv] = useState(() => state?.movie || null);
    const [cast, setCast] = useState([]);
    const [similarTv, setSimilarTv] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [showFullOverview, setShowFullOverview] = useState(false);
    const [logoFetched, setLogoFetched] = useState(false);
    const [showPlayWarning, setShowPlayWarning] = useState(false);
    const [listModalItem, setListModalItem] = useState(null);

    const { toggleItem, isItemInList } = useWatchlistStore();
    const { customLists, toggleItemInList, getListsForItem, createList } = useCustomListsStore();
    const [showListDropdown, setShowListDropdown] = useState(false);
    const [isCreatingInline, setIsCreatingInline] = useState(false);
    const [newListNameInline, setNewListNameInline] = useState("");
    const dropdownRef = useRef(null);
    const inlineInputRefDesktop = useRef(null);
    const inlineInputRefMobile = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest('.collection-modal-overlay')) {
                return;
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowListDropdown(false);
                setIsCreatingInline(false);
                setNewListNameInline("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isCreatingInline) {
            if (inlineInputRefDesktop.current) {
                inlineInputRefDesktop.current.focus();
            }
            if (inlineInputRefMobile.current) {
                inlineInputRefMobile.current.focus();
            }
        }
    }, [isCreatingInline]);

    useEffect(() => {
        if (!showListDropdown) {
            setIsCreatingInline(false);
            setNewListNameInline("");
        }
    }, [showListDropdown]);

    const seasonRef = useRef(null);
    const castSliderRef = useRef(null);
    const episodeSliderRef = useRef(null);
    const similarSliderRef = useRef(null);

    const scrollCast = (direction) => {
        if (!castSliderRef.current) return;
        const { scrollLeft, clientWidth } = castSliderRef.current;
        castSliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75,
            behavior: "smooth",
        });
    };

    const scrollEpisodes = (direction) => {
        if (!episodeSliderRef.current) return;
        const { scrollLeft, clientWidth } = episodeSliderRef.current;
        episodeSliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75,
            behavior: "smooth",
        });
    };

    const scrollSimilar = (direction) => {
        if (!similarSliderRef.current) return;
        const { scrollLeft, clientWidth } = similarSliderRef.current;
        similarSliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75,
            behavior: "smooth",
        });
    };

    // Episodes & Seasons State
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [showSeasonMenu, setShowSeasonMenu] = useState(false);
    const [episodes, setEpisodes] = useState([]);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
    const [watchedEpisodes, setWatchedEpisodes] = useState({});

    // Sync basic state from location
    useEffect(() => {
        if (state?.movie) {
            setTv(state.movie);
        }
    }, [id, state]);

    // Fetch watched episodes for this TV show
    useEffect(() => {
        if (id) {
            setWatchedEpisodes(getWatchedEpisodes(Number(id)));
        }
    }, [id]);

    useEffect(() => {
        if (tv) {
            document.title = `${getTitle(tv)} - EpicStream`;
        } else {
            document.title = "EpicStream";
        }
        return () => {
            document.title = "EpicStream";
        };
    }, [tv]);



    // 1. Always fetch full TV details (including seasons) on mount or ID change

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (seasonRef.current && !seasonRef.current.contains(event.target)) {
                setShowSeasonMenu(false);
            }
        };

        if (showSeasonMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showSeasonMenu]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLogoError(false);
        setShowFullOverview(false);
        setLogoFetched(false);

        const fetchAllData = async () => {
            try {
                // Fetch TV details and images concurrently to prevent any delay
                const [fullTvData, images] = await Promise.all([
                    tmdbFetch(`/tv/${id}`),
                    tmdbGetImages("tv", id)
                ]);

                // Find the best title logo (English first, then untagged/null, then any)
                const logos = images.logos || [];
                const titleLogo = logos.find(l => l.iso_639_1 === "en")?.file_path ||
                                  logos.find(l => l.iso_639_1 === null)?.file_path ||
                                  logos[0]?.file_path;

                setTv({ ...fullTvData, title_logo: titleLogo });
                setLogoFetched(true);

                // Initialize first season
                if (fullTvData.seasons?.length > 0) {
                    const firstSeason = fullTvData.seasons.find(s => s.season_number > 0) || fullTvData.seasons[0];
                    setSelectedSeason(firstSeason.season_number);
                }

                // Fetch other secondary data (credits, recommendations)
                const [castData, recsData] = await Promise.all([
                    tmdbFetch(`/tv/${id}/credits`),
                    tmdbGetRecommendations("tv", id)
                ]);
                
                setCast(castData.cast.slice(0, 10));
                const prioritizedRecs = prioritizeSimilarContent(fullTvData, recsData);
                setSimilarTv(prioritizedRecs.slice(0, 10));
            } catch (error) {
                console.error("Error fetching TV data:", error);
                setLogoFetched(true);
                if (!tv && !state?.movie) navigate("/", { replace: true });
            }
        };

        fetchAllData();
    }, [id]);



    // 2. Fetch episodes whenever the selected season changes
    useEffect(() => {
        if (!id || selectedSeason === null) return;

        const fetchEpisodes = async () => {
            setIsLoadingEpisodes(true);
            const data = await tmdbGetSeason(id, selectedSeason);
            setEpisodes(data.episodes || []);
            setIsLoadingEpisodes(false);
        };

        fetchEpisodes();
    }, [id, selectedSeason]);

    if (!tv) {
        return (
            <div className="loading-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040506' }}>
                <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', borderTopColor: 'var(--accent)', animation: 'rotate 1s linear infinite' }} />
            </div>
        );
    }

    const title = getTitle(tv);
    const releaseYear = (tv.first_air_date || tv.release_date || "").slice(0, 4);
    const rating = tv.vote_average ? tv.vote_average.toFixed(1) : null;
    const activeLists = getListsForItem(tv.id);
    const inAnyList = activeLists.length > 0;
    const inList = isItemInList(tv.id);

    const handleCreateListInline = (e) => {
        if (e) e.preventDefault();
        const trimmed = newListNameInline.trim();
        if (!trimmed) return;
        const res = createList(trimmed);
        if (res.success) {
            toast.success(`List "${res.list.name}" created!`);
            toggleItemInList(res.list.id, tv, "tv");
            setNewListNameInline("");
            if (inlineInputRefDesktop.current) {
                inlineInputRefDesktop.current.value = "";
                inlineInputRefDesktop.current.blur();
            }
            if (inlineInputRefMobile.current) {
                inlineInputRefMobile.current.value = "";
                inlineInputRefMobile.current.blur();
            }
            setIsCreatingInline(false);
        } else {
            toast.error(res.error || "Failed to create list.");
        }
    };

    // Filter for the dropdown
    const seasonsList = tv.seasons?.filter(s => s.season_number > 0) || [];
    const currentSeasonName = seasonsList.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`;

    return (
        <div className="details-page">
            <button className="back-btn" onClick={() => navigate("/")} aria-label="Go back">
                <ChevronLeft size={24} />
            </button>
            
            <section className="details-hero">
                <div className="details-hero-image-wrapper">
                    <img
                        className="details-hero-image"
                        src={imageUrl(tv.backdrop_path || tv.poster_path, "original")}
                        alt={title}
                    />
                </div>
                <div className="details-hero-shade" />
                <div className="details-hero-content">
                    <div className="details-hero-text">
                        {!logoError && tv?.title_logo ? (
                            <div className="hero-logo-container">
                                <img 
                                    src={imageUrl(tv.title_logo, "w500")} 
                                    alt={title} 
                                    className="hero-title-logo"
                                    onError={() => setLogoError(true)}
                                />
                            </div>
                        ) : logoFetched ? (
                            <h1>{title}</h1>
                        ) : null}
                        <div className="details-actions">
                            <button 
                                className="details-play" 
                                onClick={() => {
                                    const status = getStatusLabel(tv);
                                    if (status && (status.text === "In Cinemas" || status.text === "Upcoming")) {
                                        setShowPlayWarning(true);
                                    } else {
                                        addToHistory(tv, "tv", selectedSeason || 1, 1);
                                        navigate(`/watch/tv/${id}?season=${selectedSeason || 1}&episode=1`);
                                    }
                                }}
                            >
                                <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                                    <path d="M9.5 4.3c-1.3-0.8-3 0.1-3 1.7v12c0 1.6 1.7 2.5 3 1.7l9.5-6c1.1-0.7 1.1-2.4 0-3.1l-9.5-6z" />
                                </svg>
                                <span>Play</span>
                            </button>

                            <div className="add-to-list-wrapper" ref={dropdownRef}>
                                <button 
                                    className={`details-action-btn add-list-btn ${inAnyList ? 'active' : ''}`}
                                    onClick={() => setShowListDropdown(!showListDropdown)}
                                    title="Add to List"
                                    aria-label="Add to List"
                                >
                                    {inAnyList ? <Bookmark size={20} fill="currentColor" /> : <Plus size={20} />}
                                </button>

                                <button 
                                    className="details-action-btn" 
                                    onClick={() => document.getElementById('episodes')?.scrollIntoView({ behavior: 'smooth' })}
                                    title="View Episodes"
                                    aria-label="View Episodes"
                                >
                                    <LayoutGrid size={20} />
                                </button>

                                {showListDropdown && (
                                    <div className="season-dropdown-menu lists-menu desktop-only">
                                        <div className="dropdown-options">
                                            <button 
                                                className={`season-option ${activeLists.includes("watchlist") ? 'active' : ''}`}
                                                onClick={() => toggleItemInList("watchlist", tv, "tv")}
                                            >
                                                <span className="season-option-text">My Watchlist</span>
                                                {activeLists.includes("watchlist") && <Check size={16} className="active-tick" />}
                                            </button>

                                            {customLists.map(list => (
                                                <button 
                                                    key={list.id}
                                                    className={`season-option ${activeLists.includes(list.id) ? 'active' : ''}`}
                                                    onClick={() => toggleItemInList(list.id, tv, "tv")}
                                                >
                                                    <span className="season-option-text">{list.name}</span>
                                                    {activeLists.includes(list.id) && <Check size={16} className="active-tick" />}
                                                </button>
                                            ))}
                                        </div>

                                        {isCreatingInline ? (
                                            <div className="dropdown-inline-create-container">
                                                <form className="dropdown-inline-create" onSubmit={handleCreateListInline}>
                                                    <input 
                                                        key="desktop-inline-input"
                                                        ref={inlineInputRefDesktop}
                                                        type="text"
                                                        className="inline-create-input"
                                                        placeholder="New list name..."
                                                        value={newListNameInline}
                                                        onChange={(e) => setNewListNameInline(e.target.value.slice(0, 50))}
                                                        maxLength={50}
                                                    />
                                                    <span className="inline-create-divider" />
                                                    <button 
                                                        type="submit" 
                                                        className="inline-create-submit-tick" 
                                                        disabled={!newListNameInline.trim()}
                                                        onClick={handleCreateListInline}
                                                        aria-label="Create List"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                </form>
                                            </div>
                                        ) : (
                                            <button 
                                                className="season-option create-list-option"
                                                style={{ color: 'var(--accent)', justifyContent: 'flex-start', gap: '8px' }}
                                                onClick={() => setIsCreatingInline(true)}
                                            >
                                                <Plus size={14} />
                                                <span className="season-option-text">Create New List</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="details-hero-meta">
                            {rating && (
                                <span className="rating">
                                    <Star size={15} fill="currentColor" />
                                    {rating}
                                </span>
                            )}
                            <span>TV Show</span>
                            <span className="maturity">{tv.adult ? "18+" : "12+"}</span>
                        </div>
                        <div className="director-synopsis-group">
                             {tv.created_by?.length > 0 && (
                                 <div className="details-hero-director">
                                     <span className="director-label">Creator:</span>
                                     <span className="director-value">
                                         {tv.created_by.map((c, idx) => (
                                             <Fragment key={c.id}>
                                                 {idx > 0 && ", "}
                                                 <Link to={`/person/${c.id}`} className="person-link">
                                                     {c.name}
                                                 </Link>
                                             </Fragment>
                                         ))}
                                     </span>
                                 </div>
                             )}
                            {tv.overview && (
                                <div className="synopsis-container">
                                    <p className="details-hero-overview">
                                        {showFullOverview || tv.overview.length <= 240
                                            ? tv.overview
                                            : `${tv.overview.slice(0, 240)}...`}
                                    </p>
                                    {tv.overview.length > 240 && (
                                        <button 
                                            type="button"
                                            className="read-more-btn"
                                            onClick={() => setShowFullOverview(!showFullOverview)}
                                        >
                                            {showFullOverview ? "Read Less" : "Read More"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="details-hero-side-bar tv-sidebar">
                        <div className="side-bar-item">
                            <span className="side-bar-label">Status</span>
                            <span className="side-bar-value">{tv.status || "N/A"}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Language</span>
                            <span className="side-bar-value">{(tv.original_language || "EN").toUpperCase()}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Genres</span>
                            <span className="side-bar-value">{tv.genres?.map(g => g.name).join(" • ") || "N/A"}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">First Aired</span>
                            <span className="side-bar-value">{formatDate(tv.first_air_date)}</span>
                        </div>
                        {tv.last_air_date && (
                            <div className="side-bar-item">
                                <span className="side-bar-label">Last Aired</span>
                                <span className="side-bar-value">{formatDate(tv.last_air_date)}</span>
                            </div>
                        )}
                        <div className="side-bar-item">
                            <span className="side-bar-label">Seasons</span>
                            <span className="side-bar-value">{tv.number_of_seasons || "N/A"}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Episodes</span>
                            <span className="side-bar-value">{tv.number_of_episodes || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </section>

            <main>
                {/* Episodes Section */}
                <section id="episodes" className="episodes-section">
                    <div className="episodes-header">
                        <h2 className="details-section-title">Episodes</h2>
                        
                        <div className="episodes-controls-row">
                            {seasonsList.length > 0 && (
                                <div className="custom-season-dropdown" ref={seasonRef}>
                                    <button 
                                        className="season-dropdown-trigger" 
                                        onClick={() => setShowSeasonMenu(!showSeasonMenu)}
                                    >
                                        <span className="season-trigger-text">{currentSeasonName}</span>
                                        <ChevronDown size={16} style={{ transform: showSeasonMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
                                    </button>

                                    {showSeasonMenu && (
                                        <div className="season-dropdown-menu">
                                            {seasonsList.map(season => (
                                                <button 
                                                    key={season.id} 
                                                    className={`season-option ${selectedSeason === season.season_number ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setSelectedSeason(season.season_number);
                                                        setShowSeasonMenu(false);
                                                    }}
                                                >
                                                    <span className="season-option-text">{season.name}</span>
                                                    {selectedSeason === season.season_number && <div className="active-dot" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Episodes navigation arrows (Visible on mobile view only) */}
                            <div className="episodes-nav-arrows">
                                <button 
                                    type="button" 
                                    className="nav-arrow-btn" 
                                    onClick={() => scrollEpisodes("left")}
                                    aria-label="Scroll episodes left"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    type="button" 
                                    className="nav-arrow-btn" 
                                    onClick={() => scrollEpisodes("right")}
                                    aria-label="Scroll episodes right"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="episode-list" ref={episodeSliderRef}>
                        {isLoadingEpisodes ? (
                            <p style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', padding: '40px 0', flexShrink: 0 }}>Loading episodes...</p>
                        ) : episodes.length > 0 ? (
                            episodes.map(ep => {
                                const isWatched = watchedEpisodes[selectedSeason || 1]?.[ep.episode_number] === true;
                                const hasStill = Boolean(ep.still_path);
                                return (
                                    <div 
                                        key={ep.id} 
                                        className={`episode-card ${isWatched ? "watched" : ""}`}
                                        onClick={() => {
                                            addToHistory(tv, "tv", selectedSeason || 1, ep.episode_number || 1);
                                            setWatchedEpisodes(getWatchedEpisodes(Number(id)));
                                            navigate(`/watch/tv/${id}?season=${selectedSeason || 1}&episode=${ep.episode_number || 1}`);
                                        }}
                                    >
                                        <div className="episode-thumb-wrapper">
                                            <img 
                                                src={imageUrl(ep.still_path || tv?.still_path || tv?.backdrop_path || tv?.poster_path, "w500", "/hero.png")} 
                                                alt={ep.name} 
                                                className={!hasStill ? "fallback-thumb-img" : ""}
                                            />
                                            {!hasStill && <div className="fallback-thumb-gradient" />}
                                            <div className="episode-thumb-play-icon">
                                                <svg viewBox="0 0 24 24" width="32" height="32" fill="var(--accent)">
                                                    <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z" />
                                                </svg>
                                            </div>
                                            {isWatched && (
                                                <div 
                                                    className="watched-badge" 
                                                    title="Watched (Click to mark unwatched)"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeEpisodeWatched(Number(id), selectedSeason || 1, ep.episode_number || 1);
                                                        setWatchedEpisodes(prev => {
                                                            const updated = { ...prev };
                                                            if (updated[selectedSeason || 1]) {
                                                                updated[selectedSeason || 1] = { ...updated[selectedSeason || 1] };
                                                                delete updated[selectedSeason || 1][ep.episode_number || 1];
                                                            }
                                                            return updated;
                                                        });
                                                    }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </div>
                                            )}
                                            <span className="episode-number-badge">{ep.episode_number}</span>
                                        </div>
                                        <div className="episode-info">
                                            <h3 className={!hasStill ? "fallback-ep-title" : ""}>{ep.name}</h3>
                                            <div className="episode-meta-row">
                                                {ep.runtime && <span className="episode-runtime">{ep.runtime}min</span>}
                                                {ep.runtime && ep.air_date && <span className="dot" />}
                                                {ep.air_date && <span className="episode-air-date">{formatEpisodeDate(ep.air_date)}</span>}
                                            </div>
                                            <p className="episode-overview">
                                                {ep.overview || "No description available for this episode."}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', padding: '40px 0', flexShrink: 0 }}>No episodes available.</p>
                        )}
                    </div>
                </section>

                {cast.length > 0 && (
                    <>
                        <div className="section-header-with-arrows">
                            <h2 className="details-section-title">Cast</h2>
                            <div className="slider-nav-arrows">
                                <button 
                                    type="button" 
                                    className="nav-arrow-btn" 
                                    onClick={() => scrollCast("left")}
                                    aria-label="Scroll cast left"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    type="button" 
                                    className="nav-arrow-btn" 
                                    onClick={() => scrollCast("right")}
                                    aria-label="Scroll cast right"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="cast-slider-wrapper">
                            <div className="cast-slider" ref={castSliderRef}>
                                {cast.map((person) => (
                                    <div 
                                        key={person.id} 
                                        className="cast-card" 
                                        onClick={() => navigate(`/person/${person.id}`, { state: { person } })}
                                    >
                                        <div className="cast-img-wrapper">
                                            <img
                                                src={imageUrl(person.profile_path, "w185", "/avatar1.png")}
                                                alt={person.name}
                                            />
                                        </div>
                                        <div className="cast-info">
                                            <span className="cast-name">{person.name}</span>
                                            <span className="cast-character">{person.character}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {similarTv.length > 0 && (
                    <section className="similar-section">
                        <div className="section-header-with-arrows">
                            <h2 id="similar" className="details-section-title">Similar TV Shows</h2>
                            <div className="similar-nav-arrows">
                                <button 
                                    type="button" 
                                    className="nav-arrow-btn" 
                                    onClick={() => scrollSimilar("left")}
                                    aria-label="Scroll similar shows left"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    type="button" 
                                    className="nav-arrow-btn" 
                                    onClick={() => scrollSimilar("right")}
                                    aria-label="Scroll similar shows right"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="similar-grid" ref={similarSliderRef}>
                            {similarTv.map((similar) => (
                                <SimilarCard 
                                    key={similar.id} 
                                    item={similar} 
                                    type="tv" 
                                    navigate={navigate} 
                                    onAddToList={setListModalItem}
                                    activeListItemId={listModalItem?.item?.id ?? listModalItem?.id}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Mobile-only Lists Modal Overlay (Behaves exactly like the collection modal overlay background but with identical PC styled dropdown) */}
            {showListDropdown && (
                <div className="collection-modal-overlay mobile-only" onClick={() => setShowListDropdown(false)}>
                    <div className="season-dropdown-menu lists-menu" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', top: 'auto', left: 'auto' }}>
                        <div className="dropdown-options">
                            <button 
                                className={`season-option ${activeLists.includes("watchlist") ? 'active' : ''}`}
                                onClick={() => toggleItemInList("watchlist", tv, "tv")}
                            >
                                <span className="season-option-text">My Watchlist</span>
                                {activeLists.includes("watchlist") && <Check size={16} className="active-tick" />}
                            </button>

                            {customLists.map(list => (
                                <button 
                                    key={list.id}
                                    className={`season-option ${activeLists.includes(list.id) ? 'active' : ''}`}
                                    onClick={() => toggleItemInList(list.id, tv, "tv")}
                                >
                                    <span className="season-option-text">{list.name}</span>
                                    {activeLists.includes(list.id) && <Check size={16} className="active-tick" />}
                                </button>
                            ))}
                        </div>

                        {isCreatingInline ? (
                            <div className="dropdown-inline-create-container">
                                <form className="dropdown-inline-create" onSubmit={handleCreateListInline}>
                                    <input 
                                        key="mobile-inline-input"
                                        ref={inlineInputRefMobile}
                                        type="text"
                                        className="inline-create-input"
                                        placeholder="New list name..."
                                        value={newListNameInline}
                                        onChange={(e) => setNewListNameInline(e.target.value.slice(0, 50))}
                                        maxLength={50}
                                    />
                                    <span className="inline-create-divider" />
                                    <button 
                                        type="submit" 
                                        className="inline-create-submit-tick" 
                                        disabled={!newListNameInline.trim()}
                                        onClick={handleCreateListInline}
                                        aria-label="Create List"
                                    >
                                        <Check size={16} />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <button 
                                className="season-option create-list-option"
                                style={{ color: 'var(--accent)', justifyContent: 'flex-start', gap: '8px' }}
                                onClick={() => setIsCreatingInline(true)}
                            >
                                <Plus size={14} />
                                <span className="season-option-text">Create New List</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Warning Play Modal (In Cinemas / Upcoming) */}
            {showPlayWarning && (
                <div className="warning-modal-overlay" onClick={() => setShowPlayWarning(false)}>
                    <div className="warning-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="warning-title">
                            {getStatusLabel(tv)?.text === "In Cinemas" ? "Currently In Cinemas" : "Upcoming Release"}
                        </h2>
                        <p className="warning-description">
                            {getStatusLabel(tv)?.text === "In Cinemas"
                                ? "This content is currently in theatres. A high-quality digital stream may not be available yet."
                                : "This content is scheduled for a future release. A stream may not be available or could be incomplete."}
                        </p>
                        <div className="warning-actions">
                            {getStatusLabel(tv)?.text !== "Upcoming" && (
                                <button 
                                    type="button" 
                                    className="warning-btn-primary"
                                    onClick={() => {
                                        setShowPlayWarning(false);
                                        addToHistory(tv, "tv", selectedSeason || 1, 1);
                                        navigate(`/watch/tv/${id}?season=${selectedSeason || 1}&episode=1`);
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                                        <path d="M9.5 4.3c-1.3-0.8-3 0.1-3 1.7v12c0 1.6 1.7 2.5 3 1.7l9.5-6c1.1-0.7 1.1-2.4 0-3.1l-9.5-6z" />
                                    </svg>
                                    <span>Play Anyway</span>
                                </button>
                            )}
                            <button 
                                type="button"
                                className="warning-cancel-link"
                                onClick={() => setShowPlayWarning(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {listModalItem && (
                <ListModal 
                    item={listModalItem.item ?? listModalItem} 
                    anchorRect={listModalItem.rect}
                    onClose={() => setListModalItem(null)} 
                />
            )}
        </div>
    );
};

export default TvDetails;

