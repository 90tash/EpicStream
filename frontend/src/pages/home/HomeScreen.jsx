/* eslint-disable react/prop-types */
import { ChevronLeft, ChevronRight, Info, Play, Star, ArrowUp, X, Pencil, Check, Plus, Bookmark } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { formatMediaType, getMediaType, getRating, getTitle, getYear, getStatusLabel, imageUrl, tmdbFetch, tmdbGetImages } from "../../utils/tmdb";
import { addToHistory, getHistory, removeFromHistory } from "../../utils/history";
import { useWatchlistStore } from "../../stores/watchlist";
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
        params: { sort_by: "popularity.desc", "first_air_date.lte": today, without_genres: "10763,10767,10766" } 
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
        params: { sort_by: "vote_average.desc", "vote_count.gte": 250, "first_air_date.lte": today, without_genres: "10763,10767" } 
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

const RowHeader = ({ row, isEditing, onToggleEdit }) => {
    return (
        <div className={`row-heading ${row.isHistory ? "history-heading" : ""}`}>
            {row.title && <h2 className="section-title">{row.title}</h2>}
            {row.isHistory && (
                <button 
                    className="row-edit-btn" 
                    onClick={onToggleEdit}
                    aria-label={isEditing ? "Done editing" : "Edit history"}
                >
                    {isEditing ? <Check size={16} /> : <Pencil size={16} />}
                </button>
            )}
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

const HistoryCard = ({ item, openWatch, openDetails, onRemove, isEditing }) => {
    const type = item.type || getMediaType(item);
    const progress = item.percentage || 0;
    const timeAgo = getRelativeTime(item.timestamp);
    const bottomInfo = type === "tv" ? `S${item.season}:E${item.episode}` : (item.timeStr || "");

    const [bannerUrl, setBannerUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchTitledBanner = async () => {
            try {
                const data = await tmdbGetImages(type, item.id);
                if (!isMounted) return;
                if (data.backdrops && data.backdrops.length > 0) {
                    const titledBackdrops = data.backdrops.filter(b => b.iso_639_1 !== null);
                    if (titledBackdrops.length > 0) {
                        const enTitled = titledBackdrops.find(b => b.iso_639_1 === 'en');
                        const selected = enTitled || titledBackdrops[0];
                        setBannerUrl(imageUrl(selected.file_path, "w780"));
                        return;
                    }
                }
                setBannerUrl(imageUrl(item.backdrop_path || item.poster_path, "w780"));
            } catch (error) {
                console.error("Error fetching images for history item:", error);
                if (isMounted) {
                    setBannerUrl(imageUrl(item.backdrop_path || item.poster_path, "w780"));
                }
            }
        };
        fetchTitledBanner();
        return () => {
            isMounted = false;
        };
    }, [item.id, type]);

    return (
        <div 
            className={`browse-card history-card ${isEditing ? "editing" : ""}`} 
            key={`history-${item.id}`}
        >
            <div className="card-img-wrapper" onClick={() => openWatch(item)}>
                {bannerUrl && (
                    <img 
                        src={bannerUrl} 
                        alt={item.title} 
                        loading="lazy"
                    />
                )}
                {progress > 0 && (
                    <div className="card-progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
            
            {isEditing ? (
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
            ) : (
                <button 
                    className="history-info-btn" 
                    onClick={(e) => {
                        e.stopPropagation();
                        openDetails(item);
                    }}
                    aria-label="View details"
                >
                    <Info size={14} />
                </button>
            )}

            <div className="history-card-info" onClick={() => openWatch(item)}>
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

    const statusLabel = getStatusLabel(item);

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
                {statusLabel && (
                    <span className={`card-status-badge ${statusLabel.className}`}>
                        {statusLabel.text}
                    </span>
                )}
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

const MovieRow = ({ row, openDetails, openWatch, onRemoveHistory }) => {
    const sliderRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [items, setItems] = useState(row.items || []);
    const [isLoading, setIsLoading] = useState(!row.items);
    const [isEditing, setIsEditing] = useState(false);

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
        <section className={`browse-row ${isEditing ? "row-editing" : ""}`}>
            <RowHeader 
                row={row} 
                isEditing={isEditing} 
                onToggleEdit={() => setIsEditing(!isEditing)} 
            />
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
                                openWatch={openWatch}
                                openDetails={openDetails} 
                                onRemove={onRemoveHistory}
                                isEditing={isEditing}
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
    const [showPlayWarning, setShowPlayWarning] = useState(false);
    const navigate = useNavigate();
    const { toggleItem, isItemInList } = useWatchlistStore();

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
                        
                        // Filter out anime from standard TV shows sections
                        if (row.title === "Popular Shows" || row.title === "Top Rated: Series") {
                            const isAnimeShow = item.genre_ids?.includes(16) && item.original_language === "ja";
                            if (isAnimeShow) return false;
                        }
                        
                        // Filter out soap dramas from Popular Shows section
                        if (row.title === "Popular Shows") {
                            const isSoapDrama = item.genre_ids?.includes(10766);
                            if (isSoapDrama) return false;
                        }
                        
                        return hasImage;
                    })
                    .slice(0, row.topTen ? 10 : 20);
                
                // Fetch extra details for TV shows to check for "New Season", and movie release dates for digital release checks
                const detailedResults = await Promise.all(results.map(async (item) => {
                    const mediaType = getMediaType(item);
                    if (mediaType === "tv") {
                        try {
                            const details = await tmdbFetch(`/tv/${item.id}`);
                            return { ...item, ...details };
                        } catch (e) {
                            console.error("Error fetching tv details:", e);
                            return item;
                        }
                    } else if (mediaType === "movie") {
                        try {
                            const releaseData = await tmdbFetch(`/movie/${item.id}/release_dates`);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const hasDigitalRelease = releaseData.results?.some(country => 
                                country.release_dates?.some(release => {
                                    const releaseDate = new Date(release.release_date);
                                    releaseDate.setHours(0, 0, 0, 0);
                                    return release.type === 4 && releaseDate <= today;
                                })
                            ) || false;
                            return { ...item, has_digital_release: hasDigitalRelease };
                        } catch (e) {
                            console.error("Error fetching movie release dates:", e);
                            return item;
                        }
                    }
                    return item;
                }));
                
                setContentRows(prev => {
                    const next = [...prev];
                    next[rowIndex] = { ...next[rowIndex], items: detailedResults };
                    return next;
                });

                // Use the first non-history row for hero candidates (limit to 5)
                const firstDataRowIndex = contentRows.findIndex(r => !r.isHistory);
                if (rowIndex === firstDataRowIndex) {
                    const heroWithDetails = await Promise.all(detailedResults.slice(0, 5).map(async (item) => {
                        try {
                            const type = getMediaType(item);
                            const [images, releaseData] = await Promise.all([
                                tmdbGetImages(type, item.id),
                                type === "movie" 
                                    ? tmdbFetch(`/movie/${item.id}/release_dates`) 
                                    : Promise.resolve({ results: [] })
                            ]);
                            
                            // Look for English or null (textless) posters
                            const posters = images.posters || [];
                            const textlessPoster = posters.find(p => p.iso_639_1 === null)?.file_path;
                            
                            // Find the best title logo (English first, then untagged/null, then any)
                            const logos = images.logos || [];
                            const titleLogo = logos.find(l => l.iso_639_1 === "en")?.file_path ||
                                              logos.find(l => l.iso_639_1 === null)?.file_path ||
                                              logos[0]?.file_path;
                            
                            // Check if digitally released
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const hasDigitalRelease = releaseData.results?.some(country => 
                                country.release_dates?.some(release => {
                                    const releaseDate = new Date(release.release_date);
                                    releaseDate.setHours(0, 0, 0, 0);
                                    return release.type === 4 && releaseDate <= today;
                                })
                            ) || false;
                            
                            return { ...item, textless_poster: textlessPoster, title_logo: titleLogo, has_digital_release: hasDigitalRelease };
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
    const heroType = heroContent ? getMediaType(heroContent) : "movie";
    const heroInList = heroContent ? isItemInList(heroContent.id) : false;
    const heroStatus = getStatusLabel(heroContent);

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
                            {heroStatus && (
                                <span>{heroStatus.text}</span>
                            )}
                        </div>
                        <p>{heroContent?.overview || "Movies, shows, trailers and more are ready to watch."}</p>
                        <div className="browse-actions">
                            <button
                                type="button"
                                className="browse-play"
                                onClick={() => {
                                    const type = getMediaType(heroContent);
                                    const status = getStatusLabel(heroContent);
                                    const isCinemas = status?.text === "In Cinemas";
                                    const isUpcoming = status?.text === "Upcoming";
                                    
                                    if (isUpcoming || (isCinemas && !heroContent.has_digital_release)) {
                                        setShowPlayWarning(true);
                                    } else {
                                        addToHistory(heroContent, type);
                                        navigate(`/watch/${type}/${heroContent.id}`);
                                    }
                                }}
                            >
                                <Play size={20} fill="currentColor" />
                                Play
                            </button>
                            <div className="browse-action-group">
                                <button
                                    type="button"
                                    className={`browse-group-btn add-list-btn ${heroInList ? "active" : ""}`}
                                    onClick={() => toggleItem(heroContent, heroType)}
                                    title={heroInList ? "Remove from List" : "Add to List"}
                                    aria-label={heroInList ? "Remove from List" : "Add to List"}
                                >
                                    {heroInList ? <Bookmark size={20} fill="currentColor" /> : <Plus size={20} />}
                                </button>
                                <span className="browse-divider" />
                                <button
                                    type="button"
                                    className="browse-group-btn"
                                    onClick={() => openDetails(heroContent)}
                                    title="View details"
                                    aria-label="View details"
                                >
                                    <Info size={20} />
                                </button>
                            </div>
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
                        openDetails={openDetails} 
                        openWatch={openWatch}
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

            {/* Warning Play Modal (In Cinemas / Upcoming) */}
            {showPlayWarning && heroContent && (
                <div className="warning-modal-overlay" onClick={() => setShowPlayWarning(false)}>
                    <div className="warning-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="warning-title">
                            {getStatusLabel(heroContent)?.text === "In Cinemas" ? "Currently In Cinemas" : "Upcoming Release"}
                        </h2>
                        <p className="warning-description">
                            {getStatusLabel(heroContent)?.text === "In Cinemas"
                                ? "This movie is currently in theatres. A high-quality digital stream may not be available yet."
                                : "This content is scheduled for a future release. A stream may not be available or could be incomplete."}
                        </p>
                        <div className="warning-actions">
                            {getStatusLabel(heroContent)?.text !== "Upcoming" && (
                                <button 
                                    type="button" 
                                    className="warning-btn-primary"
                                    onClick={() => {
                                        setShowPlayWarning(false);
                                        const type = getMediaType(heroContent);
                                        addToHistory(heroContent, type);
                                        navigate(`/watch/${type}/${heroContent.id}`);
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
        </div>
    );
};

export default HomeScreen;
