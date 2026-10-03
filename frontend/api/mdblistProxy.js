const MDBLIST_BASE_URL = "https://mdblist.com/api";

export const handleMdbListRequest = async (requestUrl, apiKey) => {
    if (!apiKey) {
        return {
            status: 500,
            body: { response: false, error: "MDBLIST_API_KEY is not configured." }
        };
    }

    const url = new URL(MDBLIST_BASE_URL);
    url.searchParams.set("apikey", apiKey);

    // Forward allowed query parameters
    const forwardParams = ["i", "s", "y", "tmdb", "m"];
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
            body: { response: false, error: `MDBList returned HTTP ${response.status}` }
        };
    }

    const data = await response.json();
    return {
        status: 200,
        body: data
    };
};
