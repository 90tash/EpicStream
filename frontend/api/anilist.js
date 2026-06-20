export default async function handler(request, response) {
    if (request.method !== "POST") {
        return response.status(405).json({ message: "Method Not Allowed. Use POST." });
    }

    try {
        const { query, variables } = request.body || {};

        if (!query) {
            return response.status(400).json({ message: "GraphQL query is required." });
        }

        const anilistResponse = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ query, variables }),
        });

        const result = await anilistResponse.json();

        response.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
        return response.status(anilistResponse.status).json(result);
    } catch (error) {
        console.error("AniList proxy request failed:", error);
        return response.status(502).json({ message: "Unable to reach AniList." });
    }
}
