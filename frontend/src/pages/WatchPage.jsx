import { useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { getPlayerUrl } from "../utils/tmdb";
import { updateHistoryProgress } from "../utils/history";

// ==========================================
// FUTURE ANILIST AUTO-MAPPING CONFIGURATION
// To restore the AniList mapping feature in the future, uncomment the code blocks labeled "ANILIST EXTENSION" 
// and comment out the default "getPlayerUrl" assignment.
// ==========================================

/* [ANILIST EXTENSION - UNCOMMENT TO USE]
import { tmdbFetch } from "../utils/tmdb";
import { isAnime, fetchAnilistAnimeList, findBestAnilistMatch } from "../utils/anilist";
*/

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();

    const season = searchParams.get("season") || 1;
    const episode = searchParams.get("episode") || 1;

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
                        const url = type === "movie"
                            ? `https://player.videasy.net/anime/${bestMatch.id}`
                            : `https://player.videasy.net/anime/${bestMatch.id}/${episode}`;
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
            try {
                let data = event.data;
                if (typeof data === "string") {
                    data = JSON.parse(data);
                }
                
                const playerState = data.data || data;
                
                if (playerState && (playerState.time !== undefined || playerState.currentTime !== undefined)) {
                    const time = playerState.time || playerState.currentTime || 0;
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
        <div style={{ width: "100vw", height: "100dvh", backgroundColor: "#000", overflow: "hidden" }}>
            <iframe
                src={playerUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen *; encrypted-media; picture-in-picture; allow-presentation"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                title="EpicStream Player"
            />
        </div>
    );
};

export default WatchPage;
