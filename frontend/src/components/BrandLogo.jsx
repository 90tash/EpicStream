/* eslint-disable react/prop-types */
import "./brandLogo.css";

const BrandLogo = ({ compact = false }) => {
    return (
        <span className={`brand-logo ${compact ? "compact" : ""}`} aria-label="EpicStream">
            <span className="brand-mark">
                <img 
                    src="/logo.png" 
                    alt="EpicStream Logo" 
                    className="logo-image"
                />
            </span>
            <span className="brand-name">EpicStream</span>
        </span>
    );
};

export default BrandLogo;
