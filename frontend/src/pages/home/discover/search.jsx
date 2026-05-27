import { ChevronDown, Search, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatMediaType, getMediaType, getRating, getTitle, getYear, imageUrl, tmdbFetch } from "../../../utils/tmdb";
import "./search.css";

const categories = [
    { label: "Movies & TV Shows", value: "multi" },
    { label: "Movies", value: "movie" },
    { label: "TV Shows", value: "tv" },
    { label: "People", value: "person" },
];

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [category, setCategory] = useState(categories[0]);
    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isSearchOpen = searchParams.get('search') === 'true';

    useEffect(() => {
        if (isSearchOpen) {
            setSearchTerm("");
            setSearchResults([]);
            setHasSearched(false);
            setExpandedId(null);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSearchOpen]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return undefined;
        }

        const timeout = setTimeout(async () => {
            setIsLoading(true);
            setHasSearched(true);

            try {
                const path = category.value === "multi" ? "/search/multi" : `/search/${category.value}`;
                const data = await tmdbFetch(path, { query: searchTerm.trim(), include_adult: "false" });
                const filteredResults = (data.results || []).filter(
                    (result) => {
                        const hasImage = result.poster_path || result.profile_path || result.backdrop_path;
                        if (!hasImage) return false;
                        if (category.value === "multi" && result.media_type === "person") return false;
                        return true;
                    }
                );
                setSearchResults(filteredResults.slice(0, 12));
            } catch (error) {
                console.error("Error fetching search results:", error);
            } finally {
                setIsLoading(false);
            }
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchTerm, category]);

    const handleClose = () => {
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete('search');
        navigate(`${location.pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`);
    };

    const handleResultClick = (result) => {
        handleClose();
        const type = getMediaType(result);
        if (type === "movie") navigate(`/movie/${result.id}`, { state: { movie: result } });
        if (type === "tv") navigate(`/tv/${result.id}`, { state: { movie: result } });
        if (type === "person") navigate(`/person/${result.id}`, { state: { person: result } });
    };

    const handlePlay = async (e, result) => {
        e.stopPropagation();
        const type = getMediaType(result);
        try {
            let imdbId = null;
            if (type === "movie") {
                const data = await tmdbFetch(`/movie/${result.id}`);
                imdbId = data.imdb_id;
            } else if (type === "tv") {
                const data = await tmdbFetch(`/tv/${result.id}/external_ids`);
                imdbId = data.imdb_id;
            }

            if (imdbId) {
                const url = type === "movie" 
                    ? `https://www.playimdb.com/title/${imdbId}` 
                    : `https://www.playimdb.com/title/${imdbId}/season/1/episode/1`;
                window.open(url, '_blank');
            } else {
                alert("Player not available for this title.");
            }
        } catch (error) {
            console.error("Error launching player:", error);
            alert("Unable to launch player. Please try again.");
        }
    };

    if (!isSearchOpen) return null;

    return (
        <div className="search-page">
            <div className="search-shade" onClick={handleClose} />

            <main className={`search-modal ${searchResults.length > 0 || isLoading || (hasSearched && searchResults.length === 0) ? "has-results" : ""}`}>
                <div className="search-modal-top">
                    <h1>Search</h1>
                    <div className="search-controls">
                        <div className="search-category">
                            <button type="button" onClick={() => setCategoryOpen((value) => !value)}>
                                {category.label}
                                <ChevronDown size={18} className={categoryOpen ? "open" : ""} />
                            </button>
                            {categoryOpen && (
                                <div className="search-category-menu">
                                    {categories.map((item) => (
                                        <button
                                            type="button"
                                            className={item.value === category.value ? "active" : ""}
                                            key={item.value}
                                            onClick={() => {
                                                setCategory(item);
                                                setCategoryOpen(false);
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="button" className="search-close" onClick={handleClose} aria-label="Close search">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <label className="search-input-wrap">
                    <Search size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type here to search..."
                        autoFocus
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search">
                            <X size={18} />
                        </button>
                    )}
                </label>

                <section className="search-results-panel">
                    {isLoading ? (
                        <p className="loading-text">Searching...</p>
                    ) : hasSearched && searchResults.length === 0 ? (
                        <p className="no-results">No results found for "{searchTerm}".</p>
                    ) : (
                        searchResults.map((result) => {
                            const key = `${result.id}-${getMediaType(result)}`;
                            const expanded = expandedId === key;
                            const rating = getRating(result);

                            return (
                                <article className={`search-result-row ${expanded ? "expanded" : ""}`} key={key}>
                                    <img src={imageUrl(result.poster_path || result.profile_path, "w185")} alt={getTitle(result)} />
                                    <div className="search-result-body">
                                        <button type="button" className="search-result-main" onClick={() => setExpandedId(expanded ? null : key)}>
                                            <span>
                                                <strong>{getTitle(result)}</strong>
                                                <span className="search-result-meta">
                                                    {formatMediaType(getMediaType(result))}
                                                    {getYear(result) && <span>{getYear(result)}</span>}
                                                    {rating && (
                                                        <span className="rating">
                                                            <Star size={13} fill="currentColor" />
                                                            {rating}
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <ChevronDown size={18} className={expanded ? "open" : ""} />
                                        </button>

                                        {expanded && (
                                            <div className="search-expanded">
                                                <p>{result.overview || result.known_for_department || "Open this title to see more details."}</p>
                                                <div className="search-expanded-actions">
                                                    {getMediaType(result) !== "person" && (
                                                        <button type="button" className="mini-play" onClick={(e) => handlePlay(e, result)}>
                                                            Play
                                                        </button>
                                                    )}
                                                    <button type="button" className="mini-more" onClick={() => handleResultClick(result)}>
                                                        See more
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    )}
                </section>
            </main>
        </div>
    );
};

export default SearchPage;
