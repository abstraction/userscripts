const DEFAULT_SELECTORS = {
  // Elements that are evaluated to have a video ID and thumbnail
  thumbnails: [
    "ytd-thumbnail",
    "yt-thumbnail-view-model",
    "a#thumbnail",
    "a.ytd-thumbnail",
    "a.ytLockupViewModelContentImage",
    ".yt-lockup-view-model-content-image",
    ".yt-lockup-view-model .yt-core-image",
    "ytd-compact-video-renderer a#thumbnail",
    "ytd-reel-item-renderer a[href*='/shorts/']",
    "ytm-shorts-lockup-view-model a[href*='/shorts/']",
  ].join(", "),

  // Elements that represent the inner thumbnail image/container (where rating bar should actually be appended)
  innerThumbnail: "ytd-thumbnail, yt-thumbnail-view-model, yt-image",

  // Containers representing video cards for filtering (duration, likes, etc)
  videoContainers: [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-reel-item-renderer",
    "yt-lockup-view-model",
  ].join(", "),

  // Elements to find video IDs
  videoId: {
    lockup: '.yt-lockup-view-model[class*="content-id-"]',
    fallbackClass: '[class*="content-id-"]',
    links: 'a[href*="/watch?v="], a[href*="/shorts/"]',
    thumbnailWithId: 'img[data-yte-video-id]',
    thumbnailImg: 'img[src*="ytimg.com"]',
  },

  // Shelf containers to clean up when empty
  shelves: "ytd-shelf-renderer",
  visibleVideosInShelf: 'ytd-video-renderer:not([style*="display: none"]):not([data-yte-duration-filtered])',

  // Selectors for duration text
  durationText: [
    "#text.ytd-thumbnail-overlay-time-status-renderer",
    ".ytd-thumbnail-overlay-time-status-renderer #text",
    "ytd-thumbnail-overlay-time-status-renderer",
    "badge-shape.yt-badge-shape-time"
  ].join(", "),

  // Selectors for view count text
  viewCount: [
    "#metadata-line span.inline-metadata-item",
    "span.yt-core-attributed-string",
    "span.ytAttributedStringHost"
  ].join(", "),
  
  // Metadata line configs for rating text injection
  // Format: [container, metadataLine, classesToApply]
  metadataLineDesktop: [
  [
    ".yt-lockup-view-model",
    ".yt-content-metadata-view-model__metadata-row:last-child",
    "yt-core-attributed-string yt-content-metadata-view-model__metadata-text yt-core-attributed-string--white-space-pre-wrap yt-core-attributed-string--link-inherit-color",
  ],
  [
    "yt-lockup-view-model",
    ".ytContentMetadataViewModelMetadataRow:last-child",
    "ytAttributedStringHost ytContentMetadataViewModelMetadataText ytAttributedStringWhiteSpacePreWrap ytAttributedStringLinkInheritColor",
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
] as [string, string, string][],
  metadataLineMobile: [
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
] as [string, string, string][],
};

import { loadSettings } from "./settings";

function getMergedSelectors() {
  const settings = loadSettings();
  if (settings.customSelectors && settings.customSelectors.trim() !== "") {
    try {
      const parsed = JSON.parse(settings.customSelectors);
      return { ...DEFAULT_SELECTORS, ...parsed };
    } catch (e) {
      console.error("[YouTube Creme] Failed to parse customSelectors JSON", e);
    }
  }
  return DEFAULT_SELECTORS;
}

export const SELECTORS = getMergedSelectors();
