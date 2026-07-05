import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPlayerUrl, getAnimePlayerUrl, tmdbFetch, getTitle } from "../utils/tmdb";
import { updateHistoryProgress } from "../utils/history";
import { isAnime } from "../utils/anilist";

// ==========================================
// FUTURE ANILIST AUTO-MAPPING CONFIGURATION
// To restore the AniList mapping feature in the future, uncomment the code blocks labeled "ANILIST EXTENSION" 
// and comment out the default "getPlayerUrl" assignment.
// ==========================================

/* [ANILIST EXTENSION - UNCOMMENT TO USE]
import { fetchAnilistAnimeList, findBestAnilistMatch } from "../utils/anilist";
*/

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();

    const season = searchParams.get("season") || 1;
    const episode = searchParams.get("episode") || 1;

    const [showPopup, setShowPopup] = useState(false);
    const [details, setDetails] = useState(null);

    // Default Player URL (Uses TMDB ID directly)
    const playerUrl = getPlayerUrl(type, id, season, episode);

    /* [ANILIST EXTENSION - UNCOMMENT TO USE]
    const [playerUrl, setPlayerUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadPlayer = async () => {
            setLoading(true);
            try {
                const details = await tmdbFetch(`/${type}/${id}`);
                
                if (!isMounted) return;

                if (isAnime(details)) {
                    const searchTitle = type === "movie" 
                        ? (details.original_title || details.title) 
                        : (details.original_name || details.name);
                    const releaseYear = (details.release_date || details.first_air_date || "").slice(0, 4);

                    const mediaList = await fetchAnilistAnimeList(searchTitle);
                    const bestMatch = findBestAnilistMatch(mediaList, searchTitle, releaseYear, type === "movie");

                    if (bestMatch && isMounted) {
                        const url = getAnimePlayerUrl(bestMatch.id, episode, type);
                        setPlayerUrl(url);
                    } else if (isMounted) {
                        setPlayerUrl(getPlayerUrl(type, id, season, episode));
                    }
                } else if (isMounted) {
                    setPlayerUrl(getPlayerUrl(type, id, season, episode));
                }
            } catch (err) {
                console.error("Error setting up player, falling back to TMDB player:", err);
                if (isMounted) {
                    setPlayerUrl(getPlayerUrl(type, id, season, episode));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadPlayer();

        return () => {
            isMounted = false;
        };
    }, [type, id, season, episode]);
    */

    // Fetch details to check if anime and trigger recommendation popup
    useEffect(() => {
        let isMounted = true;
        let timeoutId;

        const checkAnimeDetails = async () => {
            try {
                const detailsData = await tmdbFetch(`/${type}/${id}`);
                if (!isMounted) return;
                setDetails(detailsData);

                if (isAnime(detailsData)) {
                    const dismissed = sessionStorage.getItem("cypher-popup-dismissed");
                    if (!dismissed) {
                        // Delay by 1.5 seconds for a smooth entry
                        timeoutId = setTimeout(() => {
                            if (isMounted) {
                                setShowPopup(true);
                            }
                        }, 1500);
                    }
                }
            } catch (error) {
                console.error("Error checking anime status for popup:", error);
            }
        };

        checkAnimeDetails();

        return () => {
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [type, id]);

    useEffect(() => {
        if (details) {
            const title = getTitle(details);
            if (type === "tv") {
                document.title = `${title} S${season}:E${episode} - EpicStream`;
            } else {
                document.title = `${title} - EpicStream`;
            }
        } else {
            document.title = "EpicStream";
        }
        return () => {
            document.title = "EpicStream";
        };
    }, [details, type, season, episode]);

    // History and player messages tracking hook
    useEffect(() => {
        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return [h, m, s]
                .map(v => v < 10 ? "0" + v : v)
                .filter((v, i) => v !== "00" || i > 0)
                .join(":");
        };

        const handleMessage = (event) => {
            // Security vulnerability check: Only allow messages from trusted player domains
            const trustedOrigins = [
                "https://player.videasy.net", 
                "https://vidlink.pro", 
                "https://vidsrc.to", 
                "https://vidsrc.me"
            ];
            if (!trustedOrigins.includes(event.origin)) {
                return;
            }

            try {
                let data = event.data;
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
                
                // Extract video state data
                // VidLink nests its player progress events under { type: 'PLAYER_EVENT', data: { ... } }
                let playerState = null;
                if (data && data.type === "PLAYER_EVENT") {
                    playerState = data.data;
                } else if (data) {
                    playerState = data.data || data;
                }
                
                if (playerState && (playerState.time !== undefined || playerState.currentTime !== undefined)) {
                    const time = playerState.time !== undefined ? playerState.time : playerState.currentTime;
                    const duration = playerState.duration || 0;
                    const percentage = duration > 0 ? Math.round((time / duration) * 100) : 0;
                    
                    updateHistoryProgress(id, { 
                        percentage, 
                        currentTime: time,
                        duration,
                        timeStr: formatTime(time)
                    });
                }
            } catch {
                // Ignore parsing errors
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [id]);

    /* [ANILIST EXTENSION - UNCOMMENT TO USE]
    if (loading) {
        return (
            <div style={{
                width: "100vw",
                height: "100dvh",
                backgroundColor: "#020304",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px",
                color: "#fff",
                fontFamily: "sans-serif"
            }}>
                <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    border: "5px solid rgba(255, 38, 51, 0.2)",
                    borderTopColor: "#ff2633",
                    animation: "spin 1s linear infinite"
                }} />
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>
                    PREPARING PLAYER...
                </div>
            </div>
        );
    }
    */

    return (
        <div style={{ width: "100vw", height: "100dvh", backgroundColor: "#000", overflow: "hidden", position: "relative" }}>
            <iframe
                src={playerUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen *; encrypted-media; picture-in-picture; allow-presentation"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
                title="EpicStream Player"
            />

            {/* Accent Recommend Server Popup */}
            {showPopup && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    backgroundColor: "rgba(5, 6, 7, 0.75)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    animation: "epicFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}>
                    <div style={{
                        backgroundColor: "var(--panel)",
                        border: "1px solid var(--line)",
                        borderRadius: "16px",
                        maxWidth: "400px",
                        width: "100%",
                        padding: "32px 24px 24px",
                        boxShadow: "0 24px 50px rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "20px",
                        color: "var(--text)"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.01em" }}>
                                Better Experience
                            </h3>
                            <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.6" }}>
                                For the best quality and playback, please switch to <strong style={{ color: "var(--accent)" }}>Cypher</strong> inside the server options.
                            </p>
                        </div>

                        <button 
                            onClick={() => {
                                setShowPopup(false);
                                sessionStorage.setItem("cypher-popup-dismissed", "true");
                            }}
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: "var(--accent)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "background-color 0.2s ease, transform 0.1s ease",
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--accent-dark)"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                        >
                            Got It
                        </button>
                    </div>
                    <style>{`
                        @keyframes epicFadeIn {
                            from { opacity: 0; transform: scale(0.95); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default WatchPage;
