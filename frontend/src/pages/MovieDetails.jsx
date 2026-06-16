import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Play, Star } from "lucide-react";
import "./movieTvDetails.css";
import { getTitle, imageUrl, tmdbFetch, tmdbGetRecommendations, getPlayerUrl, tmdbGetImages } from "../utils/tmdb";

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

    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [similarMovies, setSimilarMovies] = useState([]);
    const [showFullOverview, setShowFullOverview] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const overviewRef = useRef(null);

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
                // 1. Always fetch/refresh full movie data
                const fullData = await tmdbFetch(`/movie/${id}`);
                setMovie(fullData);

                // 2. Fetch secondary data
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

    return (
        <div className="details-page">
            <button className="back-btn" onClick={() => navigate("/")} aria-label="Go back">
                <ChevronLeft size={24} />
            </button>
            
            <section className="details-hero">
                <img
                    className="details-hero-image"
                    src={imageUrl(movie.backdrop_path, "original")}
                    alt={title}
                />
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
                                onClick={() => navigate(`/watch/movie/${id}`)}
                            >
                                <Play size={20} fill="currentColor" />
                                <span>Play</span>
                            </button>
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
        </div>
    );
};

export default MovieDetails;
