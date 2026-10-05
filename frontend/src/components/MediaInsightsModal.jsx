import React, { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getSpecificCategoryAwards } from "../utils/awardsService";
import "./MediaInsightsModal.css";

/* Helper to format dollar amounts */
const formatCurrency = (val) => {
    if (!val || val === 0 || val === "N/A" || val === "$0") return null;
    if (typeof val === "string") {
        if (val.startsWith("$")) return val;
        const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(num) && num > 0) {
            return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
        }
        return val;
    }
    if (typeof val === "number" && val > 0) {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
    }
    return null;
};

/* Helper to parse currency into raw number */
const parseNumber = (val) => {
    if (!val || val === "N/A") return 0;
    if (typeof val === "number") return val;
    const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
};

/* --- Official Brand Logos (B/W Monochrome with Animated Color Hover) --- */
const ImdbLogo = () => (
    <svg 
        viewBox="0 0 64 32" 
        width="38" 
        height="19" 
        xmlns="http://www.w3.org/2000/svg" 
        className="provider-logo-svg imdb-svg"
        aria-label="IMDb"
    >
        <rect width="100%" height="100%" rx="4" className="imdb-badge" />
        <path className="imdb-text" d="M8 25h5V7H8zM23.673 7l-1.12 8.408-.695-4.573A126 126 0 0 0 21.278 7H15v18h4.242l.016-11.886L21.044 25h3.02l1.694-12.148L25.771 25H30V7zM32 25V7h7.805A3.185 3.185 0 0 1 43 10.177v11.646A3.185 3.185 0 0 1 39.805 25zm5.832-14.76q-.299-.161-1.13-.16v11.811c.73 0 1.178-.13 1.346-.404.168-.27.254-1 .254-2.2v-6.98q-.001-1.219-.086-1.563a.74.74 0 0 0-.384-.504M52.43 11.507h.32c1.795 0 3.25 1.406 3.25 3.138v7.217C56 23.595 54.545 25 52.75 25h-.32a3.28 3.28 0 0 1-2.658-1.332l-.288 1.1H45V7h4.784v5.78a3.39 3.39 0 0 1 2.646-1.273m-1.024 8.777V16.02q0-1.059-.14-1.38c-.094-.213-.47-.35-.734-.35s-.671.111-.75.299v7.219c.09.206.478.32.75.32.271 0 .666-.11.75-.32q.123-.315.124-1.523"/>
    </svg>
);

