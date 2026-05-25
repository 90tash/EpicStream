/* eslint-disable react/prop-types */
import { Play } from "lucide-react";
import "./brandLogo.css";

const BrandLogo = ({ compact = false }) => {
    return (
        <span className={`brand-logo ${compact ? "compact" : ""}`} aria-label="EpicStream">
            <span className="brand-mark">
                <Play size={compact ? 18 : 22} fill="currentColor" />
            </span>
            <span className="brand-name">EpicStream</span>
        </span>
    );
};

export default BrandLogo;
