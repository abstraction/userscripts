// ==UserScript==
// @name         Old Reddit Redirector
// @namespace    https://github.com/abstraction/userscripts
// @description  Need the old Reddit, bad mood Reddit
// @author       abstraction
// @version      2025-04-26
// @match        https://www.reddit.com/*
// @exclude      https://*.reddit.com/poll/*
// @exclude      https://*.reddit.com/gallery/*
// @exclude      https://www.reddit.com/media*
// @exclude      https://chat.reddit.com/*
// @exclude      https://www.reddit.com/appeal*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  // Skip if already on old.reddit.com
  if (window.location.hostname === 'old.reddit.com') return;

  // Configuration
  const REDIRECT_HISTORY_LIMIT = 5;
  const REDIRECT_TIME_WINDOW = 30000; // 30 seconds

  // Skip redirect if URL contains "no_redirect" parameter
  const url = new URL(window.location.href);
  if (url.searchParams.get("no_redirect")) return;

  // Don't redirect certain paths that don't work well on old Reddit
  const skipRedirectPaths = [
      '/coins', '/premium', '/live', '/talk',
      '/RedditRecap', '/predictions'
  ];
  
  if (skipRedirectPaths.some(path => url.pathname.startsWith(path))) return;

  // Generate target URL for old Reddit
  const targetUrl = url.href.replace(/\/\/(?:www\.)?reddit\.com/, '//old.reddit.com');

  // Check if we should redirect or if this might be part of a loop
  if (shouldRedirect(url.href, targetUrl)) {
      window.location.replace(targetUrl);
  }

  /**
   * Determines if we should redirect based on recent history
   */
  function shouldRedirect(sourceUrl, targetUrl) {
      const now = Date.now();
      const redirectHistory = GM_getValue('redirectHistory', []);

      // Check if we've redirected from this URL recently
      const recentRedirect = redirectHistory.find(item =>
          item.source === sourceUrl &&
          now - item.timestamp < REDIRECT_TIME_WINDOW
      );

      if (recentRedirect) {
          console.warn('Old Reddit Redirector: Prevented redirect loop for', sourceUrl);
          return false;
      }

      // Store this redirect and clean up old entries
      redirectHistory.push({
          source: sourceUrl,
          target: targetUrl,
          timestamp: now
      });

      // Keep only recent redirects
      while (redirectHistory.length > REDIRECT_HISTORY_LIMIT) {
          redirectHistory.shift();
      }

      // Remove entries older than the time window
      const updatedHistory = redirectHistory.filter(item =>
          now - item.timestamp < REDIRECT_TIME_WINDOW
      );

      GM_setValue('redirectHistory', updatedHistory);
      return true;
  }
})();