const RottenTomatoesLogo = ({ score = null }) => {
    let isRotten = false;
    if (score) {
        const num = parseInt(String(score).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num < 60) {
            isRotten = true;
        }
    }

    return (
        <div className="provider-lockup">
            {isRotten ? (
                <svg viewBox="0 0 80 80" width="19" height="19" xmlns="http://www.w3.org/2000/svg" className="provider-logo-svg rt-svg" aria-label="Rotten">
                    <path className="rt-splat" d="M71.46 70.23C56.35 71.02 53.26 53.72 47.33 53.84c-2.53.05-4.52 2.7-3.65 5.78.48 1.69 1.82 4.17 2.66 5.71 2.97 5.44-1.42 11.59-6.55 12.11-8.53.86-12.08-4.08-11.86-9.14.25-5.68 5.07-11.49.12-13.96-5.18-2.59-9.39 7.54-14.35 9.8-4.49 2.05-10.71.46-12.93-4.52-1.55-3.5-1.27-10.24 5.65-12.81 4.33-1.61 13.96 2.1 14.46-2.59.57-5.41-10.13-5.87-13.35-7.17-5.7-2.3-9.06-7.21-6.43-12.48 1.98-3.95 7.79-5.56 12.23-3.83 5.32 2.07 6.17 7.6 8.9 9.89 2.35 1.98 5.56 2.22 7.66.87 1.55-1 2.07-3.21 1.48-5.22-.78-2.67-2.83-4.34-4.84-5.97-3.57-2.9-8.62-5.4-5.57-13.33 2.5-6.5 9.84-6.73 9.84-6.73 2.91-.33 5.52.55 7.65 2.45 2.84 2.54 3.4 5.94 2.92 9.56-.43 3.31-1.6 6.2-2.21 9.48-.71 3.8 1.32 7.64 5.19 7.78 5.08.2 6.61-3.71 7.23-6.18.91-3.63 2.11-6.99 5.47-9.12 4.83-3.04 11.54-2.38 14.65 3.47 2.46 4.63 1.67 11-2.1 14.47-1.69 1.56-3.73 2.11-5.93 2.13-3.16.02-6.32-.06-9.25 1.42-2 1.01-2.87 2.65-2.87 4.84 0 2.14 1.11 3.54 2.92 4.45 3.4 1.71 7.16 2.06 10.83 2.71 5.33.93 10.02 2.81 13.02 7.76.03.04.06.09.08.13 3.46 5.86-.15 14.29-6.94 14.65z"/>
                </svg>
            ) : (
                <svg viewBox="0 0 80 80" width="19" height="19" xmlns="http://www.w3.org/2000/svg" className="provider-logo-svg rt-svg" aria-label="Fresh">
                    <path className="rt-body" d="M77.01 27.04C76.24 14.67 69.95 5.42 60.49.25c.05.3-.22.68-.52.54-6.19-2.7-16.69 6.06-24.03 1.47.05 1.65-.27 9.68-11.59 10.15-.27.01-.41-.26-.24-.46 1.51-1.72 3.04-6.1.84-8.43-4.7 4.22-7.44 5.8-16.46 3.71C2.71 13.27-.56 21.54.08 31.84c1.31 21.03 21 33.04 40.84 31.81 19.83-1.24 37.41-15.58 36.09-36.61z"/>
                    <path className="rt-stem" d="M40.87 11.46c4.08-.97 15.8-.1 19.55 4.89.23.3-.09.87-.45.71-6.19-2.71-16.69 6.05-24.03 1.46.05 1.65-.27 9.69-11.59 10.15-.27.01-.41-.26-.24-.45 1.51-1.73 3.04-6.1.84-8.43-5.12 4.59-7.9 6.07-19.03 3.06-.36-.1-.24-.68.15-.83 2.1-.8 6.87-4.32 11.37-5.88.86-.3 1.72-.53 2.55-.66-4.96-.44-7.2-1.13-10.36-.66-.35.05-.58-.35-.37-.63 4.25-5.48 12.09-7.13 16.92-4.22-2.98-3.69-5.31-6.64-5.31-6.64l5.53-3.14s2.28 5.1 3.95 8.82c4.11-6.08 11.77-6.64 15-2.33.19.26-.01.62-.33.62-2.63-.07-4.08 2.33-4.19 4.15l.04.04z"/>
                </svg>
            )}
        </div>
    );
};

const LetterboxdLogo = () => (
    <div className="provider-lockup">
        <svg 
            viewBox="0 0 98 36" 
            width="28" 
            height="11" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="provider-logo-svg lb-svg"
            aria-label="Letterboxd"
        >
            <ellipse className="lb-dot lb-dot-right" cx="79.21" cy="18" rx="18.03" ry="18" />
            <ellipse className="lb-dot lb-dot-center" cx="48.62" cy="18" rx="18.03" ry="18" />
            <ellipse className="lb-dot lb-dot-left" cx="18.03" cy="18" rx="18.03" ry="18" />
            <path className="lb-overlap" d="M33.32 27.53C31.59 24.77 30.59 21.5 30.59 18c0-3.5 1-6.77 2.73-9.53 1.73 2.76 2.73 6.03 2.73 9.53 0 3.5-1 6.77-2.73 9.53z" />
            <path className="lb-overlap" d="M63.91 8.47c1.73 2.76 2.73 6.03 2.73 9.53 0 3.5-1 6.77-2.73 9.53C62.18 24.77 61.18 21.5 61.18 18c0-3.5 1-6.77 2.73-9.53z" />
        </svg>
    </div>
);

