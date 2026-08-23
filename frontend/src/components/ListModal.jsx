import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { useWatchlistStore } from "../stores/watchlist";
import { useCustomListsStore } from "../stores/customLists";
import { getMediaType } from "../utils/tmdb";

const ListModal = ({ item, anchorRect, onClose }) => {
    const { customLists, toggleItemInList, getListsForItem, createList } = useCustomListsStore();
    
    const [isCreatingInline, setIsCreatingInline] = useState(false);
    const [newListNameInline, setNewListNameInline] = useState("");
    const inlineInputRef = useRef(null);
    const menuRef = useRef(null);

    const type = item.media_type || getMediaType(item);
    const activeLists = getListsForItem(item.id);

    useEffect(() => {
        if (isCreatingInline && inlineInputRef.current) {
            inlineInputRef.current.focus();
        }
    }, [isCreatingInline]);

    useEffect(() => {
        if (anchorRect && menuRef.current) {
            const menu = menuRef.current;
            const menuRect = menu.getBoundingClientRect();
            
            // Default position: above the button, centered horizontally
            let top = anchorRect.top - menuRect.height - 10;
            let left = anchorRect.left + (anchorRect.width / 2) - (menuRect.width / 2);
            
            // Prevent going off-screen horizontally
            if (left < 10) left = 10;
            if (left + menuRect.width > window.innerWidth - 10) {
                left = window.innerWidth - menuRect.width - 10;
            }
            
            // If it goes off-screen vertically (top), show below the button instead
            if (top < 10) {
                top = anchorRect.bottom + 10;
            }

            menu.style.position = 'fixed';
            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
            menu.style.margin = '0';
        }
    }, [anchorRect, isCreatingInline]); // Re-run if it expands (isCreatingInline changes)

    const handleCreateListInline = (e) => {
        e.preventDefault();
        const trimmed = newListNameInline.trim();
        if (!trimmed) return;
        const res = createList(trimmed);
        if (res.success) {
            toggleItemInList(res.list.id, item, type);
            setIsCreatingInline(false);
            setNewListNameInline("");
        } else {
            alert(res.error);
        }
    };

    const containerStyle = anchorRect 
        ? { display: 'block', zIndex: 99999, background: 'transparent', backdropFilter: 'none' }
        : { display: 'flex', zIndex: 99999 };

    const menuStyle = anchorRect
        ? { position: 'fixed', top: '-9999px', left: '-9999px', margin: 0 } // start off-screen to measure
        : { position: 'relative', top: 'auto', left: 'auto', margin: 'auto' };

    return (
        <div className="collection-modal-overlay" onClick={onClose} style={containerStyle}>
            <div ref={menuRef} className="season-dropdown-menu lists-menu" onClick={(e) => e.stopPropagation()} style={menuStyle}>
                <div className="dropdown-options">
                    <button 
                        className={`season-option ${activeLists.includes("watchlist") ? 'active' : ''}`}
                        onClick={() => toggleItemInList("watchlist", item, type)}
                    >
                        <span className="season-option-text">My Watchlist</span>
                        {activeLists.includes("watchlist") && <Check size={16} className="active-tick" />}
                    </button>

                    {customLists.map(list => (
                        <button 
                            key={list.id}
                            className={`season-option ${activeLists.includes(list.id) ? 'active' : ''}`}
                            onClick={() => toggleItemInList(list.id, item, type)}
                        >
                            <span className="season-option-text">{list.name}</span>
                            {activeLists.includes(list.id) && <Check size={16} className="active-tick" />}
                        </button>
                    ))}
                </div>

                {isCreatingInline ? (
                    <div className="dropdown-inline-create-container">
                        <form className="dropdown-inline-create" onSubmit={handleCreateListInline}>
                            <input 
                                ref={inlineInputRef}
                                type="text"
                                className="inline-create-input"
                                placeholder="New list name..."
                                value={newListNameInline}
                                onChange={(e) => setNewListNameInline(e.target.value.slice(0, 50))}
                                maxLength={50}
                            />
                            <span className="inline-create-divider" />
                            <button 
                                type="submit" 
                                className="inline-create-submit-tick" 
                                disabled={!newListNameInline.trim()}
                                onClick={handleCreateListInline}
                                aria-label="Create List"
                            >
                                <Check size={16} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <button 
                        className="season-option create-list-option"
                        onClick={() => setIsCreatingInline(true)}
                    >
                        <span className="create-list-plus">+</span>
                        <span className="season-option-text">Create new list</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ListModal;

