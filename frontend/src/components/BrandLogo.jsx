/* eslint-disable react/prop-types */
import "./brandLogo.css";

const BrandLogo = ({ compact = false }) => {
    return (
        <span className={`brand-logo ${compact ? "compact" : ""}`} aria-label="EpicStream">
            <img 
                src="/epicstream-logo.png" 
                alt="EpicStream" 
                className="brand-logo-img"
            />
        </span>
    );
};

export default BrandLogo;
