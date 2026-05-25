import { useEffect, useState } from 'react';
import './navbar.css';
import { Link } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

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

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="left-header-items">
                <Link to={"/"} className="brand-link">
                    <BrandLogo />
                </Link>
            </div>
            <div className="right-header-items">
                <Link className='search-button-link' to={"/search"} aria-label="Search">
                    <Search className='search-icon' />
                </Link>
                <Menu className='menu' />
            </div>
        </header>
    );
};

export default Navbar;
