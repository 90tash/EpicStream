import { useEffect, useState, useRef } from "react";
import { ChevronLeft, List, Plus, Star, Shuffle, Trash2, FolderClosed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlistStore } from "../stores/watchlist";
import { useCustomListsStore } from "../stores/customLists";
import { imageUrl } from "../utils/tmdb";
import toast from "react-hot-toast";
import "./myList.css";

const RANDOM_LIST_NAMES = [
    "Friday Binge",
    "Sci-Fi Favorites",
    "Action Packed",
    "Chilled Sunday",
    "Classics to Watch",
    "Late Night Thrills",
    "Must-Watch Movies",
    "Anime Marathon",
    "Documentary Night",
    "Award Winners",
    "Guilty Pleasures",
    "Epic Adventures",
    "Family Movie Night",
    "Spooky Season",
    "Rom-Com Escapes"
];

const MyListPage = () => {
    const navigate = useNavigate();
    const { watchlist } = useWatchlistStore();
    const { customLists, createList, deleteList, toggleItemInList } = useCustomListsStore();

    const [isCreationBarOpen, setIsCreationBarOpen] = useState(false);
    const [listName, setListName] = useState("");
    const [activeListId, setActiveListId] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        document.title = "My Lists - EpicStream";
        return () => {
            document.title = "EpicStream";
        };
    }, []);

    useEffect(() => {
        if (isCreationBarOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreationBarOpen]);

    const handleItemClick = (item) => {
        navigate(`/${item.type}/${item.id}`, { state: { movie: item } });
    };

    const handleShuffleName = () => {
        const randomIndex = Math.floor(Math.random() * RANDOM_LIST_NAMES.length);
        const name = RANDOM_LIST_NAMES[randomIndex];
        setListName(name);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleCreateList = (e) => {
        if (e) e.preventDefault();
        const trimmed = listName.trim();
        if (!trimmed) return;

        const res = createList(trimmed);
        if (res.success) {
            toast.success(`List "${res.list.name}" created!`);
            setListName("");
            setIsCreationBarOpen(false);
        } else {
            toast.error(res.error || "Failed to create list.");
        }
    };

    const handleDeleteList = (id, name) => {
        if (window.confirm(`Are you sure you want to delete the list "${name}"?`)) {
            deleteList(id);
            toast.success(`List "${name}" deleted.`);
            setActiveListId(null);
        }
    };

    // Combine default watchlist and custom lists
    const allLists = [
        {
            id: "watchlist",
            name: "My Watchlist",
            items: watchlist,
            isDefault: true
        },
        ...customLists
    ];

    const totalListsCount = allLists.length;
    const activeList = allLists.find(l => l.id === activeListId);

    // If active list was deleted or not found, fallback to null
    useEffect(() => {
        if (activeListId && !activeList) {
            setActiveListId(null);
        }
    }, [activeListId, activeList]);

    return (
        <div className="my-list-page">
            {/* Back to Home Button */}
            <button 
                className="back-btn-simple" 
                onClick={() => {
                    if (activeListId) {
                        setActiveListId(null);
                    } else {
                        navigate("/");
                    }
                }} 
                aria-label="Go back"
            >
                <ChevronLeft size={24} />
            </button>

            {!activeListId ? (
                // --- Lists Dashboard View ---
                <main className="my-list-empty">
                    <div className="my-list-empty-topbar">
                        <header className="my-list-empty-header">
                            <h1>My Lists</h1>
                            <p>{totalListsCount} / 15 lists</p>
                        </header>
                        <button 
                            className={`my-list-action ${isCreationBarOpen ? 'active' : ''}`}
                            onClick={() => setIsCreationBarOpen(!isCreationBarOpen)}
                            disabled={totalListsCount >= 15 && !isCreationBarOpen}
                        >
                            {isCreationBarOpen ? "Cancel" : (
                                <>
                                    <Plus size={18} />
                                    New List
                                </>
                            )}
                        </button>
                    </div>

                    {/* Inline Creation Bar */}
                    {isCreationBarOpen && (
                        <form className="inline-creation-bar" onSubmit={handleCreateList}>
                            <input
                                ref={inputRef}
                                type="text"
                                className="inline-creation-input"
                                placeholder="List name..."
                                value={listName}
                                onChange={(e) => setListName(e.target.value.slice(0, 50))}
                                maxLength={50}
                            />
                            <div className="inline-creation-actions">
                                <button
                                    type="button"
                                    className="shuffle-btn"
                                    onClick={handleShuffleName}
                                    title="Suggest a random list name"
                                >
                                    <Shuffle size={18} />
                                </button>
                                <button
                                    type="submit"
                                    className="create-btn"
                                    disabled={listName.trim().length === 0}
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Grid of Lists */}
                    <div className="lists-folder-grid">
                        {allLists.map((list) => {
                            // Take first item poster path for visual card collage background
                            const firstItem = list.items[0];
                            const bgPoster = firstItem ? imageUrl(firstItem.poster_path, "w342") : null;

                            return (
                                <div 
                                    key={list.id} 
                                    className="list-folder-card"
                                    onClick={() => setActiveListId(list.id)}
                                >
                                    <div className="folder-preview-container">
                                        {bgPoster ? (
                                            <>
                                                <img src={bgPoster} alt="" className="folder-bg-poster" />
                                                <div className="folder-overlay" />
                                            </>
                                        ) : (
                                            <div className="folder-gradient-bg" />
                                        )}
                                        <div className="folder-icon-badge">
                                            <FolderClosed size={24} />
                                        </div>
                                        <span className="folder-count-badge">
                                            {list.items.length}
                                        </span>
                                    </div>
                                    <div className="folder-details">
                                        <h3 className="folder-name">{list.name}</h3>
                                        <p className="folder-meta">
                                            {list.isDefault ? "Default list" : "Custom list"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            ) : (
                // --- Single List Detail View ---
                <main className="my-list-container">
                    <div className="list-detail-header">
                        <div>
                            <h1>{activeList.name}</h1>
                            <p className="list-detail-subtitle">
                                {activeList.items.length} {activeList.items.length === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                        {!activeList.isDefault && (
                            <button 
                                className="delete-list-btn"
                                onClick={() => handleDeleteList(activeList.id, activeList.name)}
                                title="Delete list"
                            >
                                <Trash2 size={18} />
                                <span>Delete List</span>
                            </button>
                        )}
                    </div>

                    {activeList.items.length === 0 ? (
                        <div className="empty-list-content">
                            <List size={48} />
                            <h3>This list is empty</h3>
                            <p>Browse movies and TV shows and add them to this list.</p>
                            <button className="back-to-lists-btn" onClick={() => setActiveListId(null)}>
                                Back to Lists
                            </button>
                        </div>
                    ) : (
                        <div className="my-list-grid">
                            {activeList.items.map((item) => (
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
                                        <button
                                            className="remove-item-badge"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleItemInList(activeList.id, item, item.type);
                                                toast.success(`Removed from "${activeList.name}"`);
                                            }}
                                            title="Remove from list"
                                        >
                                            &times;
                                        </button>
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
                    )}
                </main>
            )}
        </div>
    );
};

export default MyListPage;