const MetacriticLogo = () => (
    <div className="provider-lockup">
        <svg 
            viewBox="0 0 88 88" 
            width="19" 
            height="19" 
            xmlns="http://www.w3.org/2000/svg" 
            className="provider-logo-svg mc-svg"
            aria-label="Metacritic"
        >
            <circle className="mc-ring" cx="44" cy="44" r="41"/>
            <path 
                className="mc-m"
                transform="translate(-10 -961) matrix(1.2756629 -1.3487733 1.3685717 1.2634987 -267.04706 1066.0743)" 
                fill="#FFFFFF" 
                d="m126.73438,92.087002 5.05859,0 0,2.832031 c 1.80989-2.200501 3.96483-3.30076 6.46484-3.300781 1.32811,2.1e-5 2.48045,.273458 3.45703,.820312 .97655,.546895 1.77733,1.373717 2.40235,2.480469 .91144-1.106752 1.89451-1.933574 2.94922-2.480469 1.05466-0.546854 2.18096-0.820291 3.3789-0.820312 1.52341,2.1e-5 2.81247,.309265 3.86719,.927734 1.05466,.618509 1.84242,1.526711 2.36328,2.724609 .37757,.885434 .56637,2.317724 .56641,4.296875 l 0,13.26172-5.48828,0 0-11.85547 c-3e-5-2.057277-0.18883-3.385401-0.56641-3.984375-0.50784-0.781233-1.28909-1.171858-2.34375-1.171875-0.76825,1.7e-5-1.49091,.234392-2.16797,.703125-0.6771,.468766-1.16538,1.155614-1.46484,2.060547-0.2995,.904961-0.44924,2.333998-0.44922,4.287108 l 0,9.96094-5.48828,0 0-11.36719 c-2e-5-2.018214-0.0977-3.320296-0.29297-3.906248-0.19533-0.585922-0.49806-1.02212-0.9082-1.308594-0.41017-0.286442-0.96681-0.429671-1.66993-0.429688-0.84636,1.7e-5-1.60808,.227882-2.28515,.683594-0.6771,.455745-1.16212,1.113297-1.45508,1.972656-0.29298,.859389-0.43946,2.28517-0.43945,4.27734 l 0,10.07813-5.48828,0z"
            />
        </svg>
    </div>
);

/* --- Typographic Recognition Badge (No Leaves, Normal Typographic Styling) --- */
const AwardBadge = ({ status, award, category, year }) => (
    <div className="award-badge-container">
        <div className="award-badge-inner">
            <span className="award-status">{status}</span>
            <span className="award-title">{award}</span>
            {category && <span className="award-subtitle">{category}</span>}
        </div>
        {year && <span className="award-year">{year}</span>}
    </div>
);

