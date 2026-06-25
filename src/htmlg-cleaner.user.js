// ==UserScript==
// @name         Script Replacer for html6.com
// @version      2024-07-02
// @description  Replace script.js on Example.com
// @author       You
// @match        https://html6.com/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=html6.com
// @updateURL    https://github.com/abstraction/userscripts/raw/master/src/htmlg-cleaner.user.js
// @downloadURL  https://github.com/abstraction/userscripts/raw/master/src/htmlg-cleaner.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', (e) => {
    document.querySelector('#mainCTA').remove();
    document.querySelector('.wrapSense').remove();
    document.querySelector('a.ctaLink')?.remove();
    document.querySelector('.addthiszek').textContent = '--- PRO ---';
    document.querySelector('.addthiszek').style.color = 'white';
    document.querySelector('#Tag_Manager_1').value = 'div';
    setTimeout(document.querySelector('#tagCheck31').click(), 1000);
  });

  // Function to replace the script
  function replaceScript(originalScript) {
    // Remove the original script
    originalScript.parentNode.removeChild(originalScript);

    // Create a new script element
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';

    // Set the new script content
    newScript.src = 'https://abstraction.github.io/random/six.js';

    // Append the new script to the head
    document.head.appendChild(newScript);
  }

  // MutationObserver to watch for script addition
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.tagName === 'SCRIPT' && node.src.includes('html6.js')) {
          replaceScript(node);
        }
      });
    });
  });

  // Start observing the document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
