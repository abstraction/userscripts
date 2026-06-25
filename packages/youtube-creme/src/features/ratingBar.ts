import type { RatingBarSettings } from '../config/settings';
import type { VideoData } from '../api/dislikeApi';
import { IS_DARK_THEME, IS_MOBILE_SITE } from '../utils/dom';
import { SELECTORS } from '../config/selectors';
import { Logger } from '../utils/logger';


function exponentialRatingWidth(rating: number, power: number): number {
  return 100 * Math.pow(rating, power);
}

function getToolTipText(videoData: VideoData): string {
  const likesStr = videoData.likes.toLocaleString();
  const dislikesStr = videoData.dislikes.toLocaleString();
  const totalStr = videoData.total.toLocaleString();
  const ratingStr = videoData.rating ? (videoData.rating * 100).toFixed(1) + "%" : "N/A";
  return `${likesStr} / ${dislikesStr} / ${totalStr}  •  ${ratingStr}`;
}

function ratingToPercentageString(rating: number | null): string {
  return rating ? (rating * 100).toFixed(1) + "%" : "0%";
}

function createBarElement(videoData: VideoData, settings: RatingBarSettings): HTMLElement {
  const barElement = document.createElement("yte-bar");

  if (settings.opacity !== 100) {
    barElement.style.opacity = (settings.opacity / 100).toString();
  }

  let ratingElement: HTMLElement;
  if (videoData.rating == null) {
    ratingElement = document.createElement("yte-no-rating");
  } else {
    const likesWidth = settings.exponentialScaling
      ? exponentialRatingWidth(videoData.rating, settings.exponentialPower ?? 4)
      : 100 * videoData.rating;

    ratingElement = document.createElement("yte-rating");

    const likesEl = document.createElement("yte-likes");
    likesEl.style.width = `${likesWidth}%`;

    const dislikesEl = document.createElement("yte-dislikes");

    ratingElement.appendChild(likesEl);
    ratingElement.appendChild(dislikesEl);
  }

  barElement.appendChild(ratingElement);

  if (settings.tooltip) {
    const tooltipEl = document.createElement("yte-tooltip");
    const divEl = document.createElement("div");
    divEl.textContent = getToolTipText(videoData);
    tooltipEl.appendChild(divEl);
    barElement.appendChild(tooltipEl);
  }

  return barElement;
}

function createPercentageElement(videoData: VideoData): HTMLElement {
  const span = document.createElement("span");
  span.role = "text";
  span.className = "yte-stats-container";

  const formatter = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 });
  const likesFormatted = formatter.format(videoData.likes);
  const dislikesFormatted = formatter.format(videoData.dislikes);
  const ratingPercent = videoData.rating ? (videoData.rating * 100).toFixed(1) + "%" : "0%";
  
  if (videoData.likes === 0 && videoData.dislikes === 0) {
    const noRatingSpan = document.createElement("span");
    noRatingSpan.className = "yte-stat-percent";
    noRatingSpan.textContent = "No Ratings";
    span.appendChild(noRatingSpan);
    return span;
  }

  const likesSpan = document.createElement("span");
  likesSpan.className = "yte-stat-item";
  likesSpan.style.display = "inline-flex";
  likesSpan.style.alignItems = "center";
  likesSpan.style.gap = "4px";
  likesSpan.style.marginRight = "8px";
  
  const likesIcon = document.createElement("span");
  likesIcon.className = "yte-icon";
  likesIcon.textContent = "👍";
  
  const likesText = document.createElement("span");
  likesText.textContent = likesFormatted;
  
  likesSpan.appendChild(likesIcon);
  likesSpan.appendChild(likesText);

  const dislikesSpan = document.createElement("span");
  dislikesSpan.className = "yte-stat-item";
  dislikesSpan.style.display = "inline-flex";
  dislikesSpan.style.alignItems = "center";
  dislikesSpan.style.gap = "4px";
  dislikesSpan.style.marginRight = "8px";
  
  const dislikesIcon = document.createElement("span");
  dislikesIcon.className = "yte-icon";
  dislikesIcon.textContent = "👎";
  
  const dislikesText = document.createElement("span");
  dislikesText.textContent = dislikesFormatted;
  
  dislikesSpan.appendChild(dislikesIcon);
  dislikesSpan.appendChild(dislikesText);

  const percentSpan = document.createElement("span");
  percentSpan.className = "yte-stat-percent";
  percentSpan.textContent = ratingPercent;

  if (videoData.rating !== null) {
    const r = Math.round((1 - videoData.rating) * 1275);
    let g = videoData.rating * 637.5 - 255;
    if (!IS_DARK_THEME()) {
      g = Math.min(g, 255) * 0.85;
    }
    percentSpan.style.setProperty("color", `rgb(${r},${Math.round(g)},0)`, "important");
    percentSpan.style.fontWeight = "600";
  }

  span.appendChild(likesSpan);
  span.appendChild(dislikesSpan);
  span.appendChild(percentSpan);

  return span;
}

function getMetadataLineInfo(thumbnailElement: HTMLElement): [Element | null, string | null] {
  const metadataData = IS_MOBILE_SITE
    ? SELECTORS.metadataLineMobile
    : SELECTORS.metadataLineDesktop;

  for (const [containerSel, metaLineSel, itemClasses] of metadataData) {
    const container = thumbnailElement.closest(containerSel);
    if (!container) continue;
    const metaLine = container.querySelector(metaLineSel);
    if (metaLine) {
      return [metaLine, itemClasses];
    }
  }
  return [null, null];
}

export function addBar(thumbnailElement: HTMLElement, videoData: VideoData, settings: RatingBarSettings) {
  let target = thumbnailElement;
  const innerThumbnail = thumbnailElement.querySelector(SELECTORS.innerThumbnail);
  if (innerThumbnail) {
    target = innerThumbnail as HTMLElement;
  }
  target.appendChild(createBarElement(videoData, settings));
}

export function removeBar(thumbnailElement: HTMLElement) {
  thumbnailElement
    ?.querySelectorAll("yte-bar")
    .forEach((el) => el.remove());
}

export function addPercentage(thumbnailElement: HTMLElement, videoData: VideoData) {
  const [metaLine, itemClasses] = getMetadataLineInfo(thumbnailElement);
  if (!metaLine || metaLine.querySelector(".yte-percentage")) {
    if (!metaLine) Logger.debug("Could not find metadata line for thumbnail", thumbnailElement);
    return;
  }
  Logger.debug("Found metadata line, appending percentage text", metaLine);
  const percentEl = createPercentageElement(videoData);
  if (itemClasses) {
    percentEl.className = itemClasses + " yte-percentage";
  } else {
    percentEl.className = "yte-percentage";
  }
  metaLine.appendChild(percentEl);
}

export function removePercentage(thumbnailElement: HTMLElement) {
  const [metaLine] = getMetadataLineInfo(thumbnailElement);
  metaLine
    ?.querySelectorAll(".yte-percentage")
    .forEach((el) => el.remove());
}