/* Helper to parse awards into count and all recognition items in priority order */
const parseAwardsData = (awardsStr, releaseYear) => {
    if (!awardsStr || awardsStr === "N/A") {
        return {
            count: 0,
            hasAwards: false,
            medallions: []
        };
    }

    const winMatch = awardsStr.match(/(\d+)\s+win/i);
    const nomMatch = awardsStr.match(/(\d+)\s+nomination/i);
    
    let count = 0;
    if (winMatch) count += parseInt(winMatch[1], 10);
    if (nomMatch) count += parseInt(nomMatch[1], 10);
    if (count === 0) {
        const allNums = awardsStr.match(/\d+/g);
        if (allNums) count = allNums.reduce((acc, n) => acc + parseInt(n, 10), 0);
    }

    const medallions = [];
    const addAward = (awardObj) => {
        if (!medallions.some(m => m.title === awardObj.title)) {
            medallions.push(awardObj);
        }
    };

    // 1. Academy Awards / Oscars
    if (/oscar/i.test(awardsStr)) {
        const wonMatch = awardsStr.match(/won\s+(\d+)\s+oscar/i);
        const nomOscarMatch = awardsStr.match(/nominated\s+for\s+(\d+)\s+oscar/i);
        const isWon = /won\s+\d*\s*oscar/i.test(awardsStr);

        let subtitle = "ACADEMY AWARDS";
        if (wonMatch) {
            const num = parseInt(wonMatch[1], 10);
            subtitle = num > 1 ? `${num} OSCARS WON` : "1 OSCAR WON";
        } else if (nomOscarMatch) {
            const num = parseInt(nomOscarMatch[1], 10);
            subtitle = num > 1 ? `${num} OSCAR NOMINATIONS` : "1 OSCAR NOMINEE";
        } else if (isWon) {
            subtitle = "OSCAR WINNER";
        } else {
            subtitle = "OSCAR NOMINEE";
        }

        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "ACADEMY AWARDS",
            subtitle,
            year: releaseYear
        });
    }

    // 2. Primetime Emmy Awards
    if (/emmy/i.test(awardsStr)) {
        const wonMatch = awardsStr.match(/won\s+(\d+)\s+(?:primetime\s+)?emmy/i);
        const nomEmmyMatch = awardsStr.match(/nominated\s+for\s+(\d+)\s+(?:primetime\s+)?emmy/i);
        const isWon = /won\s+\d*\s*(?:primetime\s+)?emmy/i.test(awardsStr);

        let subtitle = "TELEVISION ACADEMY";
        if (wonMatch) {
            const num = parseInt(wonMatch[1], 10);
            subtitle = num > 1 ? `${num} EMMYS WON` : "1 EMMY WON";
        } else if (nomEmmyMatch) {
            const num = parseInt(nomEmmyMatch[1], 10);
            subtitle = num > 1 ? `${num} EMMY NOMINATIONS` : "1 EMMY NOMINEE";
        } else if (isWon) {
            subtitle = "EMMY WINNER";
        } else {
            subtitle = "EMMY NOMINEE";
        }

        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "EMMY AWARDS",
            subtitle,
            year: releaseYear
        });
    }

    // 3. Golden Globe Awards
    if (/golden\s+globe/i.test(awardsStr)) {
        const wonMatch = awardsStr.match(/won\s+(\d+)\s+golden\s+globe/i);
        const nomGgMatch = awardsStr.match(/nominated\s+for\s+(\d+)\s+golden\s+globe/i);
        const isWon = /won\s+\d*\s*golden\s+globe/i.test(awardsStr);

        let subtitle = "HOLLYWOOD FOREIGN PRESS";
        if (wonMatch) {
            const num = parseInt(wonMatch[1], 10);
            subtitle = num > 1 ? `${num} GLOBES WON` : "1 GLOBE WON";
        } else if (nomGgMatch) {
            const num = parseInt(nomGgMatch[1], 10);
            subtitle = num > 1 ? `${num} GLOBE NOMINATIONS` : "1 GLOBE NOMINEE";
        } else if (isWon) {
            subtitle = "GOLDEN GLOBE WINNER";
        } else {
            subtitle = "GOLDEN GLOBE NOMINEE";
        }

        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "GOLDEN GLOBES",
            subtitle,
            year: releaseYear
        });
    }

    // 4. BAFTA Awards
    if (/bafta/i.test(awardsStr)) {
        const wonMatch = awardsStr.match(/won\s+(\d+)\s+bafta/i);
        const nomBaftaMatch = awardsStr.match(/nominated\s+for\s+(\d+)\s+bafta/i);
        const isWon = /won\s+\d*\s*bafta/i.test(awardsStr);

        let subtitle = "BRITISH ACADEMY";
        if (wonMatch) {
            const num = parseInt(wonMatch[1], 10);
            subtitle = num > 1 ? `${num} BAFTAS WON` : "1 BAFTA WON";
        } else if (nomBaftaMatch) {
            const num = parseInt(nomBaftaMatch[1], 10);
            subtitle = num > 1 ? `${num} BAFTA NOMINATIONS` : "1 BAFTA NOMINEE";
        } else if (isWon) {
            subtitle = "BAFTA WINNER";
        } else {
            subtitle = "BAFTA NOMINEE";
        }

        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "BAFTA AWARDS",
            subtitle,
            year: releaseYear
        });
    }

    // 5. Screen Actors Guild (SAG)
    if (/(?:screen\s+actors\s+guild|sag\s+award)/i.test(awardsStr)) {
        const isWon = /won\s+\d*\s*(?:screen\s+actors|sag)/i.test(awardsStr);
        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "SAG AWARDS",
            subtitle: "ACTORS GUILD",
            year: releaseYear
        });
    }

    // 6. Critics Choice Awards
    if (/critics['’]?\s*choice/i.test(awardsStr)) {
        const isWon = /won\s+\d*\s*critics['’]?\s*choice/i.test(awardsStr);
        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "CRITICS CHOICE",
            subtitle: "BROADCAST CRITICS",
            year: releaseYear
        });
    }

    // 7. Major Film Festivals
    if (/cannes|palme\s+d['’]or/i.test(awardsStr)) {
        addAward({
            status: /palme|won/i.test(awardsStr) ? "WINNER" : "SELECTION",
            title: "CANNES FESTIVAL",
            subtitle: /palme/i.test(awardsStr) ? "PALME D'OR" : "OFFICIAL SELECTION",
            year: releaseYear
        });
    }
    if (/venice/i.test(awardsStr)) {
        addAward({
            status: /won/i.test(awardsStr) ? "WINNER" : "SELECTION",
            title: "VENICE FESTIVAL",
            subtitle: "BIENNALE CINEMA",
            year: releaseYear
        });
    }
    if (/sundance/i.test(awardsStr)) {
        addAward({
            status: /won/i.test(awardsStr) ? "WINNER" : "SELECTION",
            title: "SUNDANCE",
            subtitle: "FESTIVAL SELECTION",
            year: releaseYear
        });
    }

    // 8. Grammy Awards
    if (/grammy/i.test(awardsStr)) {
        const isWon = /won\s+\d*\s*grammy/i.test(awardsStr);
        addAward({
            status: isWon ? "WINNER" : "NOMINEE",
            title: "GRAMMY AWARDS",
            subtitle: "RECORDING ACADEMY",
            year: releaseYear
        });
    }

    // 9. Total Wins (e.g. "5 wins")
    if (winMatch) {
        const winsCount = parseInt(winMatch[1], 10);
        if (winsCount > 0) {
            addAward({
                status: "HONORS",
                title: `${winsCount} ${winsCount === 1 ? "WIN" : "WINS"}`,
                subtitle: "CRITIC & GUILD HONORS",
                year: releaseYear
            });
        }
    }

    // 10. Total Nominations (e.g. "32 nominations")
    if (nomMatch) {
        const nomCount = parseInt(nomMatch[1], 10);
        if (nomCount > 0) {
            addAward({
                status: "RECOGNITION",
                title: `${nomCount} ${nomCount === 1 ? "NOMINATION" : "NOMINATIONS"}`,
                subtitle: "INDUSTRY RECOGNITION",
                year: releaseYear
            });
        }
    }

    // Fallback if no specific categories matched
    if (medallions.length === 0) {
        if (count > 0) {
            medallions.push({
                status: "HONORS",
                title: `${count} RECOGNITIONS`,
                subtitle: "INDUSTRY HONORS",
                year: releaseYear
            });
        } else {
            medallions.push(
                { status: "HONORABLE MENTION", title: "OFFICIAL SELECTION", subtitle: "FEATURE PRESENTATION", year: releaseYear },
                { status: "RECOGNITION", title: "CRITIC REVIEWS", subtitle: "AUDIENCE ACCLAIM", year: releaseYear }
            );
        }
    }

    return {
        count: count || medallions.length,
        hasAwards: true,
        medallions
    };
};

