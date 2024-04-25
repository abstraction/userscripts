// ==UserScript==
// @name         Goto Old Reddit
// @namespace    https://github.com/abstraction/userscripts
// @description  Old Reddit but a bit more pleasing.
// @author       abstraction
// @version      2024-04-22
// @match        https://www.reddit.com/*
// @exclude      https://*.reddit.com/poll/*
// @exclude      https://*.reddit.com/gallery/*
// @exclude      https://www.reddit.com/media*
// @exclude      https://chat.reddit.com/*
// @exclude      https://www.reddit.com/appeal*
// @updateURL    https://raw.githubusercontent.com/abstraction/userscripts/master/src/redirect-to-old-reddit.user.js
// @downloadURL  https://raw.githubusercontent.com/abstraction/userscripts/master/src/redirect-to-old-reddit.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @run-at       document-start
// ==/UserScript==

const navigateToOldReddit = () => {
  if (top.location.hostname !== 'old.reddit.com') {
    top.location.hostname = 'old.reddit.com';
  }
};

navigateToOldReddit(); // Run immediately to redirect to old Reddit

// Ensures redirection during tab close, refresh, or navigation away
window.addEventListener('beforeunload', navigateToOldReddit);

// If coming from new Reddit, modify the history state
if (document.referrer === 'https://www.reddit.com/') {
  history.pushState({}, ''); // Adds a state to the history stack
  window.addEventListener('popstate', () => {
    history.go(-2); // Navigate back two steps in the history, skipping new Reddit
  });
}
