import { useParams, useSearchParams } from "react-router-dom";
import { getPlayerUrl } from "../utils/tmdb";

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();

    const season = searchParams.get("season") || 1;
    const episode = searchParams.get("episode") || 1;

    const playerUrl = getPlayerUrl(type, id, season, episode);

    return (
        <div style={{ width: "100vw", height: "100dvh", backgroundColor: "#000", overflow: "hidden" }}>
            <iframe
                src={playerUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
                title="EpicStream Player"
            />
        </div>
    );
};

export default WatchPage;
