const OMDB_BASE_URL = "https://www.omdbapi.com";

export const handleOmdbRequest = async (requestUrl, apiKey) => {
    if (!apiKey) {
        return {
            status: 500,
            body: { Response: "False", Error: "OMDB_API_KEY is not configured." }
        };
    }

    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set("apikey", apiKey);

    // Forward allowed query parameters
    const forwardParams = ["i", "t", "y", "type", "plot"];
    forwardParams.forEach(param => {
        const val = requestUrl.searchParams.get(param);
        if (val) {
            url.searchParams.set(param, val);
        }
    });

    const response = await fetch(url.toString(), {
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
        return {
            status: response.status,
            body: { Response: "False", Error: `OMDb returned HTTP ${response.status}` }
        };
    }

    const data = await response.json();
    return {
        status: 200,
        body: data
    };
};
