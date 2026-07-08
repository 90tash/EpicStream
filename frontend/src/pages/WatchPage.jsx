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

    // Get the player URL dynamically using the configured active provider
    const playerUrl = getPlayerUrl(mediaType, id, season, episode, ACTIVE_PROVIDER);

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
                className="back-btn"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                style={{ zIndex: 10000 }}
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
