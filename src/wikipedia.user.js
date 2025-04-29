// ==UserScript==
// @name         Wikipedia to Wikiwand Redirector
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Redirects Wikipedia pages to Wikiwand for a better reading experience with redirect loop prevention
// @author       You
// @match        *://*.wikipedia.org/wiki/*
// @match        *://*.wikipedia.org/zh/*
// @match        *://*.wikiquote.org/wiki/*
// @match        *://*.wiktionary.org/wiki/*
// @match        *://*.wikiwand.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const REDIRECT_TIMEOUT = 2000; // 2 seconds
    const REDIRECT_HISTORY_LIMIT = 5; // Store up to 5 recent redirects
    const REDIRECT_TIME_WINDOW = 30000; // 30 seconds window to detect loops

    // First check if we're on Wikiwand and clean up any lingering redirect records
    if (window.location.hostname.includes('wikiwand.com')) {
        cleanupRedirectHistory();
        return; // Nothing more to do on Wikiwand pages
    }

    // Don't redirect if URL contains oldformat parameter
    const url = new URL(window.location.href);
    if (url.searchParams.get("oldformat")) return;

    const hostParts = url.hostname.split(".");

    // Mapping wikimedia projects to Wikiwand sections
    const bucketMap = {
        "wikipedia": "articles",
        "wikiquote": "quotes",
        "wiktionary": "dictionary",
    };

    const bucket = hostParts?.length && bucketMap[hostParts[1]];

    // Only proceed if we have a valid bucket and the hostname has 3 parts (e.g., en.wikipedia.org)
    if (!bucket || hostParts?.length !== 3) return;

    // Get the language code
    const lang = url.pathname.startsWith('/zh') ? url.pathname.split('/')[1] : hostParts[0]?.replace("www", "") || "en";

    // Get the page title
    const pathParts = url.pathname.split('/').filter(Boolean);
    const title = (pathParts.length >= 2) ? pathParts.slice(1).join('/') : "";

    // Don't redirect special pages (those with colons in the title)
    if (title.includes(":")) return;

    // Don't redirect Main_Page/main page as the original extension didn't
    if (!title || title === "Main_Page" || title.toLowerCase() === "main_page") return;

    // Generate target URL for Wikiwand
    const targetUrl = `https://www.wikiwand.com/${lang}/${bucket}/${title}`;

    // Check if we should redirect or if this might be part of a loop
    if (shouldRedirect(url.href, targetUrl)) {
        // Redirect to Wikiwand
        window.location.href = targetUrl;
    }

    /**
     * Determines if we should redirect based on recent history
     * @param {string} sourceUrl - Current URL on Wikipedia
     * @param {string} targetUrl - Target URL on Wikiwand
     * @return {boolean} - Whether to proceed with the redirect
     */
    function shouldRedirect(sourceUrl, targetUrl) {
        // Get current time
        const now = Date.now();

        // Get redirect history
        const redirectHistory = GM_getValue('redirectHistory', []);

        // Check if we've redirected from this URL recently
        const recentRedirect = redirectHistory.find(item =>
            item.source === sourceUrl &&
            now - item.timestamp < REDIRECT_TIME_WINDOW
        );

        if (recentRedirect) {
            console.warn('Wikiwand Redirector: Prevented potential redirect loop for', sourceUrl);
            return false;
        }

        // Store this redirect attempt
        redirectHistory.push({
            source: sourceUrl,
            target: targetUrl,
            timestamp: now
        });

        // Keep only the most recent redirects to avoid excessive storage
        if (redirectHistory.length > REDIRECT_HISTORY_LIMIT) {
            redirectHistory.splice(0, redirectHistory.length - REDIRECT_HISTORY_LIMIT);
        }

        // Update the history
        GM_setValue('redirectHistory', redirectHistory);

        return true;
    }

    /**
     * Cleans up old redirect history records
     */
    function cleanupRedirectHistory() {
        const redirectHistory = GM_getValue('redirectHistory', []);
        const now = Date.now();

        // Remove entries older than the time window
        const updatedHistory = redirectHistory.filter(item =>
            now - item.timestamp < REDIRECT_TIME_WINDOW
        );

        if (updatedHistory.length !== redirectHistory.length) {
            GM_setValue('redirectHistory', updatedHistory);
        }
    }
})();