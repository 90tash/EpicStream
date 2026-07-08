/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getPlayerUrl, tmdbFetch } from "../utils/tmdb";

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

    // Get the Videasy embed URL directly
    const playerUrl = getPlayerUrl(mediaType, id, season, episode, "videasy");

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#000",
            zIndex: 9999,
            overflow: "hidden"
        }}>
            {/* Floating Back Button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    zIndex: 10000,
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.9)";
                    e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                    e.currentTarget.style.transform = "scale(1)";
                }}
            >
                <ChevronLeft size={24} />
            </button>

            {/* Direct Videasy Embed Player Iframe */}
            <iframe
                src={playerUrl}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "#000"
                }}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                title="Videasy Stream Player"
            />
        </div>
    );
};

export default WatchPage;
