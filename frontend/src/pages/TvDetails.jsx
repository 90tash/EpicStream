import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Play, Star, ChevronDown, LayoutGrid } from "lucide-react";
import "./movieTvDetails.css";
import { getTitle, imageUrl, tmdbFetch, tmdbGetSeason, tmdbGetRecommendations, tmdbGetImages } from "../utils/tmdb";
import { addToHistory } from "../utils/history";


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
                setSimilarTv(recsData.slice(0, 10));
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
                                <Play size={20} fill="currentColor" />
                                <span>Play</span>
                            </button>
                            <button className="details-action-btn" onClick={() => document.getElementById('episodes')?.scrollIntoView({ behavior: 'smooth' })}>
                                <LayoutGrid size={20} />
                                <span>Episodes</span>
                            </button>
                            <button className="details-action-btn" onClick={() => document.getElementById('similar')?.scrollIntoView({ behavior: 'smooth' })}>
                                Similar
                            </button>
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
                                    <span className="director-value">{tv.created_by.map(c => c.name).join(", ")}</span>
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
                            <p style={{textAlign:'center', color:'var(--muted)', padding:'40px'}}>Loading episodes...</p>
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
                                <SimilarCard 
                                    key={similar.id} 
                                    item={similar} 
                                    type="tv" 
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

export default TvDetails;
