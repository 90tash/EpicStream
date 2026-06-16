import dns from "node:dns";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
dns.setDefaultResultOrder("ipv4first");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const disallowedParams = new Set(["path", "api_key"]);

const fetchWithCurl = async (url) => {
    try {
        console.log(`Curl fallback attempting: ${url}`);
        const { stdout } = await execFileAsync("curl", [
            "-s", "-L", url,
            "-H", "Accept: application/json",
            "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]);
        return JSON.parse(stdout);
    } catch (error) {
        console.error(`Curl fallback failed: ${error.message}`);
        if (error.stdout) console.error(`Curl stdout: ${error.stdout}`);
        if (error.stderr) console.error(`Curl stderr: ${error.stderr}`);
        throw error;
    }
};

export const handleTmdbRequest = async (requestUrl, apiKey) => {
    if (!apiKey) {
        return {
            status: 500,
            body: { message: "TMDB_API_KEY is not configured." },
        };
    }

    const path = requestUrl.searchParams.get("path");

    if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
        return {
            status: 400,
            body: { message: "A valid TMDB path is required." },
        };
    }

    const url = new URL(`${TMDB_BASE_URL}${path}`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", requestUrl.searchParams.get("language") || "en-US");

    requestUrl.searchParams.forEach((value, key) => {
        if (!disallowedParams.has(key) && key !== "language") {
            url.searchParams.set(key, value);
        }
    });

    const finalUrl = url.toString();
    console.log(`Fetching from TMDB: ${finalUrl}`);

    let lastError;
    for (let i = 0; i < 3; i++) {
        try {
            const tmdbResponse = await fetch(finalUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Connection': 'close'
                }
            });

            if (!tmdbResponse.ok) {
                const errorBody = await tmdbResponse.json().catch(() => ({}));
                return {
                    status: tmdbResponse.status,
                    body: errorBody,
                };
            }

            const body = await tmdbResponse.json();
            return {
                status: tmdbResponse.status,
                body,
            };
        } catch (error) {
            lastError = error;
            console.error(`Fetch to TMDB failed (attempt ${i + 1}): ${error.message}`);
            if (i < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    console.log("Attempting fallback to curl...");
    try {
        const body = await fetchWithCurl(finalUrl);
        return {
            status: 200,
            body,
        };
    } catch (fallbackError) {
        console.error("All fetch attempts and curl fallback failed.", fallbackError);
        throw lastError;
    }
};
