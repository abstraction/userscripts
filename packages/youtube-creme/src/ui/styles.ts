import type { EnhancerSettings } from '../config/settings';
import { SELECTORS } from '../config/selectors';

const IS_DARK_THEME = () => {
  const bgColor = getComputedStyle(document.body).getPropertyValue(
    "--yt-spec-general-background-a",
  );
  return bgColor && bgColor.trim() === "#181818";
};

export function applyStyles(settings: EnhancerSettings) {
  const barSettings = settings.ratingBar;
  
  const cssBase = `
yte-rating {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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
${SELECTORS.thumbnails} { position: relative; }
ytm-app yte-bar { z-index: auto; }
yte-bar { z-index: 10; }
ytm-media-item yte-bar {
  margin-left: -12px;
  margin-right: -12px;
  width: calc(100% + 24px);
}`;

  const cssBottom = `
yte-bar { bottom: 0; position: absolute; left: 0; right: 0; }
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

  const cssTop = `yte-bar { top: 0; position: absolute; left: 0; right: 0; }`;
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
:where(.yte-percentage) { 
  color: var(--yt-spec-text-secondary); 
  display: inline-flex; 
  align-items: center; 
  flex-wrap: wrap; 
}
.yte-stats-container {
  display: inline-flex;
  align-items: center;
}
.yte-icon {
  font-size: 0.9em;
  opacity: 0.8;
}
`;

  const cssFilteredVideos = `
[data-yte-filtered] yt-touch-feedback-shape,
[data-yte-seen] yt-touch-feedback-shape,
[data-yte-duration-filtered] yt-touch-feedback-shape {
  pointer-events: none !important;
}
[data-yte-filtered]:hover,
[data-yte-seen]:hover,
[data-yte-duration-filtered]:hover {
  opacity: var(--yte-filtered-opacity) !important;
}
[data-yte-filtered] ytd-thumbnail:hover,
[data-yte-seen] ytd-thumbnail:hover,
[data-yte-duration-filtered] ytd-thumbnail:hover {
  opacity: 1 !important;
}`;

  let combinedCss = cssFilteredVideos;

  if (barSettings.enabled && barSettings.height !== 0) {
    combinedCss += cssBase;

    if (barSettings.position === "top") {
      combinedCss += cssTop;
      if (barSettings.separator) combinedCss += cssTopSeparator;
      if (barSettings.tooltip) combinedCss += cssTooltip + cssTopTooltip;
    } else {
      combinedCss += cssBottom;
      if (barSettings.separator) combinedCss += cssBottomSeparator;
      if (barSettings.tooltip) combinedCss += cssTooltip + cssBottomTooltip;
    }

    if (barSettings.applyToVideoPage) {
      combinedCss += cssVideoPage;
    }
  }

  if (barSettings.enabled && barSettings.showStatsText) {
    combinedCss += cssTextPercentage;
  }

  const styleElement = document.createElement("style");
  styleElement.id = "yte-styles";
  styleElement.textContent = combinedCss;
  document.head.appendChild(styleElement);
}

export function applyColorSettings(settings: EnhancerSettings) {
  const barSettings = settings.ratingBar;

  if (barSettings.colorScheme === "blue-gray") {
    document.documentElement.style.setProperty("--yte-bar-likes-color", "#3095e3");
    document.documentElement.style.setProperty("--yte-bar-dislikes-color", "#cfcfcf");
    document.documentElement.style.setProperty("--yte-bar-likes-shadow", "none");
    document.documentElement.style.setProperty("--yte-bar-dislikes-shadow", "none");
  } else if (barSettings.colorScheme === "green-red") {
    document.documentElement.style.setProperty("--yte-bar-likes-color", "#060");
    document.documentElement.style.setProperty("--yte-bar-dislikes-color", "#c00");
    document.documentElement.style.setProperty("--yte-bar-likes-shadow", "1px 0 #fff");
    document.documentElement.style.setProperty("--yte-bar-dislikes-shadow", "inset 1px 0 #fff");
  } else if (barSettings.colorScheme === "custom-colors") {
    document.documentElement.style.setProperty("--yte-bar-likes-color", barSettings.likesColor);
    document.documentElement.style.setProperty("--yte-bar-dislikes-color", barSettings.dislikesColor);
    document.documentElement.style.setProperty("--yte-bar-likes-shadow", barSettings.colorSeparator ? "1px 0 #fff" : "none");
    document.documentElement.style.setProperty("--yte-bar-dislikes-shadow", barSettings.colorSeparator ? "inset 1px 0 #fff" : "none");
  }

  document.documentElement.style.setProperty("--yte-bar-height", barSettings.height + "px");
  document.documentElement.style.setProperty("--yte-bar-opacity", (barSettings.opacity / 100).toString());
}
