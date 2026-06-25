import type { DurationFilterSettings } from '../config/settings';
import { IS_SEARCH_PAGE, parseDurationToSeconds } from '../utils/dom';
import { Logger } from '../utils/logger';
import { SELECTORS } from '../config/selectors';

export function processDurationFilter(settings: DurationFilterSettings) {
  if (!settings.enabled) {
    return;
  }

  if (settings.applyOnSearchOnly && !IS_SEARCH_PAGE()) {
    return;
  }

  const containerSelectors = SELECTORS.videoContainers.split(", ");

  for (const selector of containerSelectors) {
    const containers = document.querySelectorAll<HTMLElement>(selector);
    for (const container of containers) {
      container.dataset.yteDurationChecked = "true";

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

      const durationStr = timeEl.textContent?.trim() || "";
      const seconds = parseDurationToSeconds(durationStr);

      if (seconds !== null && seconds < settings.minDurationSeconds) {
        Logger.debug(`[DurationFilter] Filtered video: duration ${seconds}s < ${settings.minDurationSeconds}s`);
        if (settings.action === "remove") {
          container.remove();
        } else {
          const opacity = (settings.dimOpacity || 0.3).toString();
          container.style.opacity = opacity;
          container.style.setProperty("--yte-filtered-opacity", opacity);
          container.dataset.yteDurationFiltered = "true";
          const touchFeedback = container.querySelector<HTMLElement>("yt-touch-feedback-shape");
          if (touchFeedback) {
            touchFeedback.style.pointerEvents = "none";
          }
        }
      }
    }
  }
}
