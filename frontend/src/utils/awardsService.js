/**
 * Awards Service - Fetches specific category awards (e.g., Best Picture, Best Actor, Best Director)
 * from Wikidata SPARQL and Wikipedia Accolades, with client-side caching.
 */

const awardsCache = new Map();

/**
 * Normalizes and formats an award title and category
 */
const formatAward = (label, status = "WINNER", year = null) => {
    if (!label || typeof label !== "string") return null;

    let award = "HONORS";
    let category = label;

    if (/academy award/i.test(label)) {
        award = "ACADEMY AWARDS";
        category = label.replace(/academy award for\s*/i, "").trim();
    } else if (/golden globe/i.test(label)) {
        award = "GOLDEN GLOBES";
        category = label.replace(/golden globe award for\s*/i, "").replace(/[–—]\s*/, "- ").trim();
    } else if (/bafta/i.test(label)) {
        award = "BAFTA AWARDS";
        category = label.replace(/bafta award for\s*/i, "").trim();
    } else if (/emmy/i.test(label)) {
        award = "EMMY AWARDS";
        category = label.replace(/primetime emmy award for\s*/i, "").replace(/emmy award for\s*/i, "").trim();
    } else if (/screen actors guild|actor award/i.test(label)) {
        award = "SAG AWARDS";
        category = label.replace(/(?:screen actors guild award for|actor award for)\s*/i, "").trim();
    } else if (/critics['’]? choice/i.test(label)) {
        award = "CRITICS CHOICE";
        category = label.replace(/critics['’]?\s*choice\s*(?:movie|television)?\s*award for\s*/i, "").trim();
    } else if (/saturn/i.test(label)) {
        award = "SATURN AWARDS";
        category = label.replace(/saturn award for\s*/i, "").trim();
    } else if (/cannes|palme d'or/i.test(label)) {
        award = "CANNES FESTIVAL";
        category = /palme/i.test(label) ? "PALME D'OR" : label;
    } else if (/venice/i.test(label)) {
        award = "VENICE FESTIVAL";
        category = "BIENNALE CINEMA";
    } else if (/sundance/i.test(label)) {
        award = "SUNDANCE";
        category = "FESTIVAL SELECTION";
    }

    // Clean up category string
    category = category.toUpperCase()
        .replace(/^OUTSTANDING PERFORMANCE BY (?:AN? )?/, "BEST ")
        .replace(/^OUTSTANDING LEAD ACTOR IN A DRAMA SERIES/, "BEST ACTOR - DRAMA")
        .replace(/^OUTSTANDING LEAD ACTRESS IN A DRAMA SERIES/, "BEST ACTRESS - DRAMA")
        .replace(/^OUTSTANDING DRAMA SERIES/, "BEST DRAMA SERIES")
        .replace(/^OUTSTANDING COMEDY SERIES/, "BEST COMEDY SERIES")
        .replace(/^BEST MOTION PICTURE - DRAMA/, "BEST PICTURE - DRAMA")
        .replace(/^BEST MOTION PICTURE - MUSICAL OR COMEDY/, "BEST PICTURE - COMEDY")
        .replace(/^BEST ACTION\/ADVENTURE\/THRILLER FILM/, "BEST ACTION FILM")
        .replace(/\s+/g, " ")
        .trim();

    if (!category || category.length < 2) return null;

    return {
        status,
        award,
        category,
        year
    };
};

/**
 * Fetches specific awards from Wikidata by IMDb ID
 */
const fetchWikidataAwards = async (imdbId, year) => {
    if (!imdbId) return [];

    try {
        const query = `
        SELECT ?awardLabel WHERE {
          ?item wdt:P345 "${imdbId}" .
          ?item p:P166 ?statement .
          ?statement ps:P166 ?award .
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        } LIMIT 25
        `;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`, {
            headers: { "Accept": "application/json" },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return [];

        const data = await res.json();
        const bindings = data.results?.bindings || [];
        const results = [];

        for (const b of bindings) {
            const label = b.awardLabel?.value;
            if (!label) continue;
            const parsed = formatAward(label, "WINNER", year);
            if (parsed && !results.some(r => r.award === parsed.award && r.category === parsed.category)) {
                results.push(parsed);
            }
        }

        return results;
    } catch {
        return [];
    }
};

/**
 * Fetches specific accolades from Wikipedia by Title
 */
const fetchWikipediaAccolades = async (title, year) => {
    if (!title) return [];

    try {
        const cleanTitle = title.replace(/[:\-–].*$/, "").trim();
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent('List of accolades received by ' + title)}&format=json&origin=*`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const sRes = await fetch(searchUrl, { signal: controller.signal });
        const sData = await sRes.json();
        let pageTitle = sData.query?.search?.[0]?.title;

        if (!pageTitle || !pageTitle.toLowerCase().includes("accolades")) {
            const mainSearch = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title + " film")}&format=json&origin=*`;
            const mRes = await fetch(mainSearch, { signal: controller.signal });
            const mData = await mRes.json();
            pageTitle = mData.query?.search?.[0]?.title || title;
        }

        const secRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&origin=*`, { signal: controller.signal });
        const secData = await secRes.json();
        const accoladesSec = secData.parse?.sections?.find(s => /accolades|awards/i.test(s.line));

        let wikitext = "";
        if (accoladesSec) {
            const textRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&section=${accoladesSec.index}&format=json&origin=*`, { signal: controller.signal });
            const textData = await textRes.json();
            wikitext = textData.parse?.wikitext?.["*"] || "";
        } else if (pageTitle.toLowerCase().includes("accolades")) {
            const textRes = await fetch(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json&origin=*`, { signal: controller.signal });
            const textData = await textRes.json();
            wikitext = textData.parse?.wikitext?.["*"] || "";
        }
        clearTimeout(timeoutId);

        const rows = wikitext.split("|-");
        const results = [];
        let currentAwardOrg = "";

        for (const row of rows) {
            const isWon = /\{\{won\}\}/i.test(row);
            const isNom = /\{\{nom\}\}/i.test(row);
            if (!isWon && !isNom) continue;

            const orgMatch = row.match(/!\s*(?:scope="[^"]*"\s*(?:rowspan="\d+")?\s*\|\s*)?\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
            if (orgMatch) {
                currentAwardOrg = orgMatch[1].replace(/\s*(Awards?|Film Festival)$/i, "").trim();
            }

            const catMatch = row.match(/\|\s*(?:\[\[(?:[^\]|]+Award for\s+)?([^\]|]+)(?:\|[^\]]+)?\]\]|([A-Z][a-zA-Z\s,–-]+))/);
            let cat = catMatch ? (catMatch[1] || catMatch[2]).trim() : "";
            if (!cat || cat.startsWith("{{") || /^\d+/.test(cat)) continue;

            let orgName = currentAwardOrg || "AWARD";
            const parsed = formatAward(`${orgName} Award for ${cat}`, isWon ? "WINNER" : "NOMINEE", year);
            if (parsed && !results.some(r => r.award === parsed.award && r.category === parsed.category)) {
                results.push(parsed);
            }
            if (results.length >= 8) break;
        }

        return results;
    } catch {
        return [];
    }
};

/**
 * Fetches specific category awards combining Wikidata and Wikipedia with caching
 */
export const getSpecificCategoryAwards = async ({ imdbId, title, year }) => {
    const cacheKey = `awards_${imdbId || ""}_${title || ""}_${year || ""}`;

    if (awardsCache.has(cacheKey)) {
        return awardsCache.get(cacheKey);
    }

    try {
        const stored = sessionStorage.getItem(cacheKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            awardsCache.set(cacheKey, parsed);
            return parsed;
        }
    } catch {
        // Ignore sessionStorage access errors
    }

    let results = [];

    // 1. Try Wikidata
    if (imdbId) {
        results = await fetchWikidataAwards(imdbId, year);
    }

    // 2. If Wikidata had fewer than 2 specific category awards, try Wikipedia
    if (results.length < 2 && title) {
        const wikiResults = await fetchWikipediaAccolades(title, year);
        for (const w of wikiResults) {
            if (!results.some(r => r.award === w.award && r.category === w.category)) {
                results.push(w);
            }
        }
    }

    awardsCache.set(cacheKey, results);
    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(results));
    } catch {
        // Ignore sessionStorage quota error
    }

    return results;
};
