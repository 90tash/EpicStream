/* global process */

import { handleOmdbRequest } from "./omdbProxy.js";

export default async function handler(request, response) {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    try {
        const result = await handleOmdbRequest(requestUrl, process.env.OMDB_API_KEY);

        response.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        return response.status(result.status).json(result.body);
    } catch (error) {
        console.error("OMDb proxy request failed:", error);
        return response.status(502).json({ Response: "False", Error: "Unable to reach OMDb." });
    }
}
