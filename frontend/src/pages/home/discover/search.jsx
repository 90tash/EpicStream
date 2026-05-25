import { ChevronDown, Search, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

    const backdrop = useMemo(() => {
        const result = searchResults.find((item) => item.backdrop_path || item.poster_path);
        return imageUrl(result?.backdrop_path || result?.poster_path, "original", "/hero.png");
    }, [searchResults]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setSearchTerm("");
        setSearchResults([]);
        setHasSearched(false);
    }, []);

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
                    (result) => result.poster_path || result.profile_path || result.backdrop_path
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

    const handleResultClick = (result) => {
        const type = getMediaType(result);
        if (type === "movie") navigate("/moviedetails", { state: { movie: result } });
        if (type === "tv") navigate("/tvdetails", { state: { movie: result } });
        if (type === "person") navigate("/peopledetails", { state: { person: result } });
    };

    return (
        <div className="search-page">
            <img className="search-bg" src={backdrop} alt="" />
            <div className="search-shade" />

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
                        <button type="button" className="search-close" onClick={() => navigate(-1)} aria-label="Close search">
                            <X size={26} />
                        </button>
                    </div>
                </div>

                <label className="search-input-wrap">
                    <Search size={26} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Type here to search..."
                        autoFocus
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search">
                            <X size={22} />
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
                                                    <button type="button" className="mini-play" onClick={() => handleResultClick(result)}>
                                                        Play
                                                    </button>
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
