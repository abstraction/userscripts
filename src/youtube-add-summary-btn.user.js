// ==UserScript==
// @name         Add Summarize Button
// @namespace    http://tampermonkey.net/
// @version      2024-04-20
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/watch?v=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_addStyle
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/youtube-add-summary-btn.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/youtube-add-summary-btn.user.js
// ==/UserScript==

(function () {
  'use strict';

  // URL to redirect
  const redirectUrl =
    'https://summarize.tech/' +
    document.location.hostname +
    document.location.pathname +
    document.location.search;

  // Function to add the button
  function addButton() {
    const subscribeButton = document.querySelector('#subscribe-button');
    if (subscribeButton && !document.querySelector('#custom-redirect-button')) {
      const button = document.createElement('button');
      button.id = 'custom-redirect-button';
      button.textContent = 'Summarize';
      button.style.marginLeft = '8px';
      button.style.padding = '0px 16px';
      button.style.fontSize = '14px';
      button.style.color = '#000';
      button.style.backgroundColor = '#cc0000';
      button.style.border = 'none';
      button.style.borderRadius = '18px';
      button.style.cursor = 'pointer';
      button.style.height = '36px';
      button.style.lineHeight = '36px';
      button.style.fontWeight = 500;
      button.style.fontFamily = '"Roboto","Arial",sans-serif';

      GM_addStyle(
        '#custom-redirect-button:hover { background-color: #b80000 !important; }'
      );

      // Add click event to the button
      button.onclick = function () {
        window.location.href = redirectUrl;
      };

      subscribeButton.parentNode.insertBefore(
        button,
        subscribeButton.nextSibling
      );
    }
  }

  // Try to add the button periodically in case the page content loads dynamically
  const interval = setInterval(addButton, 2000); // Reduced interval to improve responsiveness, keep it 1000 if you're not using an extension that shifts layout

  // Clear the interval if navigating away from the page
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
})();
