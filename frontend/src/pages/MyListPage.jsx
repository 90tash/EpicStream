import { useEffect } from "react";
import { ChevronLeft, List, Plus, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useWatchlistStore } from "../stores/watchlist";
import { imageUrl } from "../utils/tmdb";
import "./myList.css";

const MyListPage = () => {
    const navigate = useNavigate();
    const { watchlist } = useWatchlistStore();

    useEffect(() => {
        document.title = "My List - EpicStream";
        return () => {
            document.title = "EpicStream";
        };
    }, []);

    const handleItemClick = (item) => {
        navigate(`/${item.type}/${item.id}`, { state: { movie: item } });
    };

    return (
        <div className="my-list-page">
            <button className="back-btn-simple" onClick={() => navigate("/")} aria-label="Go back">
                <ChevronLeft size={24} />
            </button>

            {watchlist.length === 0 ? (
                <main className="my-list-empty">
                    <div className="my-list-empty-topbar">
                        <header className="my-list-empty-header">
                            <h1>My Lists</h1>
                            <p>0 / 15 lists</p>
                        </header>
                        <Link to="/" className="my-list-action">
                            <Plus size={18} />
                            New List
                        </Link>
                    </div>
                    <section className="my-list-empty-state">
                        <List size={64} aria-hidden="true" />
                        <h2>No lists yet</h2>
                        <p>Create a list to start organizing your movies and shows.</p>
                    </section>
                </main>
            ) : (
                <main className="my-list-container">
                    <h1>My Lists</h1>
                    <div className="my-list-grid">
                        {watchlist.map((item) => (
                            <div 
                                key={item.id + item.type} 
                                className="my-list-item"
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="card-img-wrapper">
                                    <img 
                                        src={imageUrl(item.poster_path, "w342")} 
                                        alt={item.title} 
                                        loading="lazy"
                                    />
                                </div>
                                <span className="my-list-title">{item.title}</span>
                                <div className="my-list-meta">
                                    {item.vote_average > 0 && (
                                        <span className="rating">
                                            <Star size={11} fill="currentColor" />
                                            {item.vote_average.toFixed(1)}
                                        </span>
                                    )}
                                    <span>
                                        {item.vote_average > 0 && <span className="bullet"> • </span>}
                                        {item.type === "movie" ? "Movie" : "TV Show"}
                                    </span>
                                    {(item.release_date || item.first_air_date) && (
                                        <span>
                                            <span className="bullet"> • </span>
                                            {(item.release_date || item.first_air_date || "").slice(0, 4)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            )}
        </div>
    );
};

export default MyListPage;
