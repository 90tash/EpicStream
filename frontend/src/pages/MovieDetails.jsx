import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useRef, Fragment } from "react";
import { ChevronLeft, ChevronRight, Star, X, LayoutGrid, Plus, Check, Bookmark } from "lucide-react";
import "./movieTvDetails.css";
import toast from "react-hot-toast";
import { getTitle, imageUrl, tmdbFetch, tmdbGetRecommendations, tmdbGetImages } from "../utils/tmdb";
import { addToHistory } from "../utils/history";
import { useWatchlistStore } from "../stores/watchlist";
import { useCustomListsStore } from "../stores/customLists";

const formatRuntime = (runtime) => {
    if (!runtime) return "N/A";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

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
                    <>
                        <Star size={13} fill="currentColor" /> 
                        {item.vote_average.toFixed(1)}
                        <span className="dot" />
                    </>
                )}
                <span>{(item.release_date || item.first_air_date || "").slice(0, 4)}</span>
                <span className="dot" />
                <span>{type === "movie" ? "Movie" : "TV Show"}</span>
            </div>
        </div>
    );
};

const MovieDetails = () => {
    const { state } = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState(() => state?.movie || null);
    const [cast, setCast] = useState([]);
    const [similarMovies, setSimilarMovies] = useState([]);
    const [director, setDirector] = useState(null);
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


    // Collection states
    const [collectionData, setCollectionData] = useState(null);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [collectionSortBy, setCollectionSortBy] = useState("release");

    // Slider refs & states
    const colSliderRef = useRef(null);
    const [colLeftArrow, setColLeftArrow] = useState(false);
    const [colRightArrow, setColRightArrow] = useState(false);

    const updateColArrows = () => {
        if (!colSliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = colSliderRef.current;
        setColLeftArrow(scrollLeft > 1);
        setColRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    };

    useEffect(() => {
        if (showCollectionModal) {
            const timer = setTimeout(updateColArrows, 150);
            window.addEventListener("resize", updateColArrows);
            return () => {
                clearTimeout(timer);
                window.removeEventListener("resize", updateColArrows);
            };
        }
        return undefined;
    }, [showCollectionModal, collectionSortBy, collectionData]);

    const scrollCol = (direction) => {
        if (!colSliderRef.current) return;
        const { scrollLeft, clientWidth } = colSliderRef.current;
        colSliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75,
            behavior: "smooth",
        });
    };

    // Sync state when ID or location state changes
    useEffect(() => {
        if (state?.movie) {
            setMovie(state.movie);
        }
    }, [id, state]);

    useEffect(() => {
        if (movie) {
            document.title = `${getTitle(movie)} - EpicStream`;
        } else {
            document.title = "EpicStream";
        }
        return () => {
            document.title = "EpicStream";
        };
    }, [movie]);


    useEffect(() => {
        window.scrollTo(0, 0);
        setDirector(null);
        setLogoError(false);
        setShowFullOverview(false);
        setLogoFetched(false);

        const fetchAllData = async () => {
            try {
                // Fetch movie details and images concurrently to prevent any delay
                const [fullData, images] = await Promise.all([
                    tmdbFetch(`/movie/${id}`),
                    tmdbGetImages("movie", id)
                ]);

                // Find the best title logo (English first, then untagged/null, then any)
                const logos = images.logos || [];
                const titleLogo = logos.find(l => l.iso_639_1 === "en")?.file_path ||
                                  logos.find(l => l.iso_639_1 === null)?.file_path ||
                                  logos[0]?.file_path;

                setMovie({ ...fullData, title_logo: titleLogo });
                setLogoFetched(true); // De-couple title logo rendering from secondary data loading

                // Fetch collection details if movie belongs to one
                if (fullData.belongs_to_collection) {
                    try {
                        const colData = await tmdbFetch(`/collection/${fullData.belongs_to_collection.id}`);
                        setCollectionData(colData);
                    } catch (colErr) {
                        console.error("Error fetching collection details:", colErr);
                        setCollectionData(null);
                    }
                } else {
                    setCollectionData(null);
                }

                // 2. Fetch secondary data (credits, recommendations)
                const [castData, recsData] = await Promise.all([
                    tmdbFetch(`/movie/${id}/credits`),
                    tmdbGetRecommendations("movie", id)
                ]);
                
                setCast(castData.cast.slice(0, 10));
                setSimilarMovies(recsData.slice(0, 10));

                const directorObj = castData.crew?.find(member => member.job === "Director");
                setDirector(directorObj ? { name: directorObj.name, id: directorObj.id } : null);
            } catch (error) {
                console.error("Error fetching movie details:", error);
                setLogoFetched(true);
                if (!movie && !state?.movie) navigate("/", { replace: true });
            }
        };

        fetchAllData();
    }, [id]);



    if (!movie) return null;

    const title = getTitle(movie);
    const releaseYear = (movie.release_date || movie.first_air_date || "").slice(0, 4);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
    const activeLists = getListsForItem(movie.id);
    const inAnyList = activeLists.length > 0;
    const inList = isItemInList(movie.id);

    const handleCreateListInline = (e) => {
        if (e) e.preventDefault();
        const trimmed = newListNameInline.trim();
        if (!trimmed) return;
        const res = createList(trimmed);
        if (res.success) {
            toast.success(`List "${res.list.name}" created!`);
            toggleItemInList(res.list.id, movie, "movie");
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

    // Sort parts of the collection based on user preference
    const sortedParts = collectionData?.parts ? [...collectionData.parts].sort((a, b) => {
        if (collectionSortBy === "release") {
            const dateA = a.release_date || "";
            const dateB = b.release_date || "";
            return dateA.localeCompare(dateB);
        } else {
            return (b.vote_average || 0) - (a.vote_average || 0);
        }
    }) : [];

    return (
        <div className="details-page">
            <button className="back-btn" onClick={() => navigate("/")} aria-label="Go back">
                <ChevronLeft size={24} />
            </button>
            
            <section className="details-hero">
                <div className="details-hero-image-wrapper">
                    <img
                        className="details-hero-image"
                        src={imageUrl(movie.backdrop_path || movie.poster_path, "original")}
                        alt={title}
                    />
                </div>
                <div className="details-hero-shade" />
                <div className="details-hero-content">
                    <div className="details-hero-text">
                        {!logoError && movie?.title_logo ? (
                            <div className="hero-logo-container">
                                <img 
                                    src={imageUrl(movie.title_logo, "w500")} 
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
                                    addToHistory(movie, "movie");
                                    navigate(`/watch/movie/${id}`);
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

                                {collectionData && (
                                    <button 
                                        className="details-action-btn" 
                                        onClick={() => setShowCollectionModal(true)}
                                        title="Collection"
                                        aria-label="Collection"
                                    >
                                        <LayoutGrid size={20} />
                                    </button>
                                )}

                                {showListDropdown && (
                                    <div className="season-dropdown-menu lists-menu desktop-only">
                                        <div className="dropdown-options">
                                            <button 
                                                className={`season-option ${activeLists.includes("watchlist") ? 'active' : ''}`}
                                                onClick={() => toggleItemInList("watchlist", movie, "movie")}
                                            >
                                                <span className="season-option-text">My Watchlist</span>
                                                {activeLists.includes("watchlist") && <Check size={16} className="active-tick" />}
                                            </button>

                                            {customLists.map(list => (
                                                <button 
                                                    key={list.id}
                                                    className={`season-option ${activeLists.includes(list.id) ? 'active' : ''}`}
                                                    onClick={() => toggleItemInList(list.id, movie, "movie")}
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
                            {movie.genres?.map(g => g.name).join(" • ") || "N/A"}
                        </div>
                        <div className="details-hero-meta">
                            {rating && (
                                <span className="rating">
                                    <Star size={15} fill="currentColor" />
                                    {rating}
                                </span>
                            )}
                            <span>Movie</span>
                            <span className="maturity">{movie.adult ? "18+" : "12+"}</span>
                        </div>
                        <div className="director-synopsis-group">
                            <div className="details-hero-director">
                                <span className="director-label">Director:</span>
                                <span className="director-value">
                                    {director ? (
                                        <Link to={`/person/${director.id}`} className="person-link">
                                            {director.name}
                                        </Link>
                                    ) : "N/A"}
                                </span>
                            </div>
                            {movie.overview && (
                                <div className="synopsis-container">
                                    <p className="details-hero-overview">
                                        {showFullOverview || movie.overview.length <= 240
                                            ? movie.overview
                                            : `${movie.overview.slice(0, 240)}...`}
                                    </p>
                                    {movie.overview.length > 240 && (
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
                            <span className="side-bar-value">{movie.status || "N/A"}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Language</span>
                            <span className="side-bar-value">{(movie.original_language || "EN").slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Runtime</span>
                            <span className="side-bar-value">{formatRuntime(movie.runtime)}</span>
                        </div>
                        <div className="side-bar-item">
                            <span className="side-bar-label">Release Date</span>
                            <span className="side-bar-value">{formatDate(movie.release_date)}</span>
                        </div>
                    </div>
                </div>
            </section>

            <main>
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

                {similarMovies.length > 0 && (
                    <section className="similar-section">
                        <h2 id="similar" className="details-section-title">Similar Movies</h2>
                        <div className="similar-grid">
                            {similarMovies.map((similar) => (
                                <SimilarCard 
                                    key={similar.id} 
                                    item={similar} 
                                    type="movie" 
                                    navigate={navigate} 
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Collection Modal Overlay */}
            {showCollectionModal && collectionData && (
                <div className="collection-modal-overlay" onClick={() => setShowCollectionModal(false)}>
                    <div className="collection-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="collection-modal-header">
                            <div>
                                <h2>{collectionData.name}</h2>
                                <span className="collection-count-badge">{collectionData.parts?.length || 0} Movies</span>
                            </div>
                            <button 
                                className="collection-close-btn" 
                                onClick={() => setShowCollectionModal(false)}
                                aria-label="Close collection"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="collection-modal-body">
                            <div className="collection-sort">
                                <span className="sort-label">Sort by:</span>
                                <button 
                                    type="button"
                                    className={`sort-btn ${collectionSortBy === "release" ? "active" : ""}`}
                                    onClick={() => setCollectionSortBy("release")}
                                >
                                    Release Date
                                </button>
                                <button 
                                    type="button"
                                    className={`sort-btn ${collectionSortBy === "rating" ? "active" : ""}`}
                                    onClick={() => setCollectionSortBy("rating")}
                                >
                                    Rating
                                </button>
                            </div>

                            {collectionData.overview && (
                                <p className="collection-overview-text">{collectionData.overview}</p>
                            )}

                            <div className="collection-slider-wrapper">
                                {colLeftArrow && (
                                    <button 
                                        type="button"
                                        className="col-arrow left" 
                                        onClick={() => scrollCol("left")} 
                                        aria-label="Scroll left"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                )}

                                <div 
                                    className="collection-slider" 
                                    ref={colSliderRef}
                                    onScroll={updateColArrows}
                                >
                                    {sortedParts.map(part => {
                                        const partYear = (part.release_date || "").slice(0, 4);
                                        const partRating = part.vote_average ? part.vote_average.toFixed(1) : null;
                                        return (
                                            <button 
                                                type="button"
                                                key={part.id} 
                                                className="collection-card"
                                                onClick={() => {
                                                    setShowCollectionModal(false);
                                                    navigate(`/movie/${part.id}`, { state: { movie: part } });
                                                }}
                                            >
                                                <div className="col-card-img-wrapper">
                                                    <img 
                                                         src={imageUrl(part.poster_path || part.backdrop_path, "w300")} 
                                                         alt={part.title} 
                                                    />
                                                </div>
                                                <span className="col-card-title">{part.title}</span>
                                                <span className="col-card-meta">
                                                    {partRating && (
                                                        <span className="col-rating">
                                                            <Star size={12} fill="currentColor" />
                                                            {partRating}
                                                        </span>
                                                    )}
                                                    {partYear && (
                                                        <>
                                                            {partRating && <span className="dot" />}
                                                            <span>{partYear}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {colRightArrow && (
                                    <button 
                                        type="button"
                                        className="col-arrow right" 
                                        onClick={() => scrollCol("right")} 
                                        aria-label="Scroll right"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile-only Lists Modal Overlay (Behaves exactly like the collection modal overlay background but with identical PC styled dropdown) */}
            {showListDropdown && (
                <div className="collection-modal-overlay mobile-only" onClick={() => setShowListDropdown(false)}>
                    <div className="season-dropdown-menu lists-menu" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', top: 'auto', left: 'auto' }}>
                        <div className="dropdown-options">
                            <button 
                                className={`season-option ${activeLists.includes("watchlist") ? 'active' : ''}`}
                                onClick={() => toggleItemInList("watchlist", movie, "movie")}
                            >
                                <span className="season-option-text">My Watchlist</span>
                                {activeLists.includes("watchlist") && <Check size={16} className="active-tick" />}
                            </button>

                            {customLists.map(list => (
                                <button 
                                    key={list.id}
                                    className={`season-option ${activeLists.includes(list.id) ? 'active' : ''}`}
                                    onClick={() => toggleItemInList(list.id, movie, "movie")}
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

export default MovieDetails;
