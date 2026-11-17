import { ChevronDown, Search, Star, X, Mic } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const categoryRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isSearchOpen = searchParams.get('search') === 'true';

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 5;
            recognition.lang = navigator.language || "en-US";

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = async (event) => {
                if (!event.results || event.results.length === 0) return;
                const result = event.results[0];
                const candidates = [];
                for (let i = 0; i < result.length; i++) {
                    const text = result[i]?.transcript?.trim().replace(/\.$/, "");
                    if (text && !candidates.includes(text)) {
                        candidates.push(text);
                    }
                }

                if (candidates.length === 0) return;

                if (candidates.length === 1) {
                    setSearchTerm(candidates[0]);
                    return;
                }

                // When speech engine returns multiple hypotheses (e.g. "the odc" vs "The Odyssey"),
                // check which candidate actually yields valid movie/show results on TMDB
                try {
                    const checks = await Promise.all(
                        candidates.slice(0, 4).map(async (cand) => {
                            try {
                                const res = await tmdbFetch("/search/multi", { query: cand, include_adult: "false" });
                                const validCount = (res?.results || []).filter(item => item.poster_path || item.backdrop_path).length;
                                return { cand, validCount };
                            } catch {
                                return { cand, validCount: 0 };
                            }
                        })
                    );

                    // Pick candidate with the highest number of valid media results; fallback to primary
                    const best = checks.reduce((acc, curr) => (curr.validCount > acc.validCount ? curr : acc), checks[0]);
                    setSearchTerm(best?.cand || candidates[0]);
                } catch {
                    setSearchTerm(candidates[0]);
                }
            };

            recognition.onerror = (event) => {
                console.warn("Speech recognition error:", event.error);
                setIsListening(false);
                if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                    toast.error("Microphone access denied. Please allow mic permissions.");
                } else if (event.error !== "no-speech" && event.error !== "aborted") {
                    toast.error("Voice search error. Please try again.");
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
            }
        };
    }, []);

    const toggleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice search is not supported in this browser.");
            return;
        }

        if (isListening) {
            try {
                recognitionRef.current?.stop();
            } catch {
                // ignore
            }
            setIsListening(false);
        } else {
            setSearchTerm("");
            try {
                recognitionRef.current?.start();
            } catch (err) {
                console.warn("Recognition start error:", err);
            }
        }
    };

    useEffect(() => {
        if (isSearchOpen) {
            setSearchTerm("");
            setSearchResults([]);
            setHasSearched(false);
            setExpandedId(null);
            setCategory(categories[0]);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
            }
            setIsListening(false);
        }
        return () => {
            document.body.style.overflow = 'auto';
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch {
                    // ignore
                }
            }
            setIsListening(false);
        };
    }, [isSearchOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target)) {
                setCategoryOpen(false);
            }
        };

        if (categoryOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [categoryOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                const currentParams = new URLSearchParams(location.search);
                if (currentParams.get("search") === "true") {
                    currentParams.delete("search");
                } else {
                    currentParams.set("search", "true");
                }
                const queryString = currentParams.toString();
                navigate(`${location.pathname}${queryString ? `?${queryString}` : ""}`);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [location, navigate]);

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

    const handlePlay = (e, result) => {
        e.stopPropagation();
        handleClose();
        const type = getMediaType(result);
        navigate(`/watch/${type}/${result.id}`);
    };

    if (!isSearchOpen) return null;

    return (
        <div className="search-page">
            <div className="search-shade" onClick={handleClose} />

            <main className={`search-modal ${searchResults.length > 0 || isLoading || (hasSearched && searchResults.length === 0) ? "has-results" : ""}`}>
                <div className="search-modal-top">
                    <h1>Search</h1>
                    <div className="search-controls">
                        <div className="search-category" ref={categoryRef}>
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

                <label className={`search-input-wrap ${isListening ? "listening" : ""}`}>
                    <Search size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isListening ? "Listening... Speak movie title" : "Type here to search..."}
                        autoFocus
                    />
                    <button
                        type="button"
                        className={`search-mic-btn ${isListening ? "listening" : ""}`}
                        onClick={toggleVoiceSearch}
                        title={isListening ? "Listening... Click to stop" : "Voice search"}
                        aria-label={isListening ? "Listening... Click to stop" : "Voice search"}
                    >
                        <Mic size={18} />
                    </button>
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
                                                    <span>{formatMediaType(getMediaType(result))}</span>
                                                    {getYear(result) && (
                                                        <>
                                                            <span className="dot" />
                                                            <span>{getYear(result)}</span>
                                                        </>
                                                    )}
                                                    {rating && (
                                                        <>
                                                            <span className="dot" />
                                                            <span className="rating">
                                                                <Star size={10} fill="currentColor" />
                                                                {rating}
                                                            </span>
                                                        </>
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
