import { BookmarkPlus, Search, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./myList.css";

const MyListPage = () => {
    const navigate = useNavigate();

    return (
        <div className="my-list-page">
            <button className="back-btn-simple" onClick={() => navigate("/")} aria-label="Go back" style={{
                position: 'absolute',
                left: '4%',
                top: '32px',
                zIndex: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer'
            }}>
                <ChevronLeft size={24} style={{ marginRight: '2px' }} />
            </button>

            <main className="my-list-empty">
                <div className="my-list-icon">
                    <BookmarkPlus size={54} />
                </div>
                <span className="my-list-kicker">Your library</span>
                <h1>Build your EpicStream watchlist.</h1>
                <p>
                    Save movies and shows you want to revisit. This demo keeps the list page ready for the next watchlist feature.
                </p>
                <Link to="/search" className="my-list-action">
                    <Search size={18} />
                    Find something to watch
                </Link>
            </main>
        </div>
    );
};

export default MyListPage;
