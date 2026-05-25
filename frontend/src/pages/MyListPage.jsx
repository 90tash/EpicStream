import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BookmarkPlus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import "./myList.css";

const MyListPage = () => {
    return (
        <div className="my-list-page">
            <Navbar />
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
            <Footer />
        </div>
    );
};

export default MyListPage;
