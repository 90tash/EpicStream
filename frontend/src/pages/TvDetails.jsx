import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Footer from "../components/Footer";
import { ChevronLeft, Play, Star, ChevronDown } from "lucide-react";
import "./movieTvDetails.css";
import { getTitle, imageUrl, tmdbFetch, tmdbGetSeason, tmdbGetRecommendations, getPlayerUrl } from "../utils/tmdb";

const TvDetails = () => {
    const { state } = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    const [tv, setTv] = useState(null);
    const [cast, setCast] = useState([]);
    const [similarTv, setSimilarTv] = useState([]);
    const [showFullOverview, setShowFullOverview] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const overviewRef = useRef(null);

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

    // Detect if overview text overflows 3 lines
    useEffect(() => {
        if (overviewRef.current) {
            const { scrollHeight, clientHeight } = overviewRef.current;
            setIsOverflowing(scrollHeight > clientHeight);
        }
    }, [tv]);

    // 1. Always fetch full TV details (including seasons) on mount or ID change
    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchAllData = async () => {
            try {
                // Fetch full TV details (mandatory for the 'seasons' array)
                const fullTvData = await tmdbFetch(`/tv/${id}`);
                setTv(fullTvData);

                // Initialize first season
                if (fullTvData.seasons?.length > 0) {
                    const firstSeason = fullTvData.seasons.find(s => s.season_number > 0) || fullTvData.seasons[0];
                    setSelectedSeason(firstSeason.season_number);
                }

                // Fetch other secondary data
                const [castData, recsData] = await Promise.all([
                    tmdbFetch(`/tv/${id}/credits`),
                    tmdbGetRecommendations("tv", id)
                ]);
                
                setCast(castData.cast.slice(0, 10));
                setSimilarTv(recsData.slice(0, 10));
            } catch (error) {
                console.error("Error fetching TV data:", error);
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

    // Filter for the dropdown
    const seasonsList = tv.seasons?.filter(s => s.season_number > 0) || [];
    const currentSeasonName = seasonsList.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`;

    return (
        <div className="details-page">
            <button className="back-btn" onClick={() => navigate("/")} aria-label="Go back">
                <ChevronLeft size={24} />
            </button>
            
            <section className="details-hero">
                <img
                    className="details-hero-image"
                    src={imageUrl(tv.backdrop_path, "original")}
                    alt={title}
                />
                <div className="details-hero-shade" />
                <div className="details-hero-content">
                    <div className="details-hero-poster">
                        <img 
                            src={imageUrl(tv.poster_path, "w500")} 
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
                            <span>TV Show</span>
                            <span className="maturity">{tv.adult ? "18+" : "12+"}</span>
                            <span className="hd-badge">HD</span>
                        </div>
                        <div className="details-hero-info-section">
                            <p 
                                ref={overviewRef}
                                className={`details-hero-overview ${showFullOverview ? 'expanded' : ''} ${isOverflowing ? 'can-expand' : ''}`}
                                onClick={() => isOverflowing && setShowFullOverview(!showFullOverview)}
                                title={isOverflowing ? (showFullOverview ? "Click to shrink" : "Click to read more") : ""}
                            >
                                {tv.overview}
                            </p>

                            <div className="details-hero-side-bar">
                                <div className="side-bar-item">
                                    <span className="side-bar-label">Genre</span>
                                    <span className="side-bar-value">{tv.genres?.map(g => g.name).slice(0, 3).join(", ")}</span>
                                </div>
                                <div className="side-bar-item">
                                    <span className="side-bar-label">Status</span>
                                    <span className="side-bar-value">{tv.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="details-actions">
                            <button 
                                className="details-play" 
                                onClick={() => window.location.href = getPlayerUrl("tv", id, selectedSeason || 1, 1)}
                            >
                                <Play size={20} fill="currentColor" />
                                <span>Play</span>
                            </button>
                            <button className="details-action-btn" onClick={() => document.getElementById('episodes')?.scrollIntoView({ behavior: 'smooth' })}>
                                Episodes
                            </button>
                            <button className="details-action-btn" onClick={() => document.getElementById('similar')?.scrollIntoView({ behavior: 'smooth' })}>
                                Similar
                            </button>
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
                                <div className="custom-season-dropdown">
                                    <button 
                                        className="season-dropdown-trigger" 
                                        onClick={() => setShowSeasonMenu(!showSeasonMenu)}
                                    >
                                        {currentSeasonName}
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
                                                    {season.name}
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
                            <p style={{textAlign:'center', color:'var(--muted)', padding:'40px'}}>Loading episodes...</p>
                        ) : episodes.length > 0 ? (
                            episodes.map(ep => (
                                <div 
                                    key={ep.id} 
                                    className="episode-card"
                                    onClick={() => {
                                        window.location.href = getPlayerUrl("tv", id, selectedSeason || 1, ep.episode_number || 1);
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
                            <p style={{textAlign:'center', color:'var(--muted)', padding:'40px'}}>No episodes available.</p>
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
                    <>
                        <h2 id="similar" className="details-section-title">Similar TV Shows</h2>
                        <div className="similar-grid">
                            {similarTv.map((similar) => (
                                <div 
                                    key={similar.id} 
                                    className="similar-card" 
                                    onClick={() => {
                                        navigate(`/tv/${similar.id}`, { state: { movie: similar } });
                                        window.scrollTo(0, 0);
                                    }}
                                >
                                    <div className="similar-card-img-wrapper">
                                        <img
                                            src={imageUrl(similar.backdrop_path || similar.poster_path, "w500")}
                                            alt={getTitle(similar)}
                                            loading="lazy"
                                        />
                                    </div>
                                    <span className="similar-card-title">{getTitle(similar)}</span>
                                    <div className="similar-card-meta">
                                        {similar.vote_average > 0 && (
                                            <span className="rating">
                                                <Star size={13} fill="currentColor" /> 
                                                {similar.vote_average.toFixed(1)}
                                                <span className="dot" />
                                            </span>
                                        )}
                                        <span>{(similar.first_air_date || "").slice(0, 4)}</span>
                                        <span className="dot" />
                                        <span>TV Show</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default TvDetails;
