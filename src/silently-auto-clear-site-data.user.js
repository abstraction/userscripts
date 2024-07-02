// ==UserScript==
// @name           Silent Auto Clear Site Data
// @version        2024-07-02
// @description    Clean cookies and local storage
// @author         abstraction
// @match          https://www.summarize.tech/*
// @icon           https://www.google.com/s2/favicons?sz=64&domain=summarize.tech
// @grant          none
// @homepageURL    https://github.com/abstraction/userscripts/
// @updateURL      https://github.com/abstraction/userscripts/blob/master/src/silently-auto-clear-site-data.user.js
// @downloadURL    https://github.com/abstraction/userscripts/blob/master/src/silently-auto-clear-site-data.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Clear cookies and site data
  window.addEventListener('load', () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage > 0) {
          navigator.storage.clear().then(() => {
            console.log('All site storage cleared.');
          });
        }
      });
    }

    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });
})();