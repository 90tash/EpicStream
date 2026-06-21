import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Star, X, LayoutGrid } from "lucide-react";
import "./movieTvDetails.css";
import { getTitle, imageUrl, tmdbFetch, tmdbGetRecommendations, tmdbGetImages } from "../utils/tmdb";
import { addToHistory } from "../utils/history";

/* eslint-disable react/prop-types */
const SimilarCard = ({ item, type, navigate }) => {
    const [bannerUrl, setBannerUrl] = useState(imageUrl(item.backdrop_path || item.poster_path, "w780"));

    useEffect(() => {
        const fetchTitledBanner = async () => {
            try {
                const data = await tmdbGetImages(type, item.id);
                if (data.backdrops && data.backdrops.length > 0) {
                    // Filter for backdrops that are NOT textless (iso_639_1 is not null)
                    const titledBackdrops = data.backdrops.filter(b => b.iso_639_1 !== null);
                    if (titledBackdrops.length > 0) {
                        // Prioritize English titled backdrops
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
                    src={bannerUrl}
                    alt={getTitle(item)}
                    loading="lazy"
                />
                <div className="similar-card-shade" />
            </div>
            <span className="similar-card-title">{getTitle(item)}</span>
            <div className="similar-card-meta">
                {item.vote_average > 0 && (
                    <span className="rating">
                        <Star size={13} fill="currentColor" /> 
                        {item.vote_average.toFixed(1)}
                        <span className="dot" />
                    </span>
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
    const [showFullOverview, setShowFullOverview] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const overviewRef = useRef(null);

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

    // Detect if overview text overflows 3 lines
    useEffect(() => {
        if (overviewRef.current) {
            const { scrollHeight, clientHeight } = overviewRef.current;
            setIsOverflowing(scrollHeight > clientHeight);
        }
    }, [movie]);


    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchAllData = async () => {
            try {
                // Fetch movie details
                const fullData = await tmdbFetch(`/movie/${id}`);
                setMovie(fullData);

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
            } catch (error) {
                console.error("Error fetching movie details:", error);
                if (!movie && !state?.movie) navigate("/", { replace: true });
            }
        };

        fetchAllData();
    }, [id]);

    if (!movie) return null;

    const title = getTitle(movie);
    const releaseYear = (movie.release_date || movie.first_air_date || "").slice(0, 4);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

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
                    <div className="details-hero-poster">
                        <img 
                            src={imageUrl(movie.poster_path, "w500")} 
                            alt={title + " Poster"} 
                            className="hero-poster-img"
                        />
                    </div>
                    <div className="details-hero-text">
                        <h1>{title}</h1>
                        <div className="details-hero-meta">
                            {rating && (
                                <span className="rating">
                                    <Star size={15} fill="currentColor" />
                                    {rating}
                                </span>
                            )}
                            {releaseYear && <span>{releaseYear}</span>}
                            <span>Movie</span>
                            <span className="maturity">{movie.adult ? "18+" : "12+"}</span>
                            <span className="hd-badge">HD</span>
                        </div>
                        <div className="details-hero-info-section">
                            <p 
                                ref={overviewRef}
                                className={`details-hero-overview ${showFullOverview ? 'expanded' : ''} ${isOverflowing ? 'can-expand' : ''}`}
                                onClick={() => isOverflowing && setShowFullOverview(!showFullOverview)}
                                title={isOverflowing ? (showFullOverview ? "Click to shrink" : "Click to read more") : ""}
                            >
                                {movie.overview}
                            </p>

                            <div className="details-hero-side-bar">
                                <div className="side-bar-item">
                                    <span className="side-bar-label">Genre</span>
                                    <span className="side-bar-value">{movie.genres?.map(g => g.name).slice(0, 3).join(", ")}</span>
                                </div>
                                <div className="side-bar-item">
                                    <span className="side-bar-label">Status</span>
                                    <span className="side-bar-value">{movie.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="details-actions">
                            <button 
                                className="details-play" 
                                onClick={() => {
                                    addToHistory(movie, "movie");
                                    navigate(`/watch/movie/${id}`);
                                }}
                            >
                                <Play size={20} fill="currentColor" />
                                <span>Play</span>
                            </button>
                            {collectionData && (
                                <button className="details-action-btn" onClick={() => setShowCollectionModal(true)}>
                                    <LayoutGrid size={20} />
                                    <span>Collection</span>
                                </button>
                            )}
                            <button className="details-action-btn" onClick={() => document.getElementById('similar')?.scrollIntoView({ behavior: 'smooth' })}>
                                Similar
                            </button>
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
                    <>
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
                    </>
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
        </div>
    );
};

export default MovieDetails;
