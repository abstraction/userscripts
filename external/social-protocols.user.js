// ==UserScript==
// @name         social protocol
// @namespace    http://tampermonkey.net/
// @version      2025-04-29
// @description  try to take over the world!
// @author       You
// @match        https://news.social-protocols.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=social-protocols.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    document.querySelectorAll('.story-details > a:first-of-type').forEach((e) => {
    let num = parseFloat(e.textContent.trim().substring(1));
    if (isNaN(num) || num < 0.9) {
        e.parentElement.parentElement.parentElement.parentElement.remove()
    }
});

})();