import { useEffect, useState } from 'react';
import './navbar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bookmark } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchClick = (e) => {
        e.preventDefault();
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('search', 'true');
        navigate(`${location.pathname}?${searchParams.toString()}`);
    };

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="left-header-items">
                <Link to={"/"} className="brand-link">
                    <BrandLogo />
                </Link>
            </div>
            <div className="right-header-items">
                <Link to="/mylist" className="bookmark-button-link" aria-label="My List">
                    <Bookmark className="bookmark-icon" />
                </Link>
                <a href="#" className='search-button-link' onClick={handleSearchClick} aria-label="Search">
                    <Search className='search-icon' />
                </a>
            </div>
        </header>
    );
};

export default Navbar;
