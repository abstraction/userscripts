import { SELECTORS } from "../config/selectors";
export const IS_MOBILE_SITE = location.hostname === "m.youtube.com";
export const IS_YOUTUBE_KIDS_SITE = location.hostname === "www.youtubekids.com";
export const IS_SEARCH_PAGE = () => location.pathname === "/results";
export const IS_WATCH_PAGE = () => location.pathname === "/watch";

export const IS_DARK_THEME = () => {
  const bgColor = getComputedStyle(document.body).getPropertyValue(
    "--yt-spec-general-background-a",
  );
  return bgColor && bgColor.trim() === "#181818";
};

export function parseDurationToSeconds(durationStr: string): number {
  const parts = durationStr.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

export function parseViewCount(viewText: string): number | null {
  if (!viewText || /no views/i.test(viewText)) {
    return 0;
  }

  const cleanedText = viewText.replace(/,/g, "");
  const match = cleanedText.match(/(\d+(?:\.\d+)?)\s*([KMBkmb])?\s*views?/i);
  if (!match) {
    return null;
  }
  let count = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();
  const multiplier: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
  if (suffix && multiplier[suffix]) {
    count *= multiplier[suffix];
  }
  return Math.floor(count);
}

export function getViewCountFromContainer(container: HTMLElement): number | null {
  const metadataSelectors = [
    ".yt-content-metadata-view-model__metadata-text",
    "yt-content-metadata-view-model span",
    ".yt-lockup-metadata-view-model__metadata span",
    "#metadata-line span",
    "#metadata-line",
    ".inline-metadata-item",
    ".ytd-video-meta-block span",
    "ytd-video-meta-block",
    '[class*="metadata-text"]',
    '[class*="metadata"] span',
  ];

  for (const selector of metadataSelectors) {
    const elements = container.querySelectorAll(selector);
    for (const el of elements) {
      const text = (el.textContent || "").trim();
      if (/\d+(?:\.\d+)?[KMBkmb]?\s*views?/i.test(text)) {
        const count = parseViewCount(text);
        if (count !== null) {
          return count;
        }
      }
    }
  }

  const fullText = container.textContent || "";
  const viewMatch = fullText.match(/(\d+(?:\.\d+)?[KMBkmb]?\s*views?)/i);
  if (viewMatch) {
    return parseViewCount(viewMatch[1]);
  }

  return null;
}

export function getVideoContainerSelectors(): string[] {
  if (IS_WATCH_PAGE()) {
    return [
      "ytd-compact-video-renderer",
      "ytd-reel-item-renderer",
      "yt-lockup-view-model",
      "ytd-rich-item-renderer",
    ];
  }
  return [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-reel-item-renderer",
    "yt-lockup-view-model",
    "ytd-compact-video-renderer",
  ];
}

export function findVideoContainer(element: HTMLElement): HTMLElement | null {
  for (const selector of getVideoContainerSelectors()) {
    const container = element.closest(selector);
    if (container) {
      return container as HTMLElement;
    }
  }
  return null;
}

export function getVideoIdFromContainer(container: HTMLElement): string | null {
  const lockupDiv =
    container.querySelector(SELECTORS.videoId.lockup) ||
    (container.classList.contains("yt-lockup-view-model")
      ? container.querySelector(SELECTORS.videoId.fallbackClass)
      : null);
  if (lockupDiv) {
    const classList = lockupDiv.className;
    const match = classList.match(/content-id-([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  const link = container.querySelector(SELECTORS.videoId.links);
  if (link) {
    const href = link.getAttribute("href");
    if (href) {
      const watchMatch = href.match(/[?&]v=([^&]+)/);
      if (watchMatch) return watchMatch[1];
      const shortsMatch = href.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
    }
  }

  const thumbnail = container.querySelector(SELECTORS.videoId.thumbnailWithId);
  if (thumbnail) {
    return thumbnail.getAttribute("data-yte-video-id");
  }

  const thumbnailImg = container.querySelector(SELECTORS.videoId.thumbnailImg);
  if (thumbnailImg) {
    const src = thumbnailImg.getAttribute("src");
    if (src) {
      const match = src.match(/\/vi\/([^\/]+)\//);
      if (match) return match[1];
    }
  }

  return null;
}
