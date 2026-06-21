import { BookmarkPlus, Search, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./myList.css";

const MyListPage = () => {
    const navigate = useNavigate();

    return (
        <div className="my-list-page">
            <button className="back-btn-simple" onClick={() => navigate("/")} aria-label="Go back">
                <ChevronLeft size={24} />
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