/* Helper to score awards by priority: ALL WINS FIRST, THEN NOMINATIONS */
const getAwardPrestige = (item) => {
    const status = String(item.status || "").toUpperCase();
    const title = String(item.title || item.award || "").toLowerCase();
    const subtitle = String(item.subtitle || item.category || "").toLowerCase();
    const text = `${title} ${subtitle}`;

    // WINS must be strictly at first then nominations come
    const isWin = status === "WINNER" || status === "HONORS" || /\bwon\b|\bwins?\b/i.test(title);
    const winBonus = isWin ? 1000 : 0;

    let rank = 30;

    // 1. Academy Awards / Oscars
    if (text.includes("academy") || text.includes("oscar")) {
        if (text.includes("best picture") || text.includes("best film")) rank = 100;
        else if (text.includes("best director")) rank = 99;
        else if (text.includes("best actor") || text.includes("best actress")) rank = 98;
        else if (text.includes("supporting actor") || text.includes("supporting actress")) rank = 97;
        else if (text.includes("screenplay") || text.includes("writing")) rank = 96;
        else if (text.includes("cinematography")) rank = 95;
        else if (text.includes("editing")) rank = 94;
        else if (text.includes("visual effects")) rank = 93;
        else if (text.includes("sound") || text.includes("score") || text.includes("music")) rank = 92;
        else rank = 90;
    }
    // 2. Emmys
    else if (text.includes("emmy")) {
        if (text.includes("drama series") || text.includes("comedy series")) rank = 89;
        else if (text.includes("lead actor") || text.includes("lead actress") || text.includes("best actor") || text.includes("best actress")) rank = 88;
        else if (text.includes("directing") || text.includes("director")) rank = 87;
        else if (text.includes("writing")) rank = 86;
        else rank = 80;
    }
    // 3. Golden Globes
    else if (text.includes("golden globe") || text.includes("globe")) {
        if (text.includes("best picture") || text.includes("best motion picture")) rank = 79;
        else if (text.includes("best actor") || text.includes("best actress")) rank = 78;
        else if (text.includes("director")) rank = 77;
        else if (text.includes("screenplay")) rank = 76;
        else rank = 70;
    }
    // 4. BAFTA
    else if (text.includes("bafta")) {
        rank = 65;
    }
    // 5. SAG Awards
    else if (text.includes("sag") || text.includes("actor award") || text.includes("screen actors")) {
        rank = 60;
    }
    // 6. Critics Choice
    else if (text.includes("critics choice") || text.includes("critics' choice")) {
        rank = 55;
    }
    // 7. Prestigious Festivals (Cannes, Venice, Sundance)
    else if (text.includes("cannes") || text.includes("palme") || text.includes("venice") || text.includes("sundance")) {
        rank = 50;
    }
    // 8. Guild Awards (Saturn, DGA, WGA, PGA)
    else if (text.includes("saturn") || text.includes("dga") || text.includes("wga") || text.includes("pga")) {
        rank = 45;
    }
    // 9. Total Wins (e.g. 5 WINS)
    else if (title.includes("win")) {
        rank = 20;
    }
    // 10. Total Nominations (e.g. 32 NOMINATIONS)
    else if (title.includes("nomination")) {
        rank = 10;
    }

    return winBonus + rank;
};

