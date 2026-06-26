import { Logger } from '../utils/logger';

// We import the openSettings function type, but we will pass it in to avoid circular dependencies
// if main.tsx is the entrypoint.
type OpenSettingsFn = () => void;

let mastheadObserver: MutationObserver | null = null;
let isButtonInjected = false;

export function initMastheadButton(openSettings: OpenSettingsFn) {
  if (isButtonInjected) return;

  Logger.info('[Masthead] Waiting for YouTube masthead to load...');

  // The masthead might not be in the DOM immediately.
  mastheadObserver = new MutationObserver(() => {
    const buttonsContainer = document.querySelector('#end #buttons.ytd-masthead');
    
    if (buttonsContainer && !document.getElementById('yte-masthead-btn')) {
      injectButton(buttonsContainer, openSettings);
    }
  });

  mastheadObserver.observe(document.body, { childList: true, subtree: true });

  // Try immediately just in case
  const immButtonsContainer = document.querySelector('#end #buttons.ytd-masthead');
  if (immButtonsContainer) {
    injectButton(immButtonsContainer, openSettings);
  }
}

function injectButton(container: Element, openSettings: OpenSettingsFn) {
  if (document.getElementById('yte-masthead-btn')) return;
  
  Logger.info('[Masthead] Injecting Creme settings button');

  // Mimic YouTube's native yt-icon-button structure
  const wrapper = document.createElement('div');
  wrapper.id = 'yte-masthead-btn';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.marginRight = '8px';
  wrapper.style.width = '40px';
  wrapper.style.height = '40px';
  wrapper.style.borderRadius = '50%';
  wrapper.style.cursor = 'pointer';
  
  // Hover effect using standard DOM events since we can't easily inject hover CSS without a stylesheet
  wrapper.addEventListener('mouseenter', () => {
    wrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  });
  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.backgroundColor = 'transparent';
  });

  // SVG Icon
  wrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: block; width: 24px; height: 24px; fill: var(--yt-spec-text-primary, currentColor);">
      <path d="M12 9.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5m0-1c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zM13.22 3l.55 2.2.13.51.5.18c.61.23 1.19.56 1.72.98l.4.32.5-.14 2.17-.62 1.22 2.11-1.63 1.59-.37.36.08.51c.05.32.08.64.08.98s-.03.66-.08.98l-.08.51.37.36 1.63 1.59-1.22 2.11-2.17-.62-.5-.14-.4.32c-.53.43-1.11.76-1.72.98l-.5.18-.13.51-.55 2.24h-2.44l-.55-2.2-.13-.51-.5-.18c-.6-.23-1.18-.56-1.72-.99l-.4-.32-.5.14-2.17.62-1.21-2.12 1.63-1.59.37-.36-.08-.51c-.05-.32-.08-.65-.08-.98s.03-.66.08-.98l.08-.51-.37-.36-1.63-1.59 1.21-2.12 2.17.62.5.14.4-.32c.53-.42 1.11-.76 1.72-.98l.5-.18.13-.51.55-2.2h2.44M14 2h-4l-.74 2.96c-.73.27-1.4.66-2 1.14l-2.92-.83-2 3.46 2.19 2.13c-.06.37-.09.75-.09 1.14s.03.77.09 1.14l-2.19 2.13 2 3.46 2.92-.83c.6.48 1.27.87 2 1.14L10 22h4l.74-2.96c.73-.27 1.4-.66 2-1.14l2.92.83 2-3.46-2.19-2.13c.06-.37.09-.75.09-1.14s-.03-.77-.09-1.14l2.19-2.13-2-3.46-2.92.83c-.6-.48-1.27-.87-2-1.14L14 2z"></path>
    </svg>
  `;

  // Custom hover tooltip logic
  wrapper.title = "YouTube Creme Settings";

  // Event listener
  wrapper.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSettings();
  });

  // Prepend so it appears to the left of Create/Notifications by inserting directly into #buttons
  container.prepend(wrapper);

  // We keep the observer running because YouTube's SPA router might wipe the masthead entirely
}
