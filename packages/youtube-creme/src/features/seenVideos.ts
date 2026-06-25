import type { SeenVideosSettings } from '../config/settings';
import { findVideoContainer } from '../utils/dom';
import { Logger } from '../utils/logger';
import { SELECTORS } from '../config/selectors';

export function processSeenVideos(settings: SeenVideosSettings) {
  if (!settings.enabled) {
    return;
  }

  const progressIndicators = document.querySelectorAll<HTMLElement>(
    "ytd-thumbnail-overlay-resume-playback-renderer:not([data-yte-seen-checked])",
  );

  for (const indicator of progressIndicators) {
    indicator.dataset.yteSeenChecked = "true";

    const container = findVideoContainer(indicator);
    if (!container) {
      continue;
    }
    
    Logger.debug(`[SeenVideos] Filtered partially/fully watched video`);

    if (settings.action === "remove") {
      container.remove();
    } else {
      const opacity = settings.dimOpacity.toString();
      container.style.opacity = opacity;
      container.style.setProperty("--yte-filtered-opacity", opacity);
      container.dataset.yteSeen = "true";
      const touchFeedback = container.querySelector<HTMLElement>("yt-touch-feedback-shape");
      if (touchFeedback) {
        touchFeedback.style.pointerEvents = "none";
      }
    }
  }
}
