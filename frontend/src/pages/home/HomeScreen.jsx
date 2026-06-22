/* eslint-disable react/prop-types */
import { ChevronLeft, ChevronRight, Info, Play, Star, ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { formatMediaType, getMediaType, getRating, getTitle, getYear, imageUrl, tmdbFetch, tmdbGetImages } from "../../utils/tmdb";
import { addToHistory, getHistory, removeFromHistory } from "../../utils/history";
import "./homescreen.css";

const today = new Date().toISOString().split("T")[0];

const initialRows = [
    { title: "TOP 10 Today", path: "/trending/all/day", topTen: true },
    { 
        title: "Popular Movies", 
        path: "/discover/movie", 
        params: { sort_by: "popularity.desc", "primary_release_date.lte": today } 
    },
    { 
        title: "Popular Shows", 
        path: "/discover/tv", 
        params: { sort_by: "popularity.desc", "first_air_date.lte": today } 
    },
    { 
        title: "Currently Airing: Anime", 
        path: "/discover/tv", 
        params: { 
            with_genres: 16, 
            sort_by: "popularity.desc", 
            with_original_language: "ja",
            include_adult: false,
            "first_air_date.lte": today,
            "air_date.gte": today,
            "air_date.lte": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        } 
    },
    { 
        title: "Top Rated: Movies", 
        path: "/discover/movie", 
        params: { sort_by: "vote_average.desc", "vote_count.gte": 500, "primary_release_date.lte": today } 
    },
    { 
        title: "Top Rated: Series", 
        path: "/discover/tv", 
        params: { sort_by: "vote_average.desc", "vote_count.gte": 250, "first_air_date.lte": today } 
    },
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

const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const HistoryCard = ({ item, openDetails, onRemove }) => {
    const type = item.type || getMediaType(item);
    const progress = item.percentage || 0;
    const timeAgo = getRelativeTime(item.timestamp);
    const bottomInfo = type === "tv" ? `S${item.season}:E${item.episode}` : (item.timeStr || "");

    // Mobile Swipe-to-Delete States
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleTouchStart = (e) => {
        if (isRemoving) return;
        setStartX(e.touches[0].clientX);
        setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!isSwiping || isRemoving) return;
        const diffX = e.touches[0].clientX - startX;
        
        // Only allow swiping to the left (negative translation)
        if (diffX < 0) {
            setCurrentX(diffX);
        }
    };

    const handleTouchEnd = () => {
        if (isRemoving) return;
        setIsSwiping(false);
        
        // If swiped left more than 60px, swipe it off-screen and remove
        if (currentX < -60) {
            setIsRemoving(true);
            setCurrentX(-300); // Slide off-screen
            setTimeout(() => {
                onRemove(item.id);
            }, 200); // Delay to match the transition duration
        } else {
            setCurrentX(0);
        }
    };

    return (
        <div 
            className="browse-card history-card" 
            key={`history-${item.id}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                transform: currentX !== 0 ? `translateX(${currentX}px)` : undefined,
                opacity: currentX !== 0 ? Math.max(0, 1 - Math.abs(currentX) / 200) : undefined,
                transition: isSwiping ? 'none' : 'transform 0.2s ease, opacity 0.2s ease'
            }}
        >
            <div className="card-img-wrapper" onClick={() => openDetails(item)}>
                <img 
                    src={imageUrl(item.poster_path || item.backdrop_path, "w500")} 
                    alt={item.title} 
                    loading="lazy"
                />
                {progress > 0 && (
                    <div className="card-progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
            
            <button 
                className="history-remove-btn" 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                }}
                aria-label="Remove from history"
            >
                <X size={14} />
            </button>

            <div className="history-card-info" onClick={() => openDetails(item)}>
                <div className="history-info-top">
                    <span className="history-title">{item.title}</span>
                    <span className="history-percentage">{progress}%</span>
                </div>
                <div className="history-info-bottom">
                    <span className="history-time-ago">{timeAgo}</span>
                    <span className="history-meta">{bottomInfo}</span>
                </div>
            </div>
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
                    src={imageUrl(item.poster_path || item.backdrop_path, "w500")} 
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

const MovieRow = ({ row, openDetails, onRemoveHistory }) => {
    const sliderRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [items, setItems] = useState(row.items || []);
    const [isLoading, setIsLoading] = useState(!row.items);

    useEffect(() => {
        if (row.items) {
            setItems(row.items);
            setIsLoading(false);
        }
    }, [row.items]);

    const updateArrows = () => {
        if (!sliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        setShowLeftArrow(scrollLeft > 1);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    };

    useEffect(() => {
        const timer = setTimeout(updateArrows, 100);
        window.addEventListener("resize", updateArrows);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateArrows);
        };
    }, [items, isLoading]);

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
                    onScroll={updateArrows}
                >
                    {items.map((item, index) => (
                        row.isHistory ? (
                            <HistoryCard 
                                key={`history-${item.id}`} 
                                item={item} 
                                index={index}
                                openDetails={openDetails} 
                                onRemove={onRemoveHistory}
                            />
                        ) : (
                            <MovieCard 
                                key={`${row.title}-${item.id}`} 
                                item={item} 
                                row={row} 
                                index={index}
                                openDetails={openDetails} 
                            />
                        )
                    ))}
                </div>

                {showRightArrow && (
                    <button className="row-arrow right" onClick={() => scroll("right")} aria-label="Scroll right">
                        <ChevronRight size={36} />
                    </button>
                )}
            </div>
        </section>
    );
};

const HomeScreen = () => {
    const [heroContent, setHeroContent] = useState(null);
    const [heroCandidates, setHeroCandidates] = useState([]);
    const [heroIndex, setHeroIndex] = useState(-1);
    const [contentRows, setContentRows] = useState([]);
    const [isLoadingHero, setIsLoadingHero] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const navigate = useNavigate();

    // Initialize rows with history if available
    useEffect(() => {
        const history = getHistory();
        const updatedRows = history.length > 0 
            ? [{ title: "Continue Watching", items: history, isHistory: true }, ...initialRows.map(r => ({ ...r, items: null }))]
            : initialRows.map(r => ({ ...r, items: null }));
        
        setContentRows(updatedRows);
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 640px)");
        setIsMobile(mediaQuery.matches);

        const handler = (e) => setIsMobile(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleRemoveFromHistory = (id) => {
        removeFromHistory(id);
        setContentRows(prev => {
            const next = [...prev];
            const historyRowIndex = next.findIndex(r => r.isHistory);
            if (historyRowIndex > -1) {
                const updatedItems = next[historyRowIndex].items.filter(item => item.id !== id);
                if (updatedItems.length === 0) {
                    // Remove the entire row if history is empty
                    next.splice(historyRowIndex, 1);
                } else {
                    next[historyRowIndex] = { ...next[historyRowIndex], items: updatedItems };
                }
            }
            return next;
        });
    };

    useEffect(() => {
        const loadRow = async (rowIndex) => {
            const row = contentRows[rowIndex];
            if (!row || row.isHistory) return;

            try {
                const data = await tmdbFetch(row.path, row.params);
                const results = (data.results || [])
                    .filter((item) => {
                        const hasImage = item.backdrop_path || item.poster_path;
                        const releaseDate = item.release_date || item.first_air_date;
                        const isReleased = !releaseDate || releaseDate <= today;
                        return hasImage && isReleased;
                    })
                    .slice(0, row.topTen ? 10 : 20);
                
                setContentRows(prev => {
                    const next = [...prev];
                    next[rowIndex] = { ...next[rowIndex], items: results };
                    return next;
                });

                // Use the first non-history row for hero candidates (limit to 5)
                const firstDataRowIndex = contentRows.findIndex(r => !r.isHistory);
                if (rowIndex === firstDataRowIndex) {
                    const heroWithDetails = await Promise.all(results.slice(0, 5).map(async (item) => {
                        try {
                            const images = await tmdbGetImages(getMediaType(item), item.id);
                            // Look for English or null (textless) posters
                            const posters = images.posters || [];
                            const textlessPoster = posters.find(p => p.iso_639_1 === null)?.file_path;
                            
                            // Find the best title logo (English first, then untagged/null, then any)
                            const logos = images.logos || [];
                            const titleLogo = logos.find(l => l.iso_639_1 === "en")?.file_path ||
                                              logos.find(l => l.iso_639_1 === null)?.file_path ||
                                              logos[0]?.file_path;
                            
                            return { ...item, textless_poster: textlessPoster, title_logo: titleLogo };
                        } catch (error) {
                            console.error("Error fetching images for hero candidate:", error);
                            return item;
                        }
                    }));
                    setHeroCandidates(heroWithDetails);
                    setHeroContent(heroWithDetails[0] || null);
                    setIsLoadingHero(false);
                }
            } catch (error) {
                console.error(`Error loading row ${rowIndex}:`, error);
            }
        };

        if (contentRows.length > 0) {
            contentRows.forEach((_, index) => loadRow(index));
        }
    }, [contentRows.length]);

    useEffect(() => {
        if (heroCandidates.length > 0 && heroIndex === -1) {
            const timer = setTimeout(() => setHeroIndex(0), 50);
            return () => clearTimeout(timer);
        }
    }, [heroCandidates, heroIndex]);

    useEffect(() => {
        if (heroCandidates.length === 0 || heroIndex === -1) return undefined;
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroCandidates.length);
        }, 8000);

        return () => clearInterval(interval);
    }, [heroCandidates, heroIndex]);

    useEffect(() => {
        if (heroCandidates.length > 0 && heroIndex >= 0) {
            setHeroContent(heroCandidates[heroIndex]);
            setLogoError(false);
        }
    }, [heroIndex, heroCandidates]);

    const openDetails = (item) => {
        if (!item) return;
        const type = getMediaType(item);
        navigate(`/${type}/${item.id}`, { state: { movie: item, type } });
    };

    const openWatch = (item) => {
        const type = getMediaType(item);
        const season = item.season || 1;
        const episode = item.episode || 1;
        const path = type === "movie" ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}?season=${season}&episode=${episode}`;
        navigate(path);
    };

    const title = getTitle(heroContent);
    const releaseYear = getYear(heroContent);
    const rating = getRating(heroContent);

    return (
        <div className="epicstream-home">
            <Navbar />

            {isLoadingHero ? <HeroSkeleton /> : (
                <section className="browse-hero">
                    {heroCandidates.map((candidate, idx) => (
                        (candidate.backdrop_path || candidate.poster_path) && (
                            <img 
                                key={`hero-img-${candidate.id}`}
                                className={`browse-hero-image ${idx === heroIndex ? 'active' : ''}`} 
                                src={imageUrl(
                                    isMobile 
                                        ? (candidate.textless_poster || candidate.poster_path || candidate.backdrop_path) 
                                        : (candidate.backdrop_path || candidate.poster_path), 
                                    "original"
                                )} 
                                alt={getTitle(candidate)} 
                            />
                        )
                    ))}
                    <div className="browse-hero-shade" />
                    <div key={heroContent?.id + "-content"} className="browse-hero-content">
                        {!logoError && heroContent?.title_logo ? (
                            <div className="hero-logo-container">
                                <img 
                                    src={imageUrl(heroContent.title_logo, "w500")} 
                                    alt={title} 
                                    className="hero-title-logo"
                                    onError={() => setLogoError(true)}
                                />
                            </div>
                        ) : (
                            <h1>{title}</h1>
                        )}
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
                                    const type = getMediaType(heroContent);
                                    addToHistory(heroContent, type);
                                    navigate(`/watch/${type}/${heroContent.id}`);
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

                    <div className="hero-pagination-container">
                        {heroCandidates.map((candidate, idx) => {
                            const isActive = idx === heroIndex;
                            const isPast = idx < heroIndex;
                            return (
                                <div 
                                    key={`pagination-${candidate.id}`}
                                    className={`hero-pagination-pill ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                                    onClick={() => setHeroIndex(idx)}
                                >
                                    {(isActive || isPast) && (
                                        <div 
                                            key={isActive ? `progress-${heroIndex}` : `past-${idx}`} 
                                            className="pill-progress" 
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>            )}

            <main className="browse-main">
                {contentRows.map((row) => (
                    <MovieRow 
                        key={row.title} 
                        row={row} 
                        openDetails={row.isHistory ? openWatch : openDetails} 
                        onRemoveHistory={handleRemoveFromHistory}
                    />
                ))}
            </main>

            {showScrollTop && (
                <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
                    <ArrowUp size={24} />
                </button>
            )}

            <Footer />
        </div>
    );
};

export default HomeScreen;
