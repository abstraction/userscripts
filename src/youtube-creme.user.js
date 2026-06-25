// ==UserScript==
// @name            youtube-creme
// @namespace       https://github.com/abstraction/userscripts
// @description     youtube-creme
// @author          abstraction
// @version         1.0.0
// @match           *://*.youtube.com/*
// @match           *://*.youtubekids.com/*
// @exclude         *://music.youtube.com/*
// @exclude         *://studio.youtube.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=CHANGE_TO_DOMAIN
// @homepageURL     https://github.com/abstraction/userscripts
// @supportURL      https://github.com/abstraction/userscripts/issues
// @updateURL       https://github.com/abstraction/userscripts/raw/master/src/youtube-creme.user.js
// @downloadURL     https://github.com/abstraction/userscripts/raw/master/src/youtube-creme.user.js
// @connect         returnyoutubedislikeapi.com
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @run-at          document-end
// ==/UserScript==

(function () {
  "use strict";

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const SCRIPT_PREFIX = "yte";
  const HANDLE_DOM_MUTATIONS_THROTTLE_MS = 100;
  const MAX_API_RETRIES = 10;
  const API_RETRY_DELAY_MIN_MS = 3000;
  const API_RETRY_UNIFORM_DISTRIBUTION_WIDTH_MS = 3000;
  const CACHE_DURATION_MS = 600000; // 10 minutes

  const IS_MOBILE_SITE = location.hostname === "m.youtube.com";
  const IS_YOUTUBE_KIDS_SITE = location.hostname === "www.youtubekids.com";
  const IS_SEARCH_PAGE = () => location.pathname === "/results";
  const IS_WATCH_PAGE = () => location.pathname === "/watch";

  // ============================================================================
  // DEFAULT SETTINGS
  // ============================================================================

  /**
   * @typedef {Object} RatingBarSettings
   * @property {boolean} enabled
   * @property {"top"|"bottom"} position
   * @property {"blue-gray"|"green-red"|"custom-colors"} colorScheme
   * @property {string} likesColor
   * @property {string} dislikesColor
   * @property {boolean} colorSeparator
   * @property {number} height
   * @property {number} opacity
   * @property {boolean} separator
   * @property {boolean} exponentialScaling
   * @property {boolean} tooltip
   * @property {boolean} applyToVideoPage
   * @property {boolean} showPercentage
   */

  /**
   * @typedef {Object} VideoFilterSettings
   * @property {boolean} enabled
   * @property {number} minRatingPercent
   * @property {number} minViews
   * @property {number} maxViews
   * @property {boolean} hideLiveStreams
   * @property {"remove"|"dim"} action
   * @property {number} dimOpacity
   */

  /**
   * @typedef {Object} DurationFilterSettings
   * @property {boolean} enabled
   * @property {number} minDurationSeconds
   * @property {boolean} applyOnSearchOnly
   * @property {"remove"|"dim"} action
   * @property {number} dimOpacity
   */

  /**
   * @typedef {Object} SeenVideosSettings
   * @property {boolean} enabled
   * @property {"remove"|"dim"} action
   * @property {number} dimOpacity
   */

  /**
   * @typedef {Object} EnhancerSettings
   * @property {RatingBarSettings} ratingBar
   * @property {VideoFilterSettings} videoFilter
   * @property {DurationFilterSettings} durationFilter
   * @property {SeenVideosSettings} seenVideos
   */

  /** @type {EnhancerSettings} */
  const DEFAULT_SETTINGS = {
    // Rating Bar Module
    ratingBar: {
      enabled: true,
      position: "bottom",
      colorScheme: "blue-gray",
      likesColor: "#3095e3",
      dislikesColor: "#cfcfcf",
      colorSeparator: false,
      height: 4,
      opacity: 100,
      separator: false,
      exponentialScaling: false,
      tooltip: true,
      applyToVideoPage: false,
      showPercentage: false,
    },
    // Video Filter Module (yt-creme functionality)
    videoFilter: {
      enabled: false,
      minRatingPercent: 99,
      minViews: 1000,
      maxViews: 0, // 0 = disabled
      hideLiveStreams: true,
      action: "remove", // "remove" or "dim"
      dimOpacity: 0.05,
    },
    // Duration Filter Module (yt-views functionality)
    durationFilter: {
      enabled: false,
      minDurationSeconds: 3600, // 1 hour
      applyOnSearchOnly: false,
      action: "remove", // "remove" or "dim"
      dimOpacity: 0.3,
    },
    // Seen Videos Module (yt-video-seen functionality)
    seenVideos: {
      enabled: false,
      action: "remove", // "remove" or "dim"
      dimOpacity: 0.3,
    },
  };

  // ============================================================================
  // STATE
  // ============================================================================

  /** @type {EnhancerSettings} */
  let settings = loadSettings();
  let domMutationsThrottled = false;
  let hasUnseenDomMutations = false;
  let pendingApiRequests = {};

  // Track filtered videos by video ID to survive DOM re-renders
  const filteredVideoIds = new Set();

  const IS_DARK_THEME = () => {
    const bgColor = getComputedStyle(document.body).getPropertyValue(
      "--yt-spec-general-background-a",
    );
    return bgColor && bgColor.trim() === "#181818";
  };

  // ============================================================================
  // SETTINGS STORAGE
  // ============================================================================

  /**
   * @returns {EnhancerSettings}
   */
  function loadSettings() {
    const stored = GM_getValue(`${SCRIPT_PREFIX}_settings`, null);
    if (!stored) {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
    return deepMerge(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), stored);
  }

  /**
   * @param {EnhancerSettings} newSettings
   */
  function saveSettings(newSettings) {
    GM_setValue(`${SCRIPT_PREFIX}_settings`, newSettings);
    settings = newSettings;
  }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // ============================================================================
  // API CACHE (Persistent via GM storage)
  // ============================================================================

  const CACHE_STORAGE_KEY = `${SCRIPT_PREFIX}_api_cache`;
  const CACHE_MAX_ENTRIES = 500; // Prevent unbounded growth

  function loadApiCache() {
    const stored = GM_getValue(CACHE_STORAGE_KEY, null);
    if (!stored) {
      return {};
    }
    // Clean up expired entries on load
    const now = Date.now();
    const cleaned = {};
    for (const [videoId, entry] of Object.entries(stored)) {
      if (now - entry.timestamp <= CACHE_DURATION_MS) {
        cleaned[videoId] = entry;
      }
    }
    return cleaned;
  }

  function saveApiCache(cache) {
    // Trim cache if too large (keep most recent entries)
    const entries = Object.entries(cache);
    if (entries.length > CACHE_MAX_ENTRIES) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache = Object.fromEntries(entries.slice(0, CACHE_MAX_ENTRIES));
    }
    GM_setValue(CACHE_STORAGE_KEY, cache);
  }

  // In-memory cache loaded from persistent storage
  let apiCache = loadApiCache();

  function getCachedVideoData(videoId) {
    const cached = apiCache[videoId];
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
      delete apiCache[videoId];
      return null;
    }
    return cached.data;
  }

  function setCachedVideoData(videoId, videoData) {
    apiCache[videoId] = { data: videoData, timestamp: Date.now() };
    // Debounced save to avoid excessive writes
    scheduleCacheSave();
  }

  let cacheSaveTimeout = null;
  function scheduleCacheSave() {
    if (cacheSaveTimeout) {
      return;
    }
    cacheSaveTimeout = setTimeout(() => {
      saveApiCache(apiCache);
      cacheSaveTimeout = null;
    }, 2000); // Save at most every 2 seconds
  }

  // Save cache before page unload
  window.addEventListener("beforeunload", () => {
    if (cacheSaveTimeout) {
      clearTimeout(cacheSaveTimeout);
      saveApiCache(apiCache);
    }
  });

  // ============================================================================
  // API SERVICE
  // ============================================================================

  function fetchLikesDataFromApi(videoId) {
    return new Promise((resolve) => {
      const cached = getCachedVideoData(videoId);
      if (cached) {
        resolve(cached);
        return;
      }

      if (pendingApiRequests[videoId]) {
        pendingApiRequests[videoId].push(resolve);
        return;
      }

      pendingApiRequests[videoId] = [resolve];

      GM_xmlhttpRequest({
        method: "GET",
        url: `https://returnyoutubedislikeapi.com/Votes?videoId=${videoId}`,
        onload: (response) => {
          let likesData = null;
          if (response.status === 200) {
            try {
              const parsed = JSON.parse(response.responseText);
              likesData = { likes: parsed.likes, dislikes: parsed.dislikes };
              setCachedVideoData(videoId, likesData);
            } catch (err) {
              console.error("[YTE] Failed to parse API response:", err);
            }
          }
          const callbacks = pendingApiRequests[videoId] || [];
          delete pendingApiRequests[videoId];
          callbacks.forEach((cb) => cb(likesData));
        },
        onerror: () => {
          const callbacks = pendingApiRequests[videoId] || [];
          delete pendingApiRequests[videoId];
          callbacks.forEach((cb) => cb(null));
        },
      });
    });
  }

  // ============================================================================
  // VIDEO DATA HELPERS
  // ============================================================================

  /**
   * @typedef {Object} VideoData
   * @property {number} likes
   * @property {number} dislikes
   * @property {number} total
   * @property {number|null} rating
   */

  /**
   * @param {number} likes
   * @param {number} dislikes
   * @returns {VideoData}
   */
  function createVideoDataObject(likes, dislikes) {
    const total = likes + dislikes;
    const rating = total ? likes / total : null;
    return { likes, dislikes, total, rating };
  }

  /**
   * @param {string} videoId
   * @returns {Promise<VideoData|null>}
   */
  async function getVideoDataFromApi(videoId) {
    for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
      const likesData = await fetchLikesDataFromApi(videoId);
      if (likesData !== null) {
        return createVideoDataObject(likesData.likes, likesData.dislikes);
      }
      await sleep(
        API_RETRY_DELAY_MIN_MS +
          Math.random() * API_RETRY_UNIFORM_DISTRIBUTION_WIDTH_MS,
      );
    }
    return null;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function ratingToPercentageString(rating) {
    if (rating === 1) {
      return "100%";
    }
    return (
      (Math.floor(rating * 1000) / 10).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%"
    );
  }

  function getToolTipText(videoData) {
    return (
      videoData.likes.toLocaleString() +
      "\u00A0/\u00A0" +
      videoData.dislikes.toLocaleString() +
      "\u00A0\u00A0 " +
      ratingToPercentageString(videoData.rating) +
      "\u00A0\u00A0 " +
      videoData.total.toLocaleString() +
      "\u00A0total"
    );
  }

  function exponentialRatingWidth(rating) {
    return 100 * Math.pow(2, 10 * (rating - 1));
  }

  // ============================================================================
  // UTILITY: DURATION PARSING
  // ============================================================================

  function parseDurationToSeconds(durationStr) {
    const parts = durationStr.split(":").map((p) => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  }

  // ============================================================================
  // UTILITY: VIEW COUNT PARSING
  // ============================================================================

  function parseViewCount(viewText) {
    // Handle formats: "375 views", "1.2K views", "16.5M views", "1B views", "1,234 views"
    // Also handle "No views" case
    if (!viewText || /no views/i.test(viewText)) {
      return 0;
    }

    // Remove commas from numbers like "1,234"
    const cleanedText = viewText.replace(/,/g, "");

    // Match patterns: "375 views", "1K views", "1.2K views", "16.5M views", "1B views"
    // YouTube formats: 675, 1K, 10.3K, 16.5M, 1B (case insensitive)
    const match = cleanedText.match(/(\d+(?:\.\d+)?)\s*([KMBkmb])?\s*views?/i);
    if (!match) {
      return null;
    }
    let count = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();
    const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
    if (suffix && multiplier[suffix]) {
      count *= multiplier[suffix];
    }
    return Math.floor(count);
  }

  function getViewCountFromContainer(container) {
    // Selectors ordered by specificity for new YouTube layout
    const metadataSelectors = [
      // New YouTube layout (yt-lockup-view-model based)
      ".yt-content-metadata-view-model__metadata-text",
      "yt-content-metadata-view-model span",
      ".yt-lockup-metadata-view-model__metadata span",
      // Classic YouTube layout
      "#metadata-line span",
      "#metadata-line",
      ".inline-metadata-item",
      ".ytd-video-meta-block span",
      "ytd-video-meta-block",
      // Fallback generic selector
      '[class*="metadata-text"]',
      '[class*="metadata"] span',
    ];

    for (const selector of metadataSelectors) {
      const elements = container.querySelectorAll(selector);
      for (const el of elements) {
        const text = (el.textContent || "").trim();
        // Only process elements that look like view counts (digit + optional suffix + "view")
        if (/\d+(?:\.\d+)?[KMBkmb]?\s*views?/i.test(text)) {
          const count = parseViewCount(text);
          if (count !== null) {
            console.log(
              `[YTE Debug] Found view count text: "${text}", parsed as: ${count}`,
            );
            return count;
          }
        }
      }
    }

    // Fallback: search entire container text for view count pattern
    const fullText = container.textContent || "";
    const viewMatch = fullText.match(/(\d+(?:\.\d+)?[KMBkmb]?\s*views?)/i);
    if (viewMatch) {
      return parseViewCount(viewMatch[1]);
    }

    return null;
  }

  // ============================================================================
  // UTILITY: VIDEO CONTAINER SELECTORS
  // ============================================================================

  function getVideoContainerSelectors() {
    if (IS_WATCH_PAGE()) {
      return [
        "ytd-compact-video-renderer",
        "ytd-reel-item-renderer",
        // New sidebar layout using yt-lockup-view-model
        "yt-lockup-view-model",
      ];
    }
    return [
      "ytd-rich-item-renderer",
      "ytd-video-renderer",
      "ytd-grid-video-renderer",
      "ytd-reel-item-renderer",
      // New layout using yt-lockup-view-model (can appear on home/subscriptions too)
      "yt-lockup-view-model",
    ];
  }

  function findVideoContainer(element) {
    for (const selector of getVideoContainerSelectors()) {
      const container = element.closest(selector);
      if (container) {
        return container;
      }
    }
    return null;
  }

  function getVideoIdFromContainer(container) {
    // Try to get video ID from various sources
    // 1. From yt-lockup-view-model content-id-{videoId} class (new sidebar layout)
    const lockupDiv =
      container.querySelector('.yt-lockup-view-model[class*="content-id-"]') ||
      (container.classList.contains("yt-lockup-view-model")
        ? container.querySelector('[class*="content-id-"]')
        : null);
    if (lockupDiv) {
      const classList = lockupDiv.className;
      const match = classList.match(/content-id-([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    }

    // 2. From link href
    const link = container.querySelector(
      'a[href*="/watch?v="], a[href*="/shorts/"]',
    );
    if (link) {
      const href = link.getAttribute("href");
      const watchMatch = href.match(/[?&]v=([^&]+)/);
      if (watchMatch) return watchMatch[1];
      const shortsMatch = href.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
    }

    // 3. From thumbnail data attribute
    const thumbnail = container.querySelector("img[data-yte-video-id]");
    if (thumbnail) {
      return thumbnail.getAttribute("data-yte-video-id");
    }

    // 4. From thumbnail src
    const thumbnailImg = container.querySelector('img[src*="ytimg.com"]');
    if (thumbnailImg) {
      const src = thumbnailImg.getAttribute("src");
      const match = src.match(/\/vi\/([^\/]+)\//);
      if (match) return match[1];
    }

    return null;
  }

  // ============================================================================
  // MODULE: RATING BAR
  // ============================================================================

  const RatingBarModule = {
    METADATA_LINE_DATA_DESKTOP: [
      [
        ".yt-lockup-view-model",
        ".yt-content-metadata-view-model__metadata-row:last-child",
        "yt-core-attributed-string yt-content-metadata-view-model__metadata-text yt-core-attributed-string--white-space-pre-wrap yt-core-attributed-string--link-inherit-color",
      ],
      [
        "ytd-video-renderer",
        "#metadata-line",
        "inline-metadata-item style-scope ytd-video-meta-block",
      ],
      [
        "ytm-shorts-lockup-view-model",
        ".shortsLockupViewModelHostMetadataSubhead",
        "yt-core-attributed-string yt-core-attributed-string--white-space-pre-wrap",
      ],
      [
        "ytd-rich-grid-media",
        "#metadata-line",
        "inline-metadata-item style-scope ytd-video-meta-block",
      ],
      [
        "div.ytd-playlist-video-renderer",
        "#metadata-line",
        "style-scope ytd-video-meta-block",
      ],
      ["ytd-grid-movie-renderer", ".grid-movie-renderer-metadata", ""],
      [
        "ytd-grid-movie-renderer",
        "#byline-container",
        "style-scope ytd-video-meta-block",
      ],
      [
        "div.ytd-grid-video-renderer",
        "#metadata-line",
        "style-scope ytd-grid-video-renderer",
      ],
      [
        "ytd-promoted-video-renderer",
        "#metadata-line",
        "style-scope ytd-video-meta-block",
      ],
      [
        ".ytd-video-display-full-buttoned-and-button-group-renderer",
        "#byline-container",
        "style-scope ytd-ad-inline-playback-meta-block yt-simple-endpoint",
      ],
      [
        "ytmusic-two-row-item-renderer",
        "yt-formatted-string.subtitle",
        "style-scope yt-formatted-string",
      ],
    ],

    METADATA_LINE_DATA_MOBILE: [
      [
        "ytm-media-item",
        "ytm-badge-and-byline-renderer",
        "ytm-badge-and-byline-item-byline small-text",
      ],
      [
        ".shortsLockupViewModelHostEndpoint",
        ".shortsLockupViewModelHostMetadataSubhead",
        "yt-core-attributed-string yt-core-attributed-string--white-space-pre-wrap",
      ],
      [
        "ytm-video-card-renderer",
        ".subhead .small-text:last-child",
        "yt-core-attributed-string",
      ],
      [
        ".compact-media-item",
        ".subhead",
        "compact-media-item-stats small-text",
      ],
    ],

    createBarElement(videoData) {
      const barSettings = settings.ratingBar;
      const barElement = document.createElement("yte-bar");

      if (barSettings.opacity !== 100) {
        barElement.style.opacity = (barSettings.opacity / 100).toString();
      }

      let ratingElement;
      if (videoData.rating == null) {
        ratingElement = document.createElement("yte-no-rating");
      } else {
        const likesWidth = barSettings.exponentialScaling
          ? exponentialRatingWidth(videoData.rating)
          : 100 * videoData.rating;

        ratingElement = document.createElement("yte-rating");

        const likesEl = document.createElement("yte-likes");
        likesEl.style.width = `${likesWidth}%`;

        const dislikesEl = document.createElement("yte-dislikes");

        ratingElement.appendChild(likesEl);
        ratingElement.appendChild(dislikesEl);
      }

      barElement.appendChild(ratingElement);

      if (barSettings.tooltip) {
        const tooltipEl = document.createElement("yte-tooltip");
        const divEl = document.createElement("div");
        divEl.textContent = getToolTipText(videoData);
        tooltipEl.appendChild(divEl);
        barElement.appendChild(tooltipEl);
      }

      return barElement;
    },

    createPercentageElement(videoData) {
      const span = document.createElement("span");
      span.role = "text";

      const ratingText = document.createTextNode(
        ratingToPercentageString(videoData.rating),
      );

      if (videoData.likes === 0) {
        span.appendChild(ratingText);
        return span;
      }

      const innerSpan = document.createElement("span");
      const r = Math.round((1 - videoData.rating) * 1275);
      let g = videoData.rating * 637.5 - 255;
      if (!IS_DARK_THEME()) {
        g = Math.min(g, 255) * 0.85;
      }
      innerSpan.style.setProperty(
        "color",
        `rgb(${r},${Math.round(g)},0)`,
        "important",
      );
      innerSpan.appendChild(ratingText);
      span.appendChild(innerSpan);

      return span;
    },

    getMetadataLineInfo(thumbnailElement) {
      const metadataData = IS_MOBILE_SITE
        ? this.METADATA_LINE_DATA_MOBILE
        : this.METADATA_LINE_DATA_DESKTOP;

      for (const [containerSel, metaLineSel, itemClasses] of metadataData) {
        const container = thumbnailElement.closest(containerSel);
        if (!container) {
          continue;
        }
        const metaLine = container.querySelector(metaLineSel);
        if (metaLine) {
          return [metaLine, itemClasses];
        }
      }
      return [null, null];
    },

    addBar(thumbnailElement, videoData) {
      const parent = thumbnailElement.parentElement;
      if (!parent) {
        return;
      }
      parent.appendChild(this.createBarElement(videoData));
    },

    removeBar(thumbnailElement) {
      thumbnailElement.parentElement
        ?.querySelectorAll("yte-bar")
        .forEach((el) => el.remove());
    },

    addPercentage(thumbnailElement, videoData) {
      const [metaLine, itemClasses] =
        this.getMetadataLineInfo(thumbnailElement);
      if (!metaLine || metaLine.querySelector(".yte-percentage")) {
        return;
      }
      const percentEl = this.createPercentageElement(videoData);
      percentEl.className = itemClasses + " yte-percentage";
      metaLine.appendChild(percentEl);
    },

    removePercentage(thumbnailElement) {
      const [metaLine] = this.getMetadataLineInfo(thumbnailElement);
      metaLine
        ?.querySelectorAll(".yte-percentage")
        .forEach((el) => el.remove());
    },
  };

  // ============================================================================
  // MODULE: VIDEO FILTER (Rating & Views)
  // ============================================================================

  const VideoFilterModule = {
    applyFilter(container, videoData) {
      const filterSettings = settings.videoFilter;
      if (!filterSettings.enabled) {
        return false;
      }

      // Check rating threshold
      if (videoData && videoData.rating !== null) {
        const ratingPercent = videoData.rating * 100;
        console.log(
          `[YTE Debug] Video rating: ${ratingPercent.toFixed(1)}%, minRating setting: ${filterSettings.minRatingPercent}%, will filter: ${ratingPercent < filterSettings.minRatingPercent}`,
        );
        if (ratingPercent < filterSettings.minRatingPercent) {
          this.hideOrDim(container);
          return true;
        }
      }

      return false;
    },

    applyViewsFilter(container) {
      const filterSettings = settings.videoFilter;
      if (!filterSettings.enabled) {
        return false;
      }

      // Get video ID to track across re-renders
      const videoId = getVideoIdFromContainer(container);

      // If already filtered by video ID, re-apply the filter
      if (videoId && filteredVideoIds.has(videoId)) {
        this.hideOrDim(container);
        return true;
      }

      // Skip if already processed for views (by DOM attribute)
      if (container.dataset.yteViewsChecked === "true") {
        return false;
      }
      container.dataset.yteViewsChecked = "true";

      const viewCount = getViewCountFromContainer(container);

      // Debug logging for view count filtering
      if (viewCount !== null && filterSettings.maxViews > 0) {
        console.log(
          `[YTE Debug] Video views: ${viewCount}, maxViews setting: ${filterSettings.maxViews}, will filter: ${viewCount > filterSettings.maxViews}`,
        );
      }

      // Check for live streams (no view count means live or premiere)
      if (filterSettings.hideLiveStreams && viewCount === null) {
        const containerText = container.textContent || "";
        // Check if it's actually a live stream or premiere
        if (/watching|live|premiere|streaming/i.test(containerText)) {
          if (videoId) filteredVideoIds.add(videoId);
          this.hideOrDim(container);
          return true;
        }
      }

      // Check minimum views
      if (viewCount !== null && viewCount < filterSettings.minViews) {
        if (videoId) filteredVideoIds.add(videoId);
        this.hideOrDim(container);
        return true;
      }

      // Check maximum views (if enabled)
      if (
        filterSettings.maxViews > 0 &&
        viewCount !== null &&
        viewCount > filterSettings.maxViews
      ) {
        if (videoId) filteredVideoIds.add(videoId);
        this.hideOrDim(container);
        return true;
      }

      return false;
    },

    hideOrDim(container) {
      const filterSettings = settings.videoFilter;
      if (filterSettings.action === "remove") {
        container.remove();
      } else {
        const opacity = filterSettings.dimOpacity.toString();
        container.style.opacity = opacity;
        container.style.setProperty("--yte-filtered-opacity", opacity);
        container.dataset.yteFiltered = "true";
        // Disable pointer events on the touch feedback element to prevent hover effects
        const touchFeedback = container.querySelector(
          "yt-touch-feedback-shape",
        );
        if (touchFeedback) {
          touchFeedback.style.pointerEvents = "none";
        }
      }
    },

    // Process all video containers for views filtering (independent of API)
    processViewsFilter() {
      const filterSettings = settings.videoFilter;
      console.log(
        `[YTE Debug] processViewsFilter called. minViews: ${filterSettings.minViews}, maxViews: ${filterSettings.maxViews}`,
      );
      if (
        !filterSettings.enabled ||
        (filterSettings.minViews <= 0 && filterSettings.maxViews <= 0)
      ) {
        return;
      }

      // Get all video container types
      const containerSelectors = [
        "ytd-rich-item-renderer:not([data-yte-views-checked])",
        "ytd-video-renderer:not([data-yte-views-checked])",
        "ytd-grid-video-renderer:not([data-yte-views-checked])",
        "ytd-compact-video-renderer:not([data-yte-views-checked])",
        "ytd-reel-item-renderer:not([data-yte-views-checked])",
        // New sidebar layout using yt-lockup-view-model
        "yt-lockup-view-model:not([data-yte-views-checked])",
      ];

      for (const selector of containerSelectors) {
        const containers = document.querySelectorAll(selector);
        for (const container of containers) {
          this.applyViewsFilter(container);
        }
      }
    },
  };

  // ============================================================================
  // MODULE: DURATION FILTER
  // ============================================================================

  const DurationFilterModule = {
    process() {
      const durationSettings = settings.durationFilter;
      if (!durationSettings.enabled) {
        return;
      }

      if (durationSettings.applyOnSearchOnly && !IS_SEARCH_PAGE()) {
        return;
      }

      // All video container types across YouTube
      const containerSelectors = [
        "ytd-rich-item-renderer:not([data-yte-duration-checked])", // Home page
        "ytd-video-renderer:not([data-yte-duration-checked])", // Search, watch page sidebar
        "ytd-grid-video-renderer:not([data-yte-duration-checked])", // Channel pages, subscriptions
        "ytd-compact-video-renderer:not([data-yte-duration-checked])", // Sidebar, playlists
        "ytd-reel-item-renderer:not([data-yte-duration-checked])", // Shorts
        "yt-lockup-view-model:not([data-yte-duration-checked])", // New sidebar layout
      ];

      for (const selector of containerSelectors) {
        const containers = document.querySelectorAll(selector);
        for (const container of containers) {
          container.dataset.yteDurationChecked = "true";

          // Try multiple selectors for duration overlay
          const timeEl = container.querySelector(
            "#text.ytd-thumbnail-overlay-time-status-renderer, " +
              ".ytd-thumbnail-overlay-time-status-renderer #text, " +
              "ytd-thumbnail-overlay-time-status-renderer span, " +
              ".yt-thumbnail-overlay-badge-view-model .yt-badge-shape__text, " +
              "badge-shape .yt-badge-shape__text",
          );

          if (!timeEl) {
            continue;
          }

          const durationStr = timeEl.textContent.trim();
          const seconds = parseDurationToSeconds(durationStr);

          if (
            seconds !== null &&
            seconds < durationSettings.minDurationSeconds
          ) {
            if (durationSettings.action === "remove") {
              container.remove();
            } else {
              const opacity = (durationSettings.dimOpacity || 0.3).toString();
              container.style.opacity = opacity;
              container.style.setProperty("--yte-filtered-opacity", opacity);
              container.dataset.yteDurationFiltered = "true";
              // Disable pointer events on the touch feedback element to prevent hover effects
              const touchFeedback = container.querySelector(
                "yt-touch-feedback-shape",
              );
              if (touchFeedback) {
                touchFeedback.style.pointerEvents = "none";
              }
            }
          }
        }
      }

      // Remove empty shelf renderers
      const shelves = document.querySelectorAll("ytd-shelf-renderer");
      for (const shelf of shelves) {
        const visibleVideos = shelf.querySelectorAll(
          'ytd-video-renderer:not([style*="display: none"]):not([data-yte-duration-filtered])',
        );
        if (visibleVideos.length === 0) {
          shelf.style.display = "none";
        }
      }
    },
  };

  // ============================================================================
  // MODULE: SEEN VIDEOS
  // ============================================================================

  const SeenVideosModule = {
    process() {
      const seenSettings = settings.seenVideos;
      if (!seenSettings.enabled) {
        return;
      }

      const progressIndicators = document.querySelectorAll(
        "ytd-thumbnail-overlay-resume-playback-renderer:not([data-yte-seen-checked])",
      );

      for (const indicator of progressIndicators) {
        indicator.dataset.yteSeenChecked = "true";

        const container = findVideoContainer(indicator);
        if (!container) {
          continue;
        }

        if (seenSettings.action === "remove") {
          container.remove();
        } else {
          const opacity = seenSettings.dimOpacity.toString();
          container.style.opacity = opacity;
          container.style.setProperty("--yte-filtered-opacity", opacity);
          container.dataset.yteSeen = "true";
          // Disable pointer events on the touch feedback element to prevent hover effects
          const touchFeedback = container.querySelector(
            "yt-touch-feedback-shape",
          );
          if (touchFeedback) {
            touchFeedback.style.pointerEvents = "none";
          }
        }
      }
    },
  };

  // ============================================================================
  // THUMBNAIL PROCESSING
  // ============================================================================

  async function processThumbnail(thumbnailElement, thumbnailUrl) {
    // Skip thumbnails in snackbars, chapters, and frame previews
    if (
      thumbnailElement.closest(
        "snackbar-container, ytd-expandable-metadata-renderer, ytd-macro-markers-list-item-renderer, yt-player-storyboard",
      )
    ) {
      return;
    }

    const splitUrl = thumbnailUrl.split("/");
    const videoId = splitUrl[4];
    if (!videoId) {
      return;
    }

    const prevVideoId = thumbnailElement.getAttribute("data-yte-video-id");
    if (prevVideoId) {
      if (prevVideoId === videoId) {
        return;
      }
      // Different video ID, remove previous elements
      if (settings.ratingBar.enabled && settings.ratingBar.height !== 0) {
        RatingBarModule.removeBar(thumbnailElement);
      }
      if (settings.ratingBar.enabled && settings.ratingBar.showPercentage) {
        RatingBarModule.removePercentage(thumbnailElement);
      }
    }

    thumbnailElement.setAttribute("data-yte-video-id", videoId);

    const videoData = await getVideoDataFromApi(videoId);
    if (!videoData) {
      thumbnailElement.removeAttribute("data-yte-video-id");
      return;
    }

    // Video Filter: check rating
    const container = findVideoContainer(thumbnailElement);
    if (container && settings.videoFilter.enabled) {
      if (VideoFilterModule.applyFilter(container, videoData)) {
        return; // Video was filtered, skip other processing
      }
      VideoFilterModule.applyViewsFilter(container);
    }

    // Rating Bar
    if (settings.ratingBar.enabled && settings.ratingBar.height !== 0) {
      RatingBarModule.addBar(thumbnailElement, videoData);
    }

    // Rating Percentage
    const creatorDisabledLikes =
      videoData.likes === 0 && videoData.dislikes >= 10;
    if (
      settings.ratingBar.enabled &&
      settings.ratingBar.showPercentage &&
      videoData.rating != null &&
      !creatorDisabledLikes
    ) {
      RatingBarModule.addPercentage(thumbnailElement, videoData);
    }
  }

  function processNewThumbnails() {
    // Process standard thumbnail images
    const thumbnails = document.querySelectorAll(
      'img[src*=".ytimg.com/"]:not(.ytCinematicContainerViewModelBackgroundImage)',
    );
    for (const thumb of thumbnails) {
      const url = thumb.getAttribute("src");
      if (url) {
        processThumbnail(thumb, url);
      }
    }

    // Process video wall still images
    const videoWallImages = document.querySelectorAll(
      ".ytp-videowall-still-image",
    );
    for (const img of videoWallImages) {
      const bgUrl = img.style.backgroundImage;
      if (bgUrl) {
        const url = bgUrl.slice(5, -2);
        processThumbnail(img, url);
      }
    }
  }

  // ============================================================================
  // DOM MUTATION HANDLING
  // ============================================================================

  function handleDomMutations() {
    if (domMutationsThrottled) {
      hasUnseenDomMutations = true;
      return;
    }

    domMutationsThrottled = true;

    // Video Filter: process views filter independently (runs first for better UX)
    if (settings.videoFilter.enabled) {
      VideoFilterModule.processViewsFilter();
    }

    // Rating Bar processing
    if (
      settings.ratingBar.enabled &&
      (settings.ratingBar.height !== 0 || settings.ratingBar.showPercentage)
    ) {
      processNewThumbnails();
    }

    // Duration filter
    if (settings.durationFilter.enabled) {
      DurationFilterModule.process();
    }

    // Seen videos
    if (settings.seenVideos.enabled) {
      SeenVideosModule.process();
    }

    hasUnseenDomMutations = false;

    setTimeout(() => {
      domMutationsThrottled = false;
      if (hasUnseenDomMutations) {
        handleDomMutations();
      }
    }, HANDLE_DOM_MUTATIONS_THROTTLE_MS);
  }

  // ============================================================================
  // CSS INJECTION
  // ============================================================================

  function injectStyles() {
    const barSettings = settings.ratingBar;

    const cssBase = `
:root {
  --yte-bar-height: ${barSettings.height}px;
  --yte-bar-opacity: ${barSettings.opacity / 100};
  --yte-bar-likes-color: ${barSettings.likesColor};
  --yte-bar-dislikes-color: ${barSettings.dislikesColor};
  --yte-bar-likes-shadow: none;
  --yte-bar-dislikes-shadow: none;
}
yte-bar {
  display: block;
  position: absolute;
  width: 100%;
  z-index: 999;
  transition: opacity 0.2s ease-out 0.2s;
  opacity: var(--yte-bar-opacity);
}
yte-rating { display: flex; }
yte-no-rating {
  display: flex;
  height: var(--yte-bar-height);
  background-color: #888;
}
yte-likes {
  height: var(--yte-bar-height);
  background-color: var(--yte-bar-likes-color);
}
yte-dislikes {
  flex-grow: 1;
  height: var(--yte-bar-height);
  background-color: var(--yte-bar-dislikes-color);
  box-shadow: var(--yte-bar-dislikes-shadow);
}
#thumbnail-container { position: relative; }
ytm-app a.media-item-thumbnail-container, ytm-app a.compact-media-item-image { position: relative; }
ytm-app yte-bar { z-index: auto; }
ytm-media-item yte-bar {
  margin-left: -12px;
  margin-right: -12px;
  width: calc(100% + 24px);
}`;

    const cssBottom = `
yte-bar { bottom: 0; }
ytd-thumbnail-overlay-time-status-renderer { bottom: var(--yte-bar-height) !important; }
ytd-thumbnail-overlay-playback-status-renderer { bottom: var(--yte-bar-height) !important; }
.video-time { margin-bottom: calc(var(--yte-bar-height) + 1px) !important; }
ytd-thumbnail-overlay-resume-playback-renderer,
.resume-playback-background,
.resume-playback-progress-bar { top: 0 !important; }
ytm-thumbnail-overlay-time-status-renderer {
  position: absolute;
  bottom: calc(var(--yte-bar-height) + 1px) !important;
}`;

    const cssTop = `yte-bar { top: 0; }`;
    const cssBottomSeparator = `yte-bar { border-top: 1px solid var(--yt-spec-general-background-a, #fff); }`;
    const cssTopSeparator = `yte-bar { border-bottom: 1px solid var(--yt-spec-general-background-a, #fff); }`;

    const cssTooltip = `
yte-tooltip { display: flex; justify-content: center; }
yte-tooltip > div {
  position: absolute;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  max-width: calc(100% - 24px);
  padding: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  background-color: #616161;
  border-radius: 2px;
  font-family: 'Roboto', 'Noto', sans-serif;
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease-out 0.2s;
}
yte-bar:hover { opacity: 1 !important; }
yte-bar:hover yte-tooltip > div { visibility: visible; opacity: 0.9 !important; }`;

    const cssBottomTooltip = `yte-tooltip > div { bottom: calc(var(--yte-bar-height) + 4px); }`;
    const cssTopTooltip = `yte-tooltip > div { top: calc(var(--yte-bar-height) + 4px); }`;

    const cssVideoPage = `
#ryd-bar { background-color: var(--yte-bar-likes-color) !important; box-shadow: var(--yte-bar-likes-shadow); }
#ryd-bar-container { background-color: var(--yte-bar-dislikes-color) !important; }`;

    const cssTextPercentage = `
.yte-percentage::before { content: "•"; margin: 0 4px; }
ytm-badge-and-byline-renderer .yte-percentage::before { margin: 0 4px 0 0; }
:where(.yte-percentage) { color: var(--yt-spec-text-secondary); }`;

    // CSS to prevent hover effects on filtered videos
    const cssFilteredVideos = `
/* Prevent hover effects and video preview on filtered/dimmed videos */
[data-yte-filtered] yt-touch-feedback-shape,
[data-yte-seen] yt-touch-feedback-shape,
[data-yte-duration-filtered] yt-touch-feedback-shape {
  pointer-events: none !important;
}
/* Prevent opacity changes on hover for filtered videos */
[data-yte-filtered]:hover,
[data-yte-seen]:hover,
[data-yte-duration-filtered]:hover {
  opacity: var(--yte-filtered-opacity) !important;
}
/* Disable all hover effects on thumbnails within filtered containers */
[data-yte-filtered] ytd-thumbnail:hover,
[data-yte-seen] ytd-thumbnail:hover,
[data-yte-duration-filtered] ytd-thumbnail:hover {
  opacity: 1 !important;
}`;

    // Build CSS based on settings
    let combinedCss = cssFilteredVideos;

    if (barSettings.enabled && barSettings.height !== 0) {
      combinedCss += cssBase;

      if (barSettings.position === "top") {
        combinedCss += cssTop;
        if (barSettings.separator) {
          combinedCss += cssTopSeparator;
        }
        if (barSettings.tooltip) {
          combinedCss += cssTooltip + cssTopTooltip;
        }
      } else {
        combinedCss += cssBottom;
        if (barSettings.separator) {
          combinedCss += cssBottomSeparator;
        }
        if (barSettings.tooltip) {
          combinedCss += cssTooltip + cssBottomTooltip;
        }
      }

      if (barSettings.applyToVideoPage) {
        combinedCss += cssVideoPage;
      }
    }

    if (barSettings.enabled && barSettings.showPercentage) {
      combinedCss += cssTextPercentage;
    }

    const styleElement = document.createElement("style");
    styleElement.id = "yte-styles";
    styleElement.textContent = combinedCss;
    document.head.appendChild(styleElement);
  }

  function applyColorSettings() {
    const barSettings = settings.ratingBar;

    if (barSettings.colorScheme === "blue-gray") {
      document.documentElement.style.setProperty(
        "--yte-bar-likes-color",
        "#3095e3",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-dislikes-color",
        "#cfcfcf",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-likes-shadow",
        "none",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-dislikes-shadow",
        "none",
      );
    } else if (barSettings.colorScheme === "green-red") {
      document.documentElement.style.setProperty(
        "--yte-bar-likes-color",
        "#060",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-dislikes-color",
        "#c00",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-likes-shadow",
        "1px 0 #fff",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-dislikes-shadow",
        "inset 1px 0 #fff",
      );
    } else if (barSettings.colorScheme === "custom-colors") {
      document.documentElement.style.setProperty(
        "--yte-bar-likes-color",
        barSettings.likesColor,
      );
      document.documentElement.style.setProperty(
        "--yte-bar-dislikes-color",
        barSettings.dislikesColor,
      );
      document.documentElement.style.setProperty(
        "--yte-bar-likes-shadow",
        barSettings.colorSeparator ? "1px 0 #fff" : "none",
      );
      document.documentElement.style.setProperty(
        "--yte-bar-dislikes-shadow",
        barSettings.colorSeparator ? "inset 1px 0 #fff" : "none",
      );
    }

    document.documentElement.style.setProperty(
      "--yte-bar-height",
      barSettings.height + "px",
    );
    document.documentElement.style.setProperty(
      "--yte-bar-opacity",
      barSettings.opacity / 100,
    );
  }

  // ============================================================================
  // SETTINGS PANEL UI - Enhanced & Pixel Perfect
  // ============================================================================

  const SECTION_METADATA = {
    ratingBar: {
      icon: "📊",
      title: "Rating Bar",
      description:
        "Display like/dislike ratio bars on video thumbnails using Return YouTube Dislike API",
    },
    videoFilter: {
      icon: "🎯",
      title: "Quality Filter",
      description:
        "Hide or dim videos based on rating percentage and minimum view count thresholds",
    },
    durationFilter: {
      icon: "⏱️",
      title: "Duration Filter",
      description:
        "Filter out short videos that don't meet minimum duration requirements",
    },
    seenVideos: {
      icon: "👁️",
      title: "Watched Videos",
      description:
        "Manage videos you've already watched to keep your feed fresh",
    },
  };

  const SETTING_DESCRIPTIONS = {
    // Rating Bar
    position: "Where to display the rating bar on thumbnails",
    colorScheme: "Preset color combinations for likes/dislikes",
    likesColor:
      "Custom color for the likes portion (requires Custom Colors scheme)",
    dislikesColor:
      "Custom color for the dislikes portion (requires Custom Colors scheme)",
    height: "Height of the rating bar in pixels (0 to hide bar)",
    opacity: "Transparency level of the rating bar",
    tooltip: "Show detailed stats on hover (likes, dislikes, percentage)",
    separator: "Add a thin line between thumbnail and rating bar",
    exponentialScaling: "Make small rating differences more visible",
    showPercentage: "Display rating percentage next to video metadata",
    applyToVideoPage: "Apply custom colors to the video player page",
    // Video Filter
    minRatingPercent:
      "Videos below this rating will be filtered (e.g., 90 = 90%)",
    minViews: "Videos with fewer views will be filtered (0 = disabled)",
    maxViews: "Videos with more views will be filtered (0 = disabled)",
    hideLiveStreams: "Filter out live streams and premieres",
    action: "What to do with filtered videos",
    dimOpacity: "Opacity level when dimming (0 = invisible, 1 = fully visible)",
    // Duration Filter
    minDurationSeconds: "Minimum video length in seconds (3600 = 1 hour)",
    applyOnSearchOnly: "Only apply duration filter on search results page",
  };

  function showSettingsPanel() {
    const existingOverlay = document.getElementById("yte-settings-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "yte-settings-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(4px)",
      zIndex: "99999",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      boxSizing: "border-box",
    });

    const panel = document.createElement("div");
    panel.id = "yte-settings-panel";
    Object.assign(panel.style, {
      backgroundColor: "#0f0f0f",
      color: "#f1f1f1",
      borderRadius: "16px",
      padding: "0",
      maxWidth: "560px",
      width: "100%",
      maxHeight: "85vh",
      overflowY: "auto",
      fontFamily: "'Roboto', 'Arial', sans-serif",
      boxShadow:
        "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    });

    // Header
    const header = document.createElement("div");
    Object.assign(header.style, {
      padding: "24px 24px 20px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      position: "sticky",
      top: "0",
      backgroundColor: "#0f0f0f",
      zIndex: "10",
      borderRadius: "16px 16px 0 0",
    });

    const titleRow = document.createElement("div");
    Object.assign(titleRow.style, {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "8px",
    });

    // Create logo using DOM (CSP-safe, no innerHTML)
    const logoWrapper = document.createElement("div");
    Object.assign(logoWrapper.style, {
      width: "28px",
      height: "28px",
      backgroundColor: "#FF0000",
      borderRadius: "6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    const playIcon = document.createElement("div");
    Object.assign(playIcon.style, {
      width: "0",
      height: "0",
      borderLeft: "8px solid white",
      borderTop: "5px solid transparent",
      borderBottom: "5px solid transparent",
      marginLeft: "2px",
    });
    logoWrapper.appendChild(playIcon);

    const title = document.createElement("h2");
    title.textContent = "YouTube Enhancer";
    Object.assign(title.style, {
      margin: "0",
      fontSize: "18px",
      fontWeight: "600",
      color: "#fff",
      letterSpacing: "-0.3px",
    });

    const version = document.createElement("span");
    version.textContent = "v1.0.0";
    Object.assign(version.style, {
      fontSize: "12px",
      color: "#717171",
      marginLeft: "auto",
      padding: "4px 8px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: "4px",
    });

    titleRow.appendChild(logoWrapper);
    titleRow.appendChild(title);
    titleRow.appendChild(version);

    const subtitle = document.createElement("p");
    subtitle.textContent = "Customize your YouTube browsing experience";
    Object.assign(subtitle.style, {
      margin: "0",
      fontSize: "13px",
      color: "#717171",
      paddingLeft: "40px",
    });

    header.appendChild(titleRow);
    header.appendChild(subtitle);
    panel.appendChild(header);

    // Content
    const content = document.createElement("div");
    Object.assign(content.style, { padding: "8px 16px 16px" });

    const tempSettings = JSON.parse(JSON.stringify(settings));
    const sectionKeys = [
      "ratingBar",
      "videoFilter",
      "durationFilter",
      "seenVideos",
    ];

    for (const key of sectionKeys) {
      const sectionEl = createSettingsSection(key, tempSettings);
      content.appendChild(sectionEl);
    }

    panel.appendChild(content);

    // Footer
    const footer = document.createElement("div");
    Object.assign(footer.style, {
      padding: "16px 24px 24px",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      bottom: "0",
      backgroundColor: "#0f0f0f",
      borderRadius: "0 0 16px 16px",
    });

    const resetBtn = createOutlineButton("Reset to Defaults", () => {
      if (confirm("Reset all settings to defaults?")) {
        Object.assign(
          tempSettings,
          JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
        );
        overlay.remove();
        showSettingsPanel();
      }
    });

    const buttonGroup = document.createElement("div");
    Object.assign(buttonGroup.style, { display: "flex", gap: "12px" });

    const cancelBtn = createOutlineButton("Cancel", () => overlay.remove());
    const saveBtn = createPrimaryButton("Save Changes", () => {
      saveSettings(tempSettings);
      // Clear filtered video IDs cache when settings change
      filteredVideoIds.clear();
      location.reload();
    });

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(saveBtn);
    footer.appendChild(resetBtn);
    footer.appendChild(buttonGroup);
    panel.appendChild(footer);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // ESC to close
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  function createBaseButton(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    Object.assign(btn.style, {
      padding: "10px 20px",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      fontFamily: "'Roboto', 'Arial', sans-serif",
    });
    btn.addEventListener("mouseenter", () => {
      btn.style.opacity = "0.9";
      btn.style.transform = "scale(1.02)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.opacity = "1";
      btn.style.transform = "scale(1)";
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  function createOutlineButton(text, onClick) {
    const btn = createBaseButton(text, onClick);
    Object.assign(btn.style, {
      border: "1px solid rgba(255, 255, 255, 0.2)",
      backgroundColor: "transparent",
      color: "#f1f1f1",
    });
    return btn;
  }

  function createPrimaryButton(text, onClick, bgColor = "#3ea6ff") {
    const btn = createBaseButton(text, onClick);
    Object.assign(btn.style, {
      border: "none",
      backgroundColor: bgColor,
      color: "#0f0f0f",
    });
    return btn;
  }

  function createSettingsSection(sectionKey, tempSettings) {
    const meta = SECTION_METADATA[sectionKey];
    const sectionSettings = tempSettings[sectionKey];

    const section = document.createElement("div");
    Object.assign(section.style, {
      marginBottom: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    });

    // Collapsible header
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      padding: "16px",
      cursor: "pointer",
      transition: "background-color 0.2s",
      gap: "12px",
    });
    header.addEventListener("mouseenter", () => {
      header.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
    });
    header.addEventListener("mouseleave", () => {
      header.style.backgroundColor = "transparent";
    });

    const icon = document.createElement("span");
    icon.textContent = meta.icon;
    Object.assign(icon.style, {
      fontSize: "20px",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "8px",
    });

    const titleBlock = document.createElement("div");
    Object.assign(titleBlock.style, { flex: "1", minWidth: "0" });

    const sectionTitle = document.createElement("div");
    sectionTitle.textContent = meta.title;
    Object.assign(sectionTitle.style, {
      fontSize: "14px",
      fontWeight: "500",
      color: "#fff",
      marginBottom: "2px",
    });

    const sectionDesc = document.createElement("div");
    sectionDesc.textContent = meta.description;
    Object.assign(sectionDesc.style, {
      fontSize: "12px",
      color: "#717171",
      lineHeight: "1.4",
    });

    titleBlock.appendChild(sectionTitle);
    titleBlock.appendChild(sectionDesc);

    const toggleWrapper = document.createElement("div");
    toggleWrapper.addEventListener("click", (e) => e.stopPropagation());
    const enableToggle = createToggle(sectionSettings.enabled, (val) => {
      sectionSettings.enabled = val;
    });
    toggleWrapper.appendChild(enableToggle);

    const chevron = document.createElement("span");
    chevron.textContent = "▼";
    Object.assign(chevron.style, {
      fontSize: "10px",
      color: "#717171",
      transition: "transform 0.2s",
      marginLeft: "8px",
    });

    header.appendChild(icon);
    header.appendChild(titleBlock);
    header.appendChild(toggleWrapper);
    header.appendChild(chevron);

    // Content area
    const contentArea = document.createElement("div");
    Object.assign(contentArea.style, {
      padding: "0 16px 16px",
      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
      display: "block",
    });

    // Add settings based on section
    if (sectionKey === "ratingBar") {
      addRatingBarSettings(contentArea, sectionSettings);
    } else if (sectionKey === "videoFilter") {
      addVideoFilterSettings(contentArea, sectionSettings);
    } else if (sectionKey === "durationFilter") {
      addDurationFilterSettings(contentArea, sectionSettings);
    } else if (sectionKey === "seenVideos") {
      addSeenVideosSettings(contentArea, sectionSettings);
    }

    // Toggle collapse
    let isCollapsed = false;
    header.addEventListener("click", () => {
      isCollapsed = !isCollapsed;
      contentArea.style.display = isCollapsed ? "none" : "block";
      chevron.style.transform = isCollapsed ? "rotate(-90deg)" : "rotate(0)";
    });

    section.appendChild(header);
    section.appendChild(contentArea);
    return section;
  }

  function createToggle(initialValue, onChange) {
    const container = document.createElement("label");
    Object.assign(container.style, {
      position: "relative",
      display: "inline-block",
      width: "40px",
      height: "20px",
      flexShrink: "0",
    });

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = initialValue;
    Object.assign(input.style, {
      opacity: "0",
      width: "0",
      height: "0",
      position: "absolute",
    });

    const slider = document.createElement("span");
    Object.assign(slider.style, {
      position: "absolute",
      cursor: "pointer",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      backgroundColor: initialValue ? "#3ea6ff" : "rgba(255, 255, 255, 0.2)",
      transition: "0.2s",
      borderRadius: "20px",
    });

    const knob = document.createElement("span");
    Object.assign(knob.style, {
      position: "absolute",
      height: "16px",
      width: "16px",
      left: initialValue ? "22px" : "2px",
      bottom: "2px",
      backgroundColor: "#fff",
      transition: "0.2s",
      borderRadius: "50%",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
    });
    slider.appendChild(knob);

    input.addEventListener("change", () => {
      slider.style.backgroundColor = input.checked
        ? "#3ea6ff"
        : "rgba(255, 255, 255, 0.2)";
      knob.style.left = input.checked ? "22px" : "2px";
      onChange(input.checked);
    });

    container.appendChild(input);
    container.appendChild(slider);
    return container;
  }

  function createSettingRow(label, description, inputElement) {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      gap: "16px",
    });

    const labelBlock = document.createElement("div");
    Object.assign(labelBlock.style, { flex: "1", minWidth: "0" });

    const labelEl = document.createElement("div");
    labelEl.textContent = label;
    Object.assign(labelEl.style, {
      fontSize: "13px",
      color: "#f1f1f1",
      marginBottom: description ? "2px" : "0",
    });
    labelBlock.appendChild(labelEl);

    if (description) {
      const descEl = document.createElement("div");
      descEl.textContent = description;
      Object.assign(descEl.style, {
        fontSize: "11px",
        color: "#717171",
        lineHeight: "1.4",
      });
      labelBlock.appendChild(descEl);
    }

    row.appendChild(labelBlock);
    row.appendChild(inputElement);
    return row;
  }

  function createSelect(options, initialValue, onChange) {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, { position: "relative" });

    const select = document.createElement("select");
    Object.assign(select.style, {
      padding: "8px 32px 8px 12px",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "#f1f1f1",
      fontSize: "13px",
      cursor: "pointer",
      appearance: "none",
      minWidth: "120px",
      fontFamily: "'Roboto', 'Arial', sans-serif",
    });

    for (const opt of options) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      option.style.backgroundColor = "#1a1a1a";
      if (opt.value === initialValue) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    // Custom dropdown arrow
    const arrow = document.createElement("span");
    arrow.textContent = "▼";
    Object.assign(arrow.style, {
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      fontSize: "10px",
      color: "#717171",
      pointerEvents: "none",
    });

    select.addEventListener("change", () => onChange(select.value));
    wrapper.appendChild(select);
    wrapper.appendChild(arrow);
    return wrapper;
  }

  function createNumberInput(
    initialValue,
    min,
    max,
    step,
    onChange,
    unit = "",
  ) {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });

    const input = document.createElement("input");
    input.type = "number";
    input.value = initialValue;
    input.min = min;
    input.max = max;
    input.step = step;
    Object.assign(input.style, {
      width: "80px",
      padding: "8px 10px",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "#f1f1f1",
      fontSize: "13px",
      textAlign: "center",
      fontFamily: "'Roboto', 'Arial', sans-serif",
    });
    input.addEventListener("change", () =>
      onChange(parseFloat(input.value) || 0),
    );

    wrapper.appendChild(input);

    if (unit) {
      const unitLabel = document.createElement("span");
      unitLabel.textContent = unit;
      Object.assign(unitLabel.style, {
        fontSize: "12px",
        color: "#717171",
      });
      wrapper.appendChild(unitLabel);
    }

    return wrapper;
  }

  function createColorInput(initialValue, onChange) {
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });

    const input = document.createElement("input");
    input.type = "color";
    input.value = initialValue;
    Object.assign(input.style, {
      width: "36px",
      height: "36px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      backgroundColor: "transparent",
      padding: "0",
    });

    const hexLabel = document.createElement("span");
    hexLabel.textContent = initialValue.toUpperCase();
    Object.assign(hexLabel.style, {
      fontSize: "12px",
      color: "#717171",
      fontFamily: "monospace",
    });

    input.addEventListener("change", () => {
      onChange(input.value);
      hexLabel.textContent = input.value.toUpperCase();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(hexLabel);
    return wrapper;
  }

  // Section-specific settings builders with descriptions
  function addRatingBarSettings(container, barSettings) {
    container.appendChild(
      createSettingRow(
        "Bar Position",
        SETTING_DESCRIPTIONS.position,
        createSelect(
          [
            { value: "bottom", label: "Bottom" },
            { value: "top", label: "Top" },
          ],
          barSettings.position,
          (val) => {
            barSettings.position = val;
          },
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Color Scheme",
        SETTING_DESCRIPTIONS.colorScheme,
        createSelect(
          [
            { value: "blue-gray", label: "Blue / Gray" },
            { value: "green-red", label: "Green / Red" },
            { value: "custom-colors", label: "Custom" },
          ],
          barSettings.colorScheme,
          (val) => {
            barSettings.colorScheme = val;
          },
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Likes Color",
        SETTING_DESCRIPTIONS.likesColor,
        createColorInput(barSettings.likesColor, (val) => {
          barSettings.likesColor = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Dislikes Color",
        SETTING_DESCRIPTIONS.dislikesColor,
        createColorInput(barSettings.dislikesColor, (val) => {
          barSettings.dislikesColor = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Bar Height",
        SETTING_DESCRIPTIONS.height,
        createNumberInput(
          barSettings.height,
          0,
          20,
          1,
          (val) => {
            barSettings.height = val;
          },
          "px",
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Bar Opacity",
        SETTING_DESCRIPTIONS.opacity,
        createNumberInput(
          barSettings.opacity,
          0,
          100,
          5,
          (val) => {
            barSettings.opacity = val;
          },
          "%",
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Show Tooltip on Hover",
        SETTING_DESCRIPTIONS.tooltip,
        createToggle(barSettings.tooltip, (val) => {
          barSettings.tooltip = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Show Separator Line",
        SETTING_DESCRIPTIONS.separator,
        createToggle(barSettings.separator, (val) => {
          barSettings.separator = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Exponential Scaling",
        SETTING_DESCRIPTIONS.exponentialScaling,
        createToggle(barSettings.exponentialScaling, (val) => {
          barSettings.exponentialScaling = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Show % in Metadata",
        SETTING_DESCRIPTIONS.showPercentage,
        createToggle(barSettings.showPercentage, (val) => {
          barSettings.showPercentage = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Apply to Video Page",
        SETTING_DESCRIPTIONS.applyToVideoPage,
        createToggle(barSettings.applyToVideoPage, (val) => {
          barSettings.applyToVideoPage = val;
        }),
      ),
    );
  }

  function addVideoFilterSettings(container, filterSettings) {
    container.appendChild(
      createSettingRow(
        "Minimum Rating",
        SETTING_DESCRIPTIONS.minRatingPercent,
        createNumberInput(
          filterSettings.minRatingPercent,
          0,
          100,
          1,
          (val) => {
            filterSettings.minRatingPercent = val;
          },
          "%",
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Minimum Views",
        SETTING_DESCRIPTIONS.minViews,
        createNumberInput(filterSettings.minViews, 0, 10000000, 100, (val) => {
          filterSettings.minViews = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Maximum Views",
        SETTING_DESCRIPTIONS.maxViews,
        createNumberInput(
          filterSettings.maxViews,
          0,
          100000000,
          1000,
          (val) => {
            filterSettings.maxViews = val;
          },
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Hide Live Streams",
        SETTING_DESCRIPTIONS.hideLiveStreams,
        createToggle(filterSettings.hideLiveStreams, (val) => {
          filterSettings.hideLiveStreams = val;
        }),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Filter Action",
        SETTING_DESCRIPTIONS.action,
        createSelect(
          [
            { value: "remove", label: "Remove completely" },
            { value: "dim", label: "Dim (fade out)" },
          ],
          filterSettings.action,
          (val) => {
            filterSettings.action = val;
          },
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Dim Opacity Level",
        SETTING_DESCRIPTIONS.dimOpacity,
        createNumberInput(filterSettings.dimOpacity, 0, 1, 0.05, (val) => {
          filterSettings.dimOpacity = val;
        }),
      ),
    );
  }

  function addDurationFilterSettings(container, durationSettings) {
    container.appendChild(
      createSettingRow(
        "Minimum Duration",
        SETTING_DESCRIPTIONS.minDurationSeconds,
        createNumberInput(
          durationSettings.minDurationSeconds,
          0,
          36000,
          60,
          (val) => {
            durationSettings.minDurationSeconds = val;
          },
          "sec",
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Search Page Only",
        SETTING_DESCRIPTIONS.applyOnSearchOnly,
        createToggle(durationSettings.applyOnSearchOnly, (val) => {
          durationSettings.applyOnSearchOnly = val;
        }),
      ),
    );
  }

  function addSeenVideosSettings(container, seenSettings) {
    container.appendChild(
      createSettingRow(
        "Action for Watched",
        SETTING_DESCRIPTIONS.action,
        createSelect(
          [
            { value: "remove", label: "Remove completely" },
            { value: "dim", label: "Dim (fade out)" },
          ],
          seenSettings.action,
          (val) => {
            seenSettings.action = val;
          },
        ),
      ),
    );

    container.appendChild(
      createSettingRow(
        "Dim Opacity Level",
        SETTING_DESCRIPTIONS.dimOpacity,
        createNumberInput(seenSettings.dimOpacity, 0, 1, 0.05, (val) => {
          seenSettings.dimOpacity = val;
        }),
      ),
    );
  }

  // ============================================================================
  // MANUAL RUN BUTTON
  // ============================================================================

  function createManualRunButton() {
    const button = document.createElement("button");
    button.id = "yte-manual-run-btn";
    button.textContent = "▶️ Run YTE";
    Object.assign(button.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "10000",
      padding: "12px 20px",
      backgroundColor: "#3ea6ff",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      transition: "all 0.2s",
      fontFamily: "Roboto, Arial, sans-serif",
    });

    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#4db3ff";
      button.style.transform = "scale(1.05)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#3ea6ff";
      button.style.transform = "scale(1)";
    });

    button.addEventListener("click", () => {
      button.textContent = "⏳ Running...";
      button.disabled = true;
      button.style.opacity = "0.7";

      // Clear the checked attributes to force re-processing
      document.querySelectorAll("[data-yte-views-checked]").forEach((el) => {
        el.removeAttribute("data-yte-views-checked");
      });
      document.querySelectorAll("[data-yte-duration-checked]").forEach((el) => {
        el.removeAttribute("data-yte-duration-checked");
      });
      document.querySelectorAll("[data-yte-seen-checked]").forEach((el) => {
        el.removeAttribute("data-yte-seen-checked");
      });

      // Run all filters
      setTimeout(() => {
        if (settings.videoFilter.enabled) {
          VideoFilterModule.processViewsFilter();
        }
        if (settings.durationFilter.enabled) {
          DurationFilterModule.process();
        }
        if (settings.seenVideos.enabled) {
          SeenVideosModule.process();
        }
        if (settings.ratingBar.enabled) {
          processNewThumbnails();
        }

        button.textContent = "✅ Done!";
        setTimeout(() => {
          button.textContent = "▶️ Run YTE";
          button.disabled = false;
          button.style.opacity = "1";
        }, 1500);
      }, 100);
    });

    document.body.appendChild(button);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function init() {
    // Inject styles
    injectStyles();
    applyColorSettings();

    // Register menu command for settings
    GM_registerMenuCommand("⚙️ YouTube Enhancer Settings", showSettingsPanel);

    // Create manual run button
    createManualRunButton();

    // Set up mutation observer
    const observer = new MutationObserver(handleDomMutations);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial processing
    handleDomMutations();

    console.log("[YouTube Enhancer] Initialized successfully");
  }

  // Wait for document.body to be available
  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
