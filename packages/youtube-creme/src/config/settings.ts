import { GM_getValue, GM_setValue } from 'vite-plugin-monkey/dist/client';

export const SCRIPT_PREFIX = "yte";

export interface RatingBarSettings {
  enabled: boolean;
  position: "top" | "bottom";
  colorScheme: "blue-gray" | "green-red" | "custom-colors";
  likesColor: string;
  dislikesColor: string;
  colorSeparator: boolean;
  height: number;
  opacity: number;
  separator: boolean;
  exponentialScaling: boolean;
  exponentialPower: number;
  tooltip: boolean;
    applyToVideoPage: boolean;
    showStatsText: boolean;
  }
  
  export interface VideoFilterSettings {
  enabled: boolean;
  minRatingPercent: number;
  minViews: number;
  maxViews: number;
  hideLiveStreams: boolean;
  action: "remove" | "dim";
  dimOpacity: number;
}

export interface DurationFilterSettings {
  enabled: boolean;
  minDurationSeconds: number;
  applyOnSearchOnly: boolean;
  action: "remove" | "dim";
  dimOpacity: number;
}

export interface SeenVideosSettings {
  enabled: boolean;
  action: "remove" | "dim";
  dimOpacity: number;
}

export interface DeclutterSettings {
  enabled: boolean;
  hideShorts: boolean;
  hideHomepage: boolean;
  hideSidebar: boolean;
  hideLiveStreams: boolean;
  hideUpcoming: boolean;
  hideMixes: boolean;
  hideRelated: boolean;
  hideComments: boolean;
  hideEndScreen: boolean;
  
  // Advanced Focus & Zen
  redirectHomepageTo: "none" | "subscriptions" | "library" | "watch_later";
  grayscaleMode: boolean;
  hideInfoCards: boolean;
  hideNativeMetrics: boolean;
  hidePromotedSearch: boolean;
  autoSkipAds: boolean;
  autoExpandDescription: boolean;
  autoTheaterMode: boolean;
  timestampCommentsOnly: boolean;
  fixGridGaps: boolean;
}

export interface EnhancerSettings {
  debugMode: boolean;
  cacheDurationHours: number;
  customSelectors: string; // JSON string of custom selectors
  ratingBar: RatingBarSettings;
  videoFilter: VideoFilterSettings;
  durationFilter: DurationFilterSettings;
  seenVideos: SeenVideosSettings;
  declutter: DeclutterSettings;
}

export const DEFAULT_SETTINGS: EnhancerSettings = {
  debugMode: false,
  cacheDurationHours: 24,
  customSelectors: "",
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
    exponentialPower: 4,
    tooltip: true,
    applyToVideoPage: false,
    showStatsText: true,
  },
  videoFilter: {
    enabled: false,
    minRatingPercent: 0,
    minViews: 0,
    maxViews: 0,
    hideLiveStreams: false,
    action: "dim",
    dimOpacity: 0.05,
  },
  durationFilter: {
    enabled: false,
    minDurationSeconds: 60,
    applyOnSearchOnly: false,
    action: "dim",
    dimOpacity: 0.3,
  },
  seenVideos: {
    enabled: false,
    action: "dim",
    dimOpacity: 0.3,
  },
  declutter: {
    enabled: false,
    hideShorts: false,
    hideHomepage: false,
    hideSidebar: false,
    hideLiveStreams: false,
    hideUpcoming: false,
    hideMixes: false,
    hideRelated: false,
    hideComments: false,
    hideEndScreen: false,
    redirectHomepageTo: "none",
    grayscaleMode: false,
    hideInfoCards: false,
    hideNativeMetrics: false,
    hidePromotedSearch: false,
    autoSkipAds: false,
    autoExpandDescription: false,
    autoTheaterMode: false,
    timestampCommentsOnly: false,
    fixGridGaps: true,
  },
};

function deepMerge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export function loadSettings(): EnhancerSettings {
  const stored = GM_getValue(`${SCRIPT_PREFIX}_settings`, null);
  if (!stored) {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }
  return deepMerge(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), stored);
}

export function saveSettings(newSettings: EnhancerSettings) {
  GM_setValue(`${SCRIPT_PREFIX}_settings`, newSettings);
  // We can emit an event here later if needed, but for now we just return
}
