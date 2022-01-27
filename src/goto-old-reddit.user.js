// ==UserScript==
// @name        Goto Old Reddit
// @namespace   https://github.com/abstraction/userscripts
// @description Redirect new Reddit to the (G)old one
// @author      abstraction
// @version     1.0.0
// @author      abstraction
// @match       https://www.reddit.com/*
// @match       https://reddit.com/*
// @updateURL   https://github.com/abstraction/userscripts/blob/master/src/goto-old-reddit.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';
  top.location.hostname = 'old.reddit.com';
})();
