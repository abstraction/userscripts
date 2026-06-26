import type { DeclutterSettings } from '../config/settings';
import { Logger } from '../utils/logger';

let adObserver: MutationObserver | null = null;
let playerObserver: MutationObserver | null = null;

export function initPlayerTweaks(settings: DeclutterSettings) {
  if (!settings.enabled) return;

  if (settings.autoSkipAds) {
    startAdSkipper();
  }

  if (settings.autoExpandDescription || settings.autoTheaterMode) {
    startPlayerObserver(settings);
  }
}

function startAdSkipper() {
  if (adObserver) return;

  Logger.info('[PlayerTweaks] Starting Ad Skipper observer');
  
  adObserver = new MutationObserver(() => {
    // Look for the skip button
    const skipButton = document.querySelector('.ytp-ad-skip-button-modern, .ytp-ad-skip-button, .ytp-skip-ad-button') as HTMLElement;
    if (skipButton) {
      Logger.debug('[PlayerTweaks] Clicking skip ad button');
      skipButton.click();
    }
  });

  adObserver.observe(document.body, { childList: true, subtree: true });
}

function startPlayerObserver(settings: DeclutterSettings) {
  if (playerObserver) return;

  Logger.info('[PlayerTweaks] Starting Player observer (Expand/Theater)');

  playerObserver = new MutationObserver(() => {
    // Auto-Expand Description
    if (settings.autoExpandDescription && window.location.pathname === '/watch') {
      const expandBtn = document.querySelector('#bottom-row #expand') as HTMLElement;
      const metadata = document.querySelector('ytd-watch-metadata') as HTMLElement;
      // Ensure we haven't already expanded it and it's not hidden
      if (expandBtn && expandBtn.offsetParent !== null && metadata && !metadata.hasAttribute('description-expanded')) {
        Logger.debug('[PlayerTweaks] Auto-expanding description');
        expandBtn.click();
        // Set attribute so we don't click it repeatedly
        metadata.setAttribute('description-expanded', 'true');
      }
    }

    // Auto-Theater Mode
    if (settings.autoTheaterMode && window.location.pathname === '/watch') {
      const flexy = document.querySelector('ytd-watch-flexy') as HTMLElement;
      if (flexy && !flexy.hasAttribute('theater')) {
        const sizeBtn = document.querySelector('.ytp-size-button') as HTMLElement;
        if (sizeBtn) {
          Logger.debug('[PlayerTweaks] Auto-enabling theater mode');
          sizeBtn.click();
        }
      }
    }
  });

  playerObserver.observe(document.body, { childList: true, subtree: true });
}
