import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef, Fragment } from "react";
import { ChevronLeft, Star, ChevronDown, LayoutGrid, Plus, Check, X, Bookmark } from "lucide-react";
import "./movieTvDetails.css";
import toast from "react-hot-toast";
import { getTitle, imageUrl, tmdbFetch, tmdbGetSeason, tmdbGetRecommendations, tmdbGetImages, prioritizeSimilarContent } from "../utils/tmdb";
import { addToHistory } from "../utils/history";
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

/* eslint-disable react/prop-types */
const SimilarCard = ({ item, type, navigate }) => {
    return (
        <div 
            className="similar-card" 
            onClick={() => {
                navigate(`/${type}/${item.id}`, { state: { movie: item } });
                window.scrollTo(0, 0);
            }}
        >
            <div className="similar-card-img-wrapper">
                <img
                    src={imageUrl(item.poster_path || item.backdrop_path, "w500")}
                    alt={getTitle(item)}
                    loading="lazy"
                />
                <div className="similar-card-shade" />
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

    // Episodes & Seasons State
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [showSeasonMenu, setShowSeasonMenu] = useState(false);
    const [episodes, setEpisodes] = useState([]);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

    // Sync basic state from location
    useEffect(() => {
        if (state?.movie) {
            setTv(state.movie);
        }
    }, [id, state]);

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

    if (!tv) return null;

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
                                    addToHistory(tv, "tv", selectedSeason || 1, 1);
                                    navigate(`/watch/tv/${id}?season=${selectedSeason || 1}&episode=1`);
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
                        <div className="details-hero-genre">
                            {tv.genres?.map(g => g.name).join(" • ") || "N/A"}
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

                    <div className="details-hero-side-bar">
                        <div className="side-bar-item">
                            <span className="side-bar-label">Status</span>
                            <span className="side-bar-value">{tv.status || "N/A"}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Language</span>
                            <span className="side-bar-value">{(tv.original_language || "EN").toUpperCase()}</span>
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
                        <div className="episodes-title-group">
                            <h2 className="details-section-title">Episodes</h2>
                            
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
                        </div>
                    </div>

                    <div className="episode-list">
                        {isLoadingEpisodes ? (
                            <p style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', padding: '40px 0', flexShrink: 0 }}>Loading episodes...</p>
                        ) : episodes.length > 0 ? (
                            episodes.map(ep => (
                                <div 
                                    key={ep.id} 
                                    className="episode-card"
                                    onClick={() => {
                                        addToHistory(tv, "tv", selectedSeason || 1, ep.episode_number || 1);
                                        navigate(`/watch/tv/${id}?season=${selectedSeason || 1}&episode=${ep.episode_number || 1}`);
                                    }}
                                >
                                    <div className="episode-thumb-wrapper">
                                        <img 
                                            src={imageUrl(ep.still_path, "w500", "/hero.png")} 
                                            alt={ep.name} 
                                        />
                                        <span className="episode-number-badge">{ep.episode_number}</span>
                                    </div>
                                    <div className="episode-info">
                                        <div className="episode-title-row">
                                            <h3>{ep.name}</h3>
                                            {ep.runtime && <span className="episode-runtime">{ep.runtime} min</span>}
                                        </div>
                                        <p className="episode-overview">
                                            {ep.overview || "No description available for this episode."}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ width: '100%', textAlign: 'center', color: 'var(--muted)', padding: '40px 0', flexShrink: 0 }}>No episodes available.</p>
                        )}
                    </div>
                </section>

                {cast.length > 0 && (
                    <>
                        <h2 className="details-section-title">Cast</h2>
                        <div className="cast-grid">
                            {cast.map((person) => (
                                <div 
                                    key={person.id} 
                                    className="cast-card" 
                                    onClick={() => navigate(`/person/${person.id}`, { state: { person } })}
                                >
                                    <img
                                        src={imageUrl(person.profile_path, "w500", "/avatar1.png")}
                                        alt={person.name}
                                    />
                                    <div className="cast-info">
                                        <span className="cast-name">{person.name}</span>
                                        <span className="cast-character">{person.character}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {similarTv.length > 0 && (
                    <section className="similar-section">
                        <h2 id="similar" className="details-section-title">Similar TV Shows</h2>
                        <div className="similar-grid">
                            {similarTv.map((similar) => (
                                <SimilarCard 
                                    key={similar.id} 
                                    item={similar} 
                                    type="tv" 
                                    navigate={navigate} 
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
        </div>
    );
};

export default TvDetails;
