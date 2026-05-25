/* eslint-disable react/prop-types */
import { ChevronLeft, ChevronRight, Compass, Flame, Info, Play, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { formatMediaType, getMediaType, getRating, getTitle, getYear, imageUrl, tmdbFetch, tmdbGetImages } from "../../utils/tmdb";
import "./homescreen.css";

const rows = [
    { title: "TOP 10 Today", path: "/trending/all/day", topTen: true },
    { title: "Popular Movies", path: "/movie/popular" },
    { title: "Popular Shows", path: "/tv/popular" },
    { title: "Top Rated: Movies", path: "/movie/top_rated" },
    { title: "Top Rated: Series", path: "/tv/top_rated" },
];

const HeroSkeleton = () => (
    <section className="browse-hero skeleton">
        <div className="browse-hero-shade" />
        <div className="browse-hero-content">
            <div className="skeleton-label" />
            <div className="skeleton-title" />
            <div className="skeleton-meta" />
            <div className="skeleton-overview" />
            <div className="browse-actions">
                <div className="skeleton-btn" />
                <div className="skeleton-btn" />
            </div>
        </div>
    </section>
);

const RowSkeleton = ({ topTen }) => (
    <section className="browse-row">
        <div className="skeleton-row-title" />
        <div className="slider-wrapper">
            <div className={`browse-slider ${topTen ? "top-ten-slider" : ""}`}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`browse-card skeleton-card ${topTen ? "top-ten-card" : ""}`} />
                ))}
            </div>
        </div>
    </section>
);

const RowHeader = ({ row }) => {
    return (
        <div className="row-heading">
            {row.title && <h2 className="section-title">{row.title}</h2>}
        </div>
    );
};

const MovieCard = ({ item, row, index, openDetails }) => {
    const type = getMediaType(item);
    const rating = getRating(item);

    return (
        <button
            type="button"
            className={`browse-card ${row.topTen ? "top-ten-card" : ""}`}
            key={`${row.title}-${item.id}-${type}`}
            onClick={() => openDetails(item)}
        >
            {row.topTen && (
                <span className="rank-ribbon">
                    <span className="ribbon-text">TOP</span>
                    <span className="ribbon-number">{(index + 1).toString().padStart(2, '0')}</span>
                </span>
            )}
            <div className="card-img-wrapper">
                <img 
                    src={imageUrl(row.topTen ? (item.poster_path || item.backdrop_path) : (item.backdrop_path || item.poster_path), "w780")} 
                    alt={getTitle(item)} 
                    loading="lazy"
                />
            </div>
            <span className="card-title">{getTitle(item)}</span>
            <span className="card-meta">
                {rating && (
                    <>
                        <Star size={13} fill="currentColor" />
                        {rating}
                        <span className="dot" />
                    </>
                )}
                {getYear(item) && (
                    <>
                        {getYear(item)}
                        <span className="dot" />
                    </>
                )}
                {formatMediaType(type)}
            </span>
        </button>
    );
};

const MovieRow = ({ row, openDetails }) => {
    const sliderRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [items, setItems] = useState(row.items || []);
    const [isLoading, setIsLoading] = useState(!row.items);

    useEffect(() => {
        if (row.items) {
            setItems(row.items);
            setIsLoading(false);
        }
    }, [row.items]);

    const scroll = (direction) => {
        if (!sliderRef.current) return;
        const { scrollLeft, clientWidth } = sliderRef.current;
        sliderRef.current.scrollTo({
            left: direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth,
            behavior: "smooth",
        });
    };

    if (isLoading) return <RowSkeleton topTen={row.topTen} />;

    return (
        <section className="browse-row">
            <RowHeader row={row} />
            <div className="slider-wrapper">
                {showLeftArrow && (
                    <button className="row-arrow left" onClick={() => scroll("left")} aria-label="Scroll left">
                        <ChevronLeft size={36} />
                    </button>
                )}

                <div
                    className={`browse-slider ${row.topTen ? "top-ten-slider" : ""}`}
                    ref={sliderRef}
                    onScroll={() => setShowLeftArrow(sliderRef.current?.scrollLeft > 0)}
                >
                    {items.map((item, index) => (
                        <MovieCard 
                            key={`${row.title}-${item.id}`} 
                            item={item} 
                            row={row} 
                            index={index}
                            openDetails={openDetails} 
                        />
                    ))}
                </div>

                <button className="row-arrow right" onClick={() => scroll("right")} aria-label="Scroll right">
                    <ChevronRight size={36} />
                </button>
            </div>
        </section>
    );
};

