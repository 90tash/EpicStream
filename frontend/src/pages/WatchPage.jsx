/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getPlayerUrl, tmdbFetch, ACTIVE_PROVIDER } from "../utils/tmdb";
import "./movieTvDetails.css";

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const mediaType = type === "tv" ? "tv" : "movie";

    const getPositiveInt = (value, fallback) => {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
    };

    const season = getPositiveInt(searchParams.get("season"), 1);
    const episode = getPositiveInt(searchParams.get("episode"), 1);

    const [tabTitle, setTabTitle] = useState("Loading... - EpicStream");
    const [isHovered, setIsHovered] = useState(false);

    // Fetch the title details from TMDB to dynamically name the browser tab
    useEffect(() => {
        const fetchWatchDetails = async () => {
            try {
                const details = await tmdbFetch(`/${mediaType}/${id}`);
                const name = details.title || details.name || "Watch";
                if (mediaType === "tv") {
                    setTabTitle(`${name} S${season}:E${episode} - EpicStream`);
                } else {
                    setTabTitle(`${name} - EpicStream`);
                }
            } catch (err) {
                console.error("Failed to fetch TMDB details:", err);
                setTabTitle("EpicStream");
            }
        };
        fetchWatchDetails();
    }, [id, mediaType, season, episode]);

    // Update document title dynamically
    useEffect(() => {
        document.title = tabTitle;
        return () => {
            document.title = "EpicStream";
        };
    }, [tabTitle]);

    // Lock body scrolling and rubber-band bouncing on mobile devices (e.g. iOS Safari)
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;

        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
        document.body.style.height = "100%";

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = originalPosition;
            document.body.style.width = originalWidth;
            document.body.style.height = originalHeight;
        };
    }, []);

    // Get the player URL dynamically using the configured active provider
    const playerUrl = getPlayerUrl(mediaType, id, season, episode, ACTIVE_PROVIDER);

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100dvw",
            height: "100dvh",
            backgroundColor: "#000",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            {/* Elegant Floating Back Button with Safe Area Insets for Mobile Notches */}
            <button
                onClick={() => navigate(-1)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label="Go back"
                style={{
                    position: "absolute",
                    top: "max(16px, env(safe-area-inset-top))",
                    left: "max(16px, env(safe-area-inset-left))",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isHovered ? "rgba(255, 38, 51, 0.95)" : "rgba(0, 0, 0, 0.65)",
                    border: isHovered ? "1px solid #ff2633" : "1px solid rgba(255, 255, 255, 0.25)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "#fff",
                    cursor: "pointer",
                    zIndex: 10000,
                    opacity: 0.85,
                    transform: isHovered ? "scale(1.08)" : "scale(1)",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
                    padding: 0
                }}
            >
                <ChevronLeft size={24} style={{ marginRight: "2px" }} />
            </button>

            {/* Direct Videasy Embed Player Iframe */}
            <iframe
                src={playerUrl}
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: "100%",
                    minHeight: "100%",
                    border: "none",
                    background: "#000",
                    overflow: "hidden",
                    display: "block"
                }}
                scrolling="no"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                title="Videasy Stream Player"
            />
        </div>
    );
};

export default WatchPage;
