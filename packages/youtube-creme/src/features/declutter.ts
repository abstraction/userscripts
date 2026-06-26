import type { DeclutterSettings } from '../config/settings';

const DECLUTTER_STYLE_ID = 'yte-declutter-styles';

export function applyDeclutterStyles(settings: DeclutterSettings) {
  let styleEl = document.getElementById(DECLUTTER_STYLE_ID) as HTMLStyleElement | null;
  
  if (!settings.enabled) {
    if (styleEl) styleEl.remove();
    return;
  }

  // Setup robust homepage detection for SPA navigations
  if (!window.hasOwnProperty('yteHomepageListenerInstalled')) {
    const updateHomepageState = () => {
      if (window.location.pathname === '/') {
        document.documentElement.setAttribute('data-yte-is-homepage', 'true');
      } else {
        document.documentElement.removeAttribute('data-yte-is-homepage');
      }
    };
    
    // Check initially and on SPA navigations
    updateHomepageState();
    window.addEventListener('yt-navigate-finish', updateHomepageState);
    Object.defineProperty(window, 'yteHomepageListenerInstalled', { value: true, writable: false });
  }

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = DECLUTTER_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const rules: string[] = [];

  if (settings.hideShorts) {
    rules.push(`
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-section-renderer:has(a[href^="/shorts/"]),
      ytm-reel-shelf-renderer,
      yt-horizontal-list-renderer:has(a[href^="/shorts/"]),
      a[title="Shorts"],
      *[is_short="true"],
      ytd-video-renderer[is_short="true"],
      ytm-video-with-context-renderer[is_short="true"],
      ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-grid-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      /* Target individual Shorts lockups in new ViewModel architecture */
      ytd-rich-item-renderer:has(a[href^="/shorts/"]) {
        display: none !important;
      }
    `);
  }

  if (settings.hideHomepage) {
    rules.push(`
      ytd-browse[page-subtype="home"],
      ytd-browse[page-subtype="home"] * {
        display: none !important;
      }
      /* Fallback if page-subtype is missing */
      ytd-browse:not([page-subtype]) ytd-rich-grid-renderer {
        display: none !important;
      }
      /* Ultimate fallback relying on SPA navigation state */
      html[data-yte-is-homepage="true"] ytd-page-manager > ytd-browse {
        display: none !important;
      }
    `);
  }

  if (settings.hideSidebar) {
    rules.push(`
      #secondary,
      #secondary-inner,
      ytd-watch-next-secondary-results-renderer {
        display: none !important;
      }
      /* Center contents when the sidebar is entirely hidden */
      ytd-watch-flexy[flexy][is-two-columns_]:not([fullscreen]):not([theater]) {
        --ytd-watch-flexy-max-player-width: calc(var(--ytd-watch-flexy-chat-max-height)*var(--ytd-watch-flexy-width-ratio)/var(--ytd-watch-flexy-height-ratio)) !important;
      }
      #columns {
        justify-content: center;
      }
    `);
  }

  if (settings.hideLiveStreams) {
    rules.push(`
      ytd-rich-item-renderer:has(ytd-badge-supported-renderer:contains("LIVE")),
      ytd-video-renderer:has(ytd-badge-supported-renderer:contains("LIVE")),
      ytd-grid-video-renderer:has(ytd-badge-supported-renderer:contains("LIVE")),
      ytd-rich-item-renderer[badge-text="live"],
      ytd-grid-video-renderer[badge-text="live"] {
        display: none !important;
      }
    `);
  }

  if (settings.hideUpcoming) {
    rules.push(`
      ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"]),
      ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"]),
      ytd-grid-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"]),
      ytd-rich-item-renderer[badge-text="upcoming"],
      ytd-rich-item-renderer[badge-text="premiere"],
      ytd-grid-video-renderer[badge-text="upcoming"],
      ytd-grid-video-renderer[badge-text="premiere"] {
        display: none !important;
      }
    `);
  }

  if (settings.hideMixes) {
    rules.push(`
      ytd-rich-item-renderer:has(ytd-thumbnail-overlay-bottom-panel-renderer),
      ytd-radio-renderer,
      *[is_playable] {
        display: none !important;
      }
    `);
  }

  if (settings.hideEndScreen) {
    rules.push(`
      .html5-endscreen,
      .ytp-fullscreen-grid-stills-container,
      .ytp-pause-overlay {
        display: none !important;
      }
    `);
  }

  if (settings.hideComments) {
    rules.push(`
      #comments,
      #comment-teaser,
      ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"] {
        display: none !important;
      }
    `);
  }

  // Advanced Focus & Zen CSS Injections
  if (settings.grayscaleMode) {
    rules.push(`
      html {
        filter: grayscale(100%) !important;
      }
    `);
  }

  if (settings.hideNativeMetrics) {
    rules.push(`
      #owner-sub-count,
      ytd-video-primary-info-renderer #top-level-buttons-computed ytd-toggle-button-renderer {
        display: none !important;
      }
    `);
  }

  if (settings.hideInfoCards) {
    rules.push(`
      .ytp-ce-element,
      .ytp-info-cards-container {
        display: none !important;
      }
    `);
  }

  if (settings.hidePromotedSearch) {
    rules.push(`
      ytd-promoted-sparkles-web-renderer,
      ytd-shelf-renderer:has(span:contains("People also watched")),
      ytd-shelf-renderer:has(span:contains("For you")) {
        display: none !important;
      }
    `);
  }

  styleEl.textContent = rules.join('\\n');
}

export function isThumbnailHiddenByDeclutter(thumbnailElement: Element, settings: DeclutterSettings): boolean {
  if (!settings.enabled) return false;

  // Check if the element is part of a hidden group
  
  if (settings.hideShorts) {
    if (thumbnailElement.closest('ytd-reel-shelf-renderer, ytm-reel-shelf-renderer, [is_short="true"]')) return true;
    
    // Check if it's a short by examining the overlay
    const timeStatus = thumbnailElement.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (timeStatus && timeStatus.getAttribute('overlay-style') === 'SHORTS') return true;
  }

  if (settings.hideHomepage && window.location.pathname === '/') {
    return true; // We are hiding the homepage, so any thumbnail on it is considered hidden
  }

  if (settings.hideSidebar) {
    if (thumbnailElement.closest('#secondary, ytd-watch-next-secondary-results-renderer')) return true;
  }

  if (settings.hideMixes) {
    if (thumbnailElement.closest('ytd-radio-renderer')) return true;
    if (thumbnailElement.querySelector('ytd-thumbnail-overlay-bottom-panel-renderer')) return true; // Usually mixes have a bottom panel with "50+"
  }

  if (settings.hideLiveStreams) {
    const badge = thumbnailElement.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer')?.querySelector('ytd-badge-supported-renderer');
    if (badge && badge.textContent?.toUpperCase().includes('LIVE')) return true;
  }

  if (settings.hideUpcoming) {
    const timeStatus = thumbnailElement.querySelector('ytd-thumbnail-overlay-time-status-renderer');
    if (timeStatus && timeStatus.getAttribute('overlay-style') === 'UPCOMING') return true;
  }

  return false;
}
