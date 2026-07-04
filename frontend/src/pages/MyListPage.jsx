import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronDown, ChevronUp, List, Plus, Shuffle, Trash2, Pencil, Check, X, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlistStore } from "../stores/watchlist";
import { useCustomListsStore } from "../stores/customLists";
import { imageUrl } from "../utils/tmdb";
import { getHistory, removeFromHistory } from "../utils/history";
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
    const { customLists, createList, deleteList, toggleItemInList, moveList, renameList } = useCustomListsStore();

    const [isCreationBarOpen, setIsCreationBarOpen] = useState(false);
    const [listName, setListName] = useState("");
    const [expandedListId, setExpandedListId] = useState(null);
    const [isEditingList, setIsEditingList] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [renamingListId, setRenamingListId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [currentlyWatching, setCurrentlyWatching] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        setIsEditingList(false);
    }, [expandedListId]);

    useEffect(() => {
        if (isReordering) {
            setExpandedListId(null);
            setIsCreationBarOpen(false);
        } else {
            setRenamingListId(null);
            setRenameValue("");
        }
    }, [isReordering]);

    const handleSaveRename = (id) => {
        const trimmed = renameValue.trim();
        if (!trimmed) {
            setRenamingListId(null);
            return;
        }
        const res = renameList(id, trimmed);
        if (!res.success) {
            alert(res.error || "Failed to rename list.");
        }
        setRenamingListId(null);
    };

    useEffect(() => {
        document.title = "My Lists - EpicStream";
        setCurrentlyWatching(getHistory());
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
            setListName("");
            setIsCreationBarOpen(false);
        }
    };

    const handleDeleteList = (id, name) => {
        if (window.confirm(`Are you sure you want to delete the list "${name}"?`)) {
            deleteList(id);
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
        {
            id: "currently_watching",
            name: "Currently Watching",
            items: currentlyWatching,
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
                        <p>{totalListsCount} / 16 lists</p>
                    </header>
                    <div className="topbar-actions">
                        <button 
                            className={`my-list-action edit-lists-btn ${isReordering ? 'active' : ''}`}
                            onClick={() => setIsReordering(!isReordering)}
                            title={isReordering ? "Done reordering" : "Reorder lists"}
                        >
                            {isReordering ? <Check size={18} /> : <Pencil size={18} />}
                        </button>
                        <button 
                            className={`my-list-action ${isCreationBarOpen ? 'active' : ''}`}
                            onClick={() => setIsCreationBarOpen(!isCreationBarOpen)}
                            disabled={totalListsCount >= 16 && !isCreationBarOpen}
                        >
                            {isCreationBarOpen ? "Cancel" : (
                                <>
                                    <Plus size={18} />
                                    New List
                                </>
                            )}
                        </button>
                    </div>
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
                        {listName && (
                            <button
                                type="button"
                                className="inline-creation-clear-btn"
                                onClick={() => {
                                    setListName("");
                                    if (inputRef.current) inputRef.current.focus();
                                }}
                                aria-label="Clear list name"
                            >
                                <X size={18} />
                            </button>
                        )}
                        <div className="inline-creation-actions">
                            <button
                                type="button"
                                className="shuffle-btn"
                                onClick={handleShuffleName}
                                title="Suggest a random list name"
                            >
                                <Shuffle size={14} />
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

                        return (
                            <div 
                                key={list.id} 
                                className={`list-row-container ${isExpanded ? 'expanded' : ''} ${isReordering ? 'reordering-mode' : ''}`}
                            >
                                <div 
                                    className="list-row-item"
                                    onClick={() => {
                                        if (isReordering) return;
                                        setExpandedListId(isExpanded ? null : list.id);
                                    }}
                                >
                                    <div className="row-details">
                                        {renamingListId === list.id ? (
                                            <form 
                                                className="rename-form" 
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    handleSaveRename(list.id);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="text"
                                                    className="rename-input"
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value.slice(0, 50))}
                                                    maxLength={50}
                                                    autoFocus
                                                    onBlur={() => handleSaveRename(list.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            setRenamingListId(null);
                                                        }
                                                    }}
                                                />
                                            </form>
                                        ) : (
                                            <div className="row-name-wrap">
                                                <h3 className="row-name">{list.name}</h3>
                                                {isReordering && !list.isDefault && (
                                                    <button
                                                        type="button"
                                                        className="rename-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRenamingListId(list.id);
                                                            setRenameValue(list.name);
                                                        }}
                                                        title="Rename List"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <p className="row-meta">
                                            {list.isDefault ? "Default list • " : ""}
                                            {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                                        </p>
                                    </div>

                                    <div className="list-row-right-corner">
                                        {isReordering && !list.isDefault && (
                                            <div className="reorder-actions-buttons" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    className="reorder-action-btn move-up-btn"
                                                    disabled={customLists.findIndex(l => l.id === list.id) === 0}
                                                    onClick={() => moveList(list.id, "up")}
                                                    title="Move Up"
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button 
                                                    className="reorder-action-btn move-down-btn"
                                                    disabled={customLists.findIndex(l => l.id === list.id) === customLists.length - 1}
                                                    onClick={() => moveList(list.id, "down")}
                                                    title="Move Down"
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                        )}
                                        {!isReordering && isExpanded && (
                                            <div className="expanded-actions-buttons" onClick={(e) => e.stopPropagation()}>
                                                {list.items.length > 0 && (
                                                    <button 
                                                        className={`expanded-action-btn edit-btn ${isEditingList ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsEditingList(!isEditingList);
                                                        }}
                                                        title={isEditingList ? "Done editing" : "Edit list items"}
                                                    >
                                                        {isEditingList ? <Check size={16} /> : <Pencil size={16} />}
                                                    </button>
                                                )}
                                                {!list.isDefault && (
                                                    <button 
                                                        className="expanded-action-btn delete-list-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteList(list.id, list.name);
                                                        }}
                                                        title="Delete entire list"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {!isReordering && (
                                            <div className="list-row-arrow">
                                                <ChevronDown size={22} strokeWidth={2.5} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="row-expanded-content">

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
                                                                if (list.id === "currently_watching") {
                                                                    removeFromHistory(item.id);
                                                                    setCurrentlyWatching(getHistory());
                                                                } else {
                                                                    toggleItemInList(list.id, item, item.type);
                                                                }
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
                                                            {isEditingList && (
                                                                <button
                                                                    className="remove-item-badge"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (list.id === "currently_watching") {
                                                                            removeFromHistory(item.id);
                                                                            setCurrentlyWatching(getHistory());
                                                                        } else {
                                                                            toggleItemInList(list.id, item, item.type);
                                                                        }
                                                                    }}
                                                                    title="Remove from list"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className="my-list-title">{item.title}</span>
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
