// ==UserScript==
// @name         Silent Auto Clear Site Data
// @namespace    http://tampermonkey.net/
// @version      2024-04-20
// @description  try to take over the world!
// @author       You
// @match        https://www.summarize.tech/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=summarize.tech
// @grant        none
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/silently-auto-clear-site-data.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/silently-auto-clear-site-data.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Clear cookies and site data
  window.addEventListener('load', function () {
    // Clear all site storage if supported
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage > 0) {
          navigator.storage.clear().then(() => {
            // eslint-disable-next-line no-console
            console.log('All site storage cleared.');
          });
        }
      });
    }

    // Clear cookies
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];
      var eqPos = cookie.indexOf('=');
      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie =
        name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  });
})();
