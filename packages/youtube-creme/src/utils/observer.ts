import { Logger } from './logger';

type ObserverCallback = () => void;
const callbacks: ObserverCallback[] = [];

let domMutationsThrottled = false;
let hasUnseenDomMutations = false;

function handleDomMutations() {
  if (domMutationsThrottled) {
    hasUnseenDomMutations = true;
    return;
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
        (mutation.type === "attributes" && mutation.attributeName === "class")
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
      attributeFilter: ["class"],
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

export function registerDomMutationCallback(cb: ObserverCallback) {
  callbacks.push(cb);
}