const MediaInsightsModal = ({ isOpen, onClose, type = "movie", media = {}, omdbData = null, mdbListData = null }) => {
    const awardsScrollRef = useRef(null);
    const [canScrollAwardsLeft, setCanScrollAwardsLeft] = useState(false);
    const [canScrollAwardsRight, setCanScrollAwardsRight] = useState(false);
    const [isAwardsScrollable, setIsAwardsScrollable] = useState(false);
    const [specificAwards, setSpecificAwards] = useState([]);

    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    const isMovie = type === "movie";

    // --- Year ---
    const releaseDate = media?.release_date || media?.first_air_date || omdbData?.Year;
    let releaseYear = null;
    if (releaseDate) {
        try {
            releaseYear = new Date(releaseDate).getFullYear();
            if (isNaN(releaseYear)) releaseYear = String(releaseDate).slice(0, 4);
        } catch {
            releaseYear = String(releaseDate).slice(0, 4);
        }
    }

    // --- Ratings ---
    const imdbScore = omdbData?.imdbRating || mdbListData?.imdb || null;

    // Normalize Rotten Tomatoes to always have exactly one "%"
    const rawRt = omdbData?.rottenTomatoes || mdbListData?.tomatoes || null;
    let rtCritic = null;
    let isRotten = false;
    if (rawRt) {
        const rtNum = parseInt(String(rawRt).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(rtNum) && rtNum > 0) {
            rtCritic = `${rtNum}%`;
            isRotten = rtNum < 60;
        }
    }

    const rawLb = mdbListData?.letterboxd;
    const lbScore = rawLb ? (typeof rawLb === "number" ? rawLb.toFixed(1) : rawLb) : null;

    const metascore = omdbData?.metacritic || mdbListData?.metacritic || null;
    const hasAnyRating = Boolean(imdbScore || rtCritic || (isMovie && lbScore) || metascore);

    // --- Financials (Movies) ---
    const budgetRaw = parseNumber(media?.budget || mdbListData?.budget);
    const revenueRaw = parseNumber(media?.revenue || mdbListData?.revenue);
    const domesticRaw = parseNumber(omdbData?.boxOffice || omdbData?.BoxOffice);

    const budgetFormatted = formatCurrency(budgetRaw);
    const revenueFormatted = formatCurrency(revenueRaw);
    const domesticFormatted = formatCurrency(domesticRaw);

    let internationalFormatted = null;
    if (revenueRaw > 0 && domesticRaw > 0 && revenueRaw >= domesticRaw) {
        internationalFormatted = formatCurrency(revenueRaw - domesticRaw);
    }

    const hasFinancialData = budgetRaw > 0 || revenueRaw > 0 || domesticRaw > 0;

    // --- Awards / Nominations ---
    const awardsText = (omdbData?.awards || omdbData?.Awards) && (omdbData?.awards !== "N/A" && omdbData?.Awards !== "N/A") 
        ? (omdbData.awards || omdbData.Awards) 
        : null;

    const awardsParsed = parseAwardsData(awardsText, releaseYear);

    const imdbId = omdbData?.imdbID || media?.imdb_id || mdbListData?.imdb_id || null;
    const mediaTitle = media?.title || media?.name || omdbData?.Title || null;

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        getSpecificCategoryAwards({ imdbId, title: mediaTitle, year: releaseYear }).then(results => {
            if (isMounted && Array.isArray(results) && results.length > 0) {
                setSpecificAwards(results);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [isOpen, imdbId, mediaTitle, releaseYear]);

    // Combine specific category awards with OMDb summary awards
    const allMedallions = [];

    // 1. Specific category awards (e.g. Best Picture, Best Actor, Best Director)
    specificAwards.forEach(s => {
        allMedallions.push({
            status: s.status || "WINNER",
            title: s.award || "HONORS",
            subtitle: s.category,
            year: s.year || releaseYear
        });
    });

    // 2. Summary medallions from OMDb (e.g. total Oscars, Golden Globes, total wins, total nominations)
    awardsParsed.medallions.forEach(omdbItem => {
        const isDuplicate = allMedallions.some(m => 
            m.title === omdbItem.title && (m.subtitle === omdbItem.subtitle || omdbItem.subtitle.includes(m.subtitle))
        );
        if (!isDuplicate) {
            allMedallions.push(omdbItem);
        }
    });

    // Sort by prestige priority descending
    allMedallions.sort((a, b) => getAwardPrestige(b) - getAwardPrestige(a));

    const hasAwardsShowcase = awardsParsed.hasAwards || allMedallions.length > 0;

    const checkAwardsScroll = () => {
        const el = awardsScrollRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const scrollable = scrollWidth > clientWidth + 2;
        setIsAwardsScrollable(scrollable);
        setCanScrollAwardsLeft(scrollLeft > 4);
        setCanScrollAwardsRight(scrollLeft + clientWidth < scrollWidth - 4);
    };

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(checkAwardsScroll, 50);
        window.addEventListener("resize", checkAwardsScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", checkAwardsScroll);
        };
    }, [isOpen, awardsText, allMedallions.length]);

    const handleAwardsScroll = (direction) => {
        const el = awardsScrollRef.current;
        if (!el) return;
        
        // Dynamically compute card stride (card width + gap) for exact sliding alignment
        const firstCard = el.querySelector(".award-badge-container");
        const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : (el.clientWidth - 24) / 2;
        const stride = Math.round(cardWidth + 24);

        el.scrollBy({
            left: direction === "left" ? -stride : stride,
            behavior: "smooth"
        });
    };

    const showAwardsArrows = allMedallions.length >= 2;

    if (!isOpen) return null;

    return (
        <div className="insights-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Insights Modal">
            <div className="insights-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="insights-modal-header">
                    <div className="insights-header-titles">
                        <h2 className="insights-modal-title">
                            {media?.title || media?.name || (isMovie ? "Movie Insights" : "Show Insights")}
                        </h2>
                        <span className="insights-count-badge">
                            {releaseYear || (isMovie ? "CRITIC & BOX OFFICE DATA" : "SERIES METRICS")}
                        </span>
                    </div>
                    <button 
                        type="button" 
                        className="insights-close-btn" 
                        onClick={onClose} 
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="insights-modal-content">
                    {/* SECTION 1: RATINGS SITES */}
                    {hasAnyRating ? (
                        <div className="insights-section">
                            <div className="insights-metrics-row ratings-metrics-row">
                                {/* 1. IMDb */}
                                {imdbScore && (
                                    <div className="metric-column imdb-col">
                                        <div className="metric-header">
                                            <ImdbLogo />
                                            <span className="metric-label">IMDb</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score">{imdbScore}</span>
                                            <span className="metric-subscore">/10</span>
                                        </div>
                                    </div>
                                )}

                                {/* 2. Rotten Tomatoes */}
                                {rtCritic && (
                                    <div className={`metric-column rt-col ${isRotten ? "is-rotten" : ""}`}>
                                        <div className="metric-header">
                                            <RottenTomatoesLogo score={rtCritic} />
                                            <span className="metric-label">Rotten Tomatoes</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score">{rtCritic}</span>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Letterboxd (Movies only) */}
                                {isMovie && lbScore && (
                                    <div className="metric-column lb-col">
                                        <div className="metric-header">
                                            <LetterboxdLogo />
                                            <span className="metric-label">Letterboxd</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score">{lbScore}</span>
                                            <span className="metric-subscore">/5</span>
                                        </div>
                                    </div>
                                )}

                                {/* 4. Metacritic */}
                                {metascore && (
                                    <div className="metric-column mc-col">
                                        <div className="metric-header">
                                            <MetacriticLogo />
                                            <span className="metric-label">Metacritic</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score">{metascore}</span>
                                            <span className="metric-subscore">/100</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="insights-section">
                            <div className="no-ratings-placeholder">
                                <span>Ratings not yet available</span>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: BOX OFFICE (Movies) OR SERIES METRICS (TV) */}
                    {isMovie && hasFinancialData && (
                        <div className="insights-section">
                            <div className="insights-metrics-row finance-metrics-row">
                                <div className="metric-column">
                                    <div className="metric-header">
                                        <span className="metric-label">BUDGET</span>
                                    </div>
                                    <div className="metric-value">
                                        <span className="metric-score finance-score">{budgetFormatted || "Undisclosed"}</span>
                                    </div>
                                </div>

                                <div className="metric-column">
                                    <div className="metric-header">
                                        <span className="metric-label">WORLDWIDE GROSS</span>
                                    </div>
                                    <div className="metric-value">
                                        <span className="metric-score finance-score">{revenueFormatted || (domesticFormatted ? `${domesticFormatted} (Dom)` : "Undisclosed")}</span>
                                    </div>
                                </div>

                                {domesticFormatted && (
                                    <div className="metric-column">
                                        <div className="metric-header">
                                            <span className="metric-label">DOMESTIC</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score finance-score">{domesticFormatted}</span>
                                        </div>
                                    </div>
                                )}

                                {internationalFormatted && (
                                    <div className="metric-column">
                                        <div className="metric-header">
                                            <span className="metric-label">INTERNATIONAL</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score finance-score">{internationalFormatted}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TV Show Series Stats */}
                    {!isMovie && (media?.number_of_seasons || media?.networks?.length > 0) && (
                        <div className="insights-section">
                            <div className="insights-metrics-row finance-metrics-row">
                                {media?.number_of_seasons && (
                                    <div className="metric-column">
                                        <div className="metric-header">
                                            <span className="metric-label">SEASONS</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score finance-score">{media.number_of_seasons}</span>
                                        </div>
                                    </div>
                                )}

                                {media?.number_of_episodes && (
                                    <div className="metric-column">
                                        <div className="metric-header">
                                            <span className="metric-label">EPISODES</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score finance-score">{media.number_of_episodes}</span>
                                        </div>
                                    </div>
                                )}

                                {media?.networks?.length > 0 && (
                                    <div className="metric-column">
                                        <div className="metric-header">
                                            <span className="metric-label">NETWORK</span>
                                        </div>
                                        <div className="metric-value">
                                            <span className="metric-score finance-score text-network">
                                                {media.networks.map(n => n.name).join(", ")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: AWARDS & NOMINATIONS */}
                    {hasAwardsShowcase && (
                        <div className="insights-section awards-section-wrapper">
                            <div className="awards-header">
                                <span className="awards-heading-title">Awards & Nominations</span>
                            </div>
                            <div className="awards-carousel-wrapper">
                                {showAwardsArrows && (
                                    <button 
                                        type="button"
                                        className="awards-arrow-btn awards-arrow-left"
                                        onClick={() => handleAwardsScroll("left")}
                                        disabled={!canScrollAwardsLeft}
                                        aria-label="Scroll left"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                )}

                                <div 
                                    className={`awards-showcase-container ${showAwardsArrows ? "has-scroll" : ""}`}
                                    ref={awardsScrollRef}
                                    onScroll={checkAwardsScroll}
                                >
                                    {allMedallions.map((item, idx) => (
                                        <AwardBadge 
                                            key={`${item.title}-${item.subtitle}-${idx}`}
                                            status={item.status}
                                            award={item.title}
                                            category={item.subtitle}
                                            year={item.year}
                                        />
                                    ))}
                                </div>

                                {showAwardsArrows && (
                                    <button 
                                        type="button"
                                        className="awards-arrow-btn awards-arrow-right"
                                        onClick={() => handleAwardsScroll("right")}
                                        disabled={!canScrollAwardsRight}
                                        aria-label="Scroll right"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Full awards textual note */}
                            {awardsText && (
                                <div className="awards-text-summary">
                                    <span>{awardsText}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaInsightsModal;
