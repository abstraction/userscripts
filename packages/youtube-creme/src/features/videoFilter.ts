import type { VideoFilterSettings } from '../config/settings';
import type { VideoData } from '../api/dislikeApi';
import { findVideoContainer, getVideoIdFromContainer, getViewCountFromContainer } from '../utils/dom';
import { Logger } from '../utils/logger';
import { SELECTORS } from '../config/selectors';

const filteredVideoIds = new Set<string>();

export function clearFilteredVideoIds() {
  filteredVideoIds.clear();
}

function hideOrDim(container: HTMLElement, settings: VideoFilterSettings) {
  if (settings.action === "remove") {
    container.remove();
  } else {
    const opacity = settings.dimOpacity.toString();
    container.style.opacity = opacity;
    container.style.setProperty("--yte-filtered-opacity", opacity);
    container.dataset.yteFiltered = "true";
    const touchFeedback = container.querySelector<HTMLElement>("yt-touch-feedback-shape");
    if (touchFeedback) {
      touchFeedback.style.pointerEvents = "none";
    }
  }
}

export function applyFilter(container: HTMLElement, videoData: VideoData | null, settings: VideoFilterSettings): boolean {
  if (!settings.enabled) {
    return false;
  }

  if (videoData && videoData.rating !== null) {
    const ratingPercent = videoData.rating * 100;
    if (ratingPercent < settings.minRatingPercent) {
      Logger.debug(`[VideoFilter] Filtered video due to rating: ${ratingPercent.toFixed(1)}% < ${settings.minRatingPercent}%`);
      hideOrDim(container, settings);
      return true;
    }
  }

  return false;
}

export function applyViewsFilter(container: HTMLElement, settings: VideoFilterSettings): boolean {
  if (!settings.enabled) {
    return false;
  }

  const videoId = getVideoIdFromContainer(container);

  if (videoId && filteredVideoIds.has(videoId)) {
    hideOrDim(container, settings);
    return true;
  }

  if (container.dataset.yteViewsChecked === "true") {
    return false;
  }
  container.dataset.yteViewsChecked = "true";

  const viewCount = getViewCountFromContainer(container);

  if (settings.hideLiveStreams && viewCount === null) {
    const containerText = container.textContent || "";
    if (/watching|live|premiere|streaming/i.test(containerText)) {
      if (videoId) filteredVideoIds.add(videoId);
      Logger.debug(`[VideoFilter] Filtered livestream`);
      hideOrDim(container, settings);
      return true;
    }
  }

  if (viewCount !== null && viewCount < settings.minViews) {
    if (videoId) filteredVideoIds.add(videoId);
    Logger.debug(`[VideoFilter] Filtered video due to min views: ${viewCount} < ${settings.minViews}`);
    hideOrDim(container, settings);
    return true;
  }

  if (settings.maxViews > 0 && viewCount !== null && viewCount > settings.maxViews) {
    if (videoId) filteredVideoIds.add(videoId);
    Logger.debug(`[VideoFilter] Filtered video due to max views: ${viewCount} > ${settings.maxViews}`);
    hideOrDim(container, settings);
    return true;
  }

  return false;
}

export function processViewsFilter(settings: VideoFilterSettings) {
  if (!settings.enabled || (settings.minViews <= 0 && settings.maxViews <= 0)) {
    return;
  }

  const containerSelectors = SELECTORS.videoContainers.split(", ");

  for (const selector of containerSelectors) {
    const containers = document.querySelectorAll<HTMLElement>(selector);
    for (const container of containers) {
      applyViewsFilter(container, settings);
    }
  }
}
