/* global process */

import { handleMdbListRequest } from "./mdblistProxy.js";

export default async function handler(request, response) {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    try {
        const result = await handleMdbListRequest(requestUrl, process.env.MDBLIST_API_KEY);

        response.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        return response.status(result.status).json(result.body);
    } catch (error) {
        console.error("MDBList proxy request failed:", error);
        return response.status(502).json({ response: false, error: "Unable to reach MDBList." });
    }
}
