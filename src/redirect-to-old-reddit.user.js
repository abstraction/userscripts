// ==UserScript==
// @name         Redirect to old Reddit
// @namespace    https://github.com/abstraction/userscripts
// @description  Old Reddit but a bit more pleasing.
// @author       abstraction
// @version      2024-01-13
// @match        https://*.reddit.com*
// @match        https://reddit.com*
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

const main = () => {
  document.addEventListener('DOMContentLoaded', () => {
    navigateToOldReddit();
  });
  window.addEventListener('beforeunload', navigateToOldReddit);
  if (document.referrer === 'https://www.reddit.com/') {
    history.pushState({}, '');
    window.addEventListener('popstate', () => {
      history.go(-2); // Removes the new Reddit URL from history
    });
  }
};

main();