const HomeScreen = () => {
    const [heroContent, setHeroContent] = useState(null);
    const [heroCandidates, setHeroCandidates] = useState([]);
    const [heroIndex, setHeroIndex] = useState(0);
    const [contentRows, setContentRows] = useState(rows.map(r => ({ ...r, items: null })));
    const [heroImdbId, setHeroImdbId] = useState(null);
    const [isLoadingHero, setIsLoadingHero] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchImdbId = async () => {
            if (!heroContent) return;
            try {
                const isTv = getMediaType(heroContent) === "tv";
                const data = await tmdbFetch(isTv ? `/tv/${heroContent.id}/external_ids` : `/movie/${heroContent.id}`);
                setHeroImdbId(data.imdb_id);
            } catch (error) {
                console.error("Error fetching hero IMDB ID:", error);
            }
        };

        fetchImdbId();
    }, [heroContent]);

    useEffect(() => {
        const loadRow = async (rowIndex) => {
            try {
                const row = rows[rowIndex];
                const data = await tmdbFetch(row.path, row.params);
                const results = (data.results || []).filter((item) => item.backdrop_path || item.poster_path).slice(0, row.topTen ? 10 : 20);
                
                setContentRows(prev => {
                    const next = [...prev];
                    next[rowIndex] = { ...next[rowIndex], items: results };
                    return next;
                });

                // Use the first row for hero candidates
                if (rowIndex === 0) {
                    setHeroCandidates(results);
                    setHeroContent(results[0] || null);
                    setIsLoadingHero(false);
                }
            } catch (error) {
                console.error(`Error loading row ${rowIndex}:`, error);
            }
        };

        rows.forEach((_, index) => loadRow(index));
    }, []);

    useEffect(() => {
        if (heroCandidates.length === 0) return undefined;
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroCandidates.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [heroCandidates]);

    useEffect(() => {
        if (heroCandidates.length > 0) {
            setHeroContent(heroCandidates[heroIndex]);
        }
    }, [heroIndex, heroCandidates]);

    const openDetails = (item) => {
        if (!item) return;
        const type = getMediaType(item);
        navigate(`/${type}/${item.id}`, { state: { movie: item, type } });
    };

    const title = getTitle(heroContent);
    const releaseYear = getYear(heroContent);
    const rating = getRating(heroContent);

    return (
        <div className="epicstream-home">
            <Navbar />

            {isLoadingHero ? <HeroSkeleton /> : (
                <section className="browse-hero">
                    {heroContent?.backdrop_path && (
                        <img 
                            key={heroContent.id + "-image"}
                            className="browse-hero-image" 
                            src={imageUrl(heroContent.backdrop_path, "w1280")} 
                            alt={title} 
                        />
                    )}
                    <div className="browse-hero-shade" />
                    <div key={heroContent?.id + "-content"} className="browse-hero-content">
                        <h1>{title}</h1>
                        <div className="browse-meta">
                            {rating && (
                                <span className="rating"><Star size={15} fill="currentColor" /> {rating}</span>
                            )}
                            {releaseYear && <span>{releaseYear}</span>}
                            <span>{formatMediaType(getMediaType(heroContent))}</span>
                        </div>
                        <p>{heroContent?.overview || "Movies, shows, trailers and more are ready to watch."}</p>
                        <div className="browse-actions">
                            <button
                                type="button"
                                className="browse-play"
                                onClick={() => {
                                    if (heroImdbId) {
                                        window.open(`https://www.playimdb.com/title/${heroImdbId}`, '_blank');
                                    } else {
                                        alert("Fetching movie data... please try again in a moment.");
                                    }
                                }}
                            >
                                <Play size={20} fill="currentColor" />
                                Play
                            </button>
                            <button type="button" className="browse-info" onClick={() => openDetails(heroContent)}>
                                <Info size={20} />
                                See More
                            </button>
                        </div>
                    </div>
                </section>            )}

            <main className="browse-main">
                {contentRows.map((row) => (
                    <MovieRow key={row.title} row={row} openDetails={openDetails} />
                ))}
            </main>

            <Footer />
        </div>
    );
};

export default HomeScreen;
