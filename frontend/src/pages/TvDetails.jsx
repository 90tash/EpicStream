import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import "./movieTvDetails.css";
import { getTitle, imageUrl, tmdbFetch } from "../utils/tmdb";

const TvDetails = () => {
    const { state } = useLocation();
    const [teaser, setTeaser] = useState(null);
    const [trailers, setTrailers] = useState([]);
    const [cast, setCast] = useState([]);
    const [similarTv, setSimilarTv] = useState([]);
    const [imdbId, setImdbId] = useState(null);
    const [isMuted, setIsMuted] = useState(false); // Default sound to ON
    const navigate = useNavigate();

    const tv = state?.movie; // In this project, 'movie' is often used generically in state

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!tv) return;

        const fetchVideos = async () => {
            try {
                // Fetch basic videos first
                const data = await tmdbFetch(`/tv/${tv.id}/videos`);
                let foundTeaser = data.results.find((v) => v.type === "Teaser");
                let foundTrailers = data.results.filter((v) => v.type === "Trailer");
                
                // If no trailers in main, try season 1
                if (foundTrailers.length === 0) {
                    const sdata = await tmdbFetch(`/tv/${tv.id}/season/1/videos`);
                    if (!foundTeaser) foundTeaser = sdata.results.find((v) => v.type === "Teaser");
                    foundTrailers = sdata.results.filter((v) => v.type === "Trailer");
                }

                setTeaser(foundTeaser);
                setTrailers(foundTrailers.slice(0, 2));
            } catch (error) {
                console.error("Error fetching videos:", error);
            }
        };

        const fetchCast = async () => {
            try {
                const data = await tmdbFetch(`/tv/${tv.id}/credits`);
                setCast(data.cast.slice(0, 10));
            } catch (error) {
                console.error("Error fetching cast:", error);
            }
        };

        const fetchSimilar = async () => {
            try {
                const data = await tmdbFetch(`/tv/${tv.id}/similar`);
                setSimilarTv(data.results.slice(0, 10));
            } catch (error) {
                console.error("Error fetching similar:", error);
            }
        };

        const fetchExternalIds = async () => {
            try {
                const data = await tmdbFetch(`/tv/${tv.id}/external_ids`);
                setImdbId(data.imdb_id);
            } catch (error) {
                console.error("Error fetching TV details:", error);
            }
        };

        fetchVideos();
        fetchCast();
        fetchSimilar();
        fetchExternalIds();
    }, [tv]);

    if (!tv) return null;

    const title = getTitle(tv);
    const releaseYear = (tv.first_air_date || tv.release_date || "").slice(0, 4);

    return (
        <div className="details-page">
            <Navbar />
            
            <section className="details-hero">
                {trailers.length > 0 || teaser ? (
                    <>
                        <div className="details-hero-video-wrapper">
                            <ReactPlayer
                                className="details-hero-video"
                                url={`https://www.youtube.com/watch?v=${(trailers[0] || teaser).key}`}
                                playing={true}
                                muted={isMuted}
                                loop={true}
                                width="100%"
                                height="100%"
                                controls={false}
                                config={{
                                    youtube: {
                                        playerVars: { 
                                            showinfo: 0, 
                                            modestbranding: 1, 
                                            rel: 0, 
                                            iv_load_policy: 3, 
                                            controls: 0,
                                            disablekb: 1,
                                            fs: 0,
                                            autohide: 1
                                        }
                                    }
                                }}
                            />
                        </div>
                        <button 
                            className="mute-btn" 
                            onClick={() => setIsMuted(!isMuted)}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </button>
                    </>
                ) : (
                    <img
                        className="details-hero-image"
                        src={imageUrl(tv.backdrop_path, "original")}
                        alt={title}
                    />
                )}
                <div className="details-hero-shade" />
                <div className="details-hero-content">
                    <span className="media-type">T V  S H O W</span>
                    <h1>{title}</h1>
                    <div className="details-actions">
                        <button 
                            className="details-play" 
                            onClick={() => {
                                if (imdbId) window.location.href = `https://www.playimdb.com/title/${imdbId}`;
                            }}
                        >
                            <Play fill="currentColor" /> Play
                        </button>
                        <button className="details-info" onClick={() => document.getElementById('trailers')?.scrollIntoView({ behavior: 'smooth' })}>
                            <Info /> More Info
                        </button>
                    </div>
                    <div className="details-hero-meta">
                        {tv.vote_average && (
                            <span className="rating">
                                <a 
                                    href={imdbId ? `https://www.imdb.com/title/${imdbId}` : "#"} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ textDecoration: 'none' }}
                                >
                                    <span className="imdb-badge">IMDb</span>
                                </a> {tv.vote_average.toFixed(1)} Rating
                            </span>
                        )}
                        <span>{releaseYear}</span>
                        <span className="maturity">{tv.adult ? "18+" : "12+"}</span>
                        <span className="hd-badge">HD</span>
                    </div>
                    <p className="details-hero-overview">{tv.overview}</p>
                </div>
            </section>

            <main>
                {/* Info section removed from here as it's now in the hero */}

                {(teaser || trailers.length > 0) && (
                    <>
                        <h2 id="trailers" className="details-section-title">Trailers & Extras</h2>
                        <div className="details-videos">
                            {teaser && (
                                <div className="video-wrapper">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${teaser.key}`}
                                        title="Teaser"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                            {trailers.map((trailer) => (
                                <div className="video-wrapper" key={trailer.id}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${trailer.key}`}
                                        title="Trailer"
                                        allowFullScreen
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {cast.length > 0 && (
                    <>
                        <h2 className="details-section-title">Cast</h2>
                        <div className="details-slider">
                            {cast.map((person) => (
                                <div 
                                    key={person.id} 
                                    className="cast-card" 
                                    onClick={() => navigate("/peopledetails", { state: { person } })}
                                >
                                    <img
                                        src={imageUrl(person.profile_path, "w500", "/avatar1.png")}
                                        alt={person.name}
                                    />
                                    <p>{person.name}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {similarTv.length > 0 && (
                    <>
                        <h2 className="details-section-title">Similar TV Shows</h2>
                        <div className="details-slider">
                            {similarTv.map((similar) => (
                                <div 
                                    key={similar.id} 
                                    className="similar-card" 
                                    onClick={() => {
                                        navigate("/tvdetails", { state: { movie: similar } });
                                        window.scrollTo(0, 0);
                                    }}
                                >
                                    <img
                                        src={imageUrl(similar.backdrop_path || similar.poster_path, "w500")}
                                        alt={getTitle(similar)}
                                    />
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
