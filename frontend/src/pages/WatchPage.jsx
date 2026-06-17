import { useParams, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { getPlayerUrl } from "../utils/tmdb";
import { updateHistoryProgress } from "../utils/history";

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();

    const season = searchParams.get("season") || 1;
    const episode = searchParams.get("episode") || 1;

    const playerUrl = getPlayerUrl(type, id, season, episode);

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
                
                // Typical player message structure: { event: 'timeupdate', data: { time: 123, duration: 456 } }
                // or just { time: 123, duration: 456 }
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
            } catch (e) {
                // Ignore parsing errors
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [id]);

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
