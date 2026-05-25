/* global process */

import { handleTmdbRequest } from "./tmdbProxy.js";

export default async function handler(request, response) {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    try {
        const result = await handleTmdbRequest(requestUrl, process.env.TMDB_API_KEY);

        response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
        return response.status(result.status).json(result.body);
    } catch (error) {
        console.error("TMDB proxy request failed:", error);
        return response.status(502).json({ message: "Unable to reach TMDB." });
    }
}
