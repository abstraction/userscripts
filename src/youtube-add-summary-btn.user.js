// ==UserScript==
// @name          Add Summarize Button
// @version       2024-07-02
// @description   Summarize YouTube videos using summarize.tech
// @author        abstraction
// @match         https://www.youtube.com/watch?v=*
// @icon          https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant         GM_addStyle
// @homepageURL   https://github.com/abstraction/userscripts/
// @updateURL     https://github.com/abstraction/userscripts/blob/master/src/youtube-add-summary-btn.user.js
// @downloadURL   https://github.com/abstraction/userscripts/blob/master/src/youtube-add-summary-btn.user.js
// ==/UserScript==

(function () {
  'use strict';

  const redirectUrl = `https://summarize.tech/${document.location.hostname}${document.location.pathname}${document.location.search}`;

  function addButton() {
    const subscribeButton = document.querySelector('#subscribe-button');
    if (subscribeButton && !document.querySelector('#custom-redirect-button')) {
      const button = document.createElement('button');
      button.id = 'custom-redirect-button';
      button.textContent = 'Summarize';
      Object.assign(button.style, {
        marginLeft: '8px',
        padding: '0px 16px',
        fontSize: '14px',
        color: '#000',
        backgroundColor: '#cc0000',
        border: 'none',
        borderRadius: '18px',
        cursor: 'pointer',
        height: '36px',
        lineHeight: '36px',
        fontWeight: 500,
        fontFamily: '"Roboto","Arial",sans-serif'
      });

      GM_addStyle('#custom-redirect-button:hover { background-color: #b80000 !important; }');
      button.onclick = () => window.location.href = redirectUrl;

      subscribeButton.parentNode.insertBefore(button, subscribeButton.nextSibling);
    }
  }

  // Try to add the button periodically in case the page content loads dynamically
  // FIXME - The script is unable to insert the Summarize button at times probably
  // due to the layout shift caused by YouTube's javascript. A refresh or two usually
  // usually fixes it but we should determine the root cause.
  const interval = setInterval(addButton, 3000);

  // Clear the interval if navigating away from the page
  window.addEventListener('beforeunload', () => clearInterval(interval));
})();