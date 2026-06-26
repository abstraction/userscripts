import { Logger } from './logger';

type ObserverCallback = () => void;
const callbacks: ObserverCallback[] = [];
const urlChangeCallbacks: (() => void)[] = [];

export function registerDomMutationCallback(cb: ObserverCallback) {
  callbacks.push(cb);
}

export function registerUrlChangeCallback(cb: () => void) {
  urlChangeCallbacks.push(cb);
}

let domMutationsThrottled = false;
let hasUnseenDomMutations = false;
let currentPathname = '';

function handleDomMutations() {
  if (domMutationsThrottled) {
    hasUnseenDomMutations = true;
    return;
  }

  // Robust URL tracking to handle YouTube's flaky SPA router.
  if (window.location.pathname !== currentPathname) {
    currentPathname = window.location.pathname;
    if (currentPathname === '/') {
      document.documentElement.setAttribute('data-yte-is-homepage', 'true');
    } else {
      document.documentElement.removeAttribute('data-yte-is-homepage');
    }
    for (const cb of urlChangeCallbacks) {
      try {
        cb();
      } catch (e) {
        Logger.error("Error in url change callback", e);
      }
    }
  }

  domMutationsThrottled = true;

  for (const cb of callbacks) {
    cb();
  }

  setTimeout(() => {
    domMutationsThrottled = false;
    if (hasUnseenDomMutations) {
      hasUnseenDomMutations = false;
      handleDomMutations();
    }
  }, 200); // 200ms throttle
}

export function initObserver() {
  Logger.info("Initializing MutationObserver on document body");
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
      if (
        mutation.type === "childList" ||
        (mutation.type === "attributes" && 
          (mutation.attributeName === "class" || 
           mutation.attributeName === "src" || 
           mutation.attributeName === "href"))
      ) {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) {
      handleDomMutations();
    }
  });

  const observeBody = () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "src", "href"],
    });
    // Run once immediately
    handleDomMutations();
  };

  if (document.body) {
    observeBody();
  } else {
    document.addEventListener("DOMContentLoaded", observeBody);
  }
}

