import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronDown, List, Plus, Star, Shuffle, Trash2, FolderClosed, Pencil, Check } from "lucide-react";
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
    const [expandedListId, setExpandedListId] = useState(null);
    const [isEditingList, setIsEditingList] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        setIsEditingList(false);
    }, [expandedListId]);

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
            if (expandedListId === id) {
                setExpandedListId(null);
            }
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

    return (
        <div className="my-list-page">
            {/* Back to Home Button */}
            <button 
                className="back-btn-simple" 
                onClick={() => navigate("/")} 
                aria-label="Go back to Home"
            >
                <ChevronLeft size={24} />
            </button>

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

                {/* Vertical Expandable List of Folders */}
                <div className="lists-vertical-list">
                    {allLists.map((list) => {
                        const isExpanded = expandedListId === list.id;
                        const firstItem = list.items[0];
                        const bgPoster = firstItem ? imageUrl(firstItem.poster_path, "w92") : null;

                        return (
                            <div 
                                key={list.id} 
                                className={`list-row-container ${isExpanded ? 'expanded' : ''}`}
                            >
                                <div 
                                    className="list-row-item"
                                    onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                                >
                                    <div className="row-preview-container">
                                        {bgPoster ? (
                                            <img src={bgPoster} alt="" className="row-bg-poster" />
                                        ) : (
                                            <div className="row-gradient-bg">
                                                <FolderClosed size={20} />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="row-details">
                                        <h3 className="row-name">{list.name}</h3>
                                        <p className="row-meta">
                                            {list.isDefault ? "Default list" : "Custom list"} • {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                                        </p>
                                    </div>

                                    <div className="row-arrow">
                                        <ChevronDown size={22} strokeWidth={2.5} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="row-expanded-content">
                                        <div className="expanded-actions-header">
                                            <span className="expanded-section-title">List Items</span>
                                            <div className="expanded-actions-buttons">
                                                {list.items.length > 0 && (
                                                    <button 
                                                        className={`expanded-action-btn edit-btn ${isEditingList ? 'active' : ''}`}
                                                        onClick={() => setIsEditingList(!isEditingList)}
                                                        title={isEditingList ? "Done editing" : "Edit list items"}
                                                    >
                                                        {isEditingList ? <Check size={16} /> : <Pencil size={16} />}
                                                    </button>
                                                )}
                                                {!list.isDefault && (
                                                    <button 
                                                        className="expanded-action-btn delete-list-btn"
                                                        onClick={() => handleDeleteList(list.id, list.name)}
                                                        title="Delete entire list"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {list.items.length === 0 ? (
                                            <div className="row-empty-content">
                                                <List size={32} />
                                                <p>This list is empty. Browse movies/shows to add some!</p>
                                            </div>
                                        ) : (
                                            <div className={`row-items-grid ${isEditingList ? 'grid-editing' : ''}`}>
                                                {list.items.map((item) => (
                                                    <div 
                                                        key={item.id + item.type} 
                                                        className="my-list-item"
                                                        onClick={() => {
                                                            if (isEditingList) {
                                                                toggleItemInList(list.id, item, item.type);
                                                                toast.success(`Removed from "${list.name}"`);
                                                            } else {
                                                                handleItemClick(item);
                                                            }
                                                        }}
                                                    >
                                                        <div className="card-img-wrapper">
                                                            <img 
                                                                src={imageUrl(item.poster_path, "w185")} 
                                                                alt={item.title} 
                                                                loading="lazy"
                                                            />
                                                            <button
                                                                className="remove-item-badge"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleItemInList(list.id, item, item.type);
                                                                    toast.success(`Removed from "${list.name}"`);
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
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default MyListPage;
