// ==UserScript==
// @name         Add Hypothesis
// @namespace    https://github.com/abstraction/userscripts
// @description  Hypothesis annotator for Firefox and Firefox Android
// @author       abstraction
// @version      2024-07-02
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hypothes.is
// @homepageURL  https://github.com/abstraction/userscripts
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/add-hypothesis.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/add-hypothesis.user.js
// @grant        none
// @run-at       document-body
// @sandbox      JavaScript
// ==/UserScript==

/**
 * NOTE -
 * This script does not work for pages with strict CSP such as MDN or Github
 * Although we bypass top level CSP using @sandbox, the problem is
 * Hypothesis' embed.js import additional scripts which do not play nice with
 * CSP. So, then I tried to port the bookmarklet to a userscript and then
 * replace all the injects with GM_addElement, works but some scripts/styles
 * get blocked. I suppose those are the ones imported by the other scripts.
 * This is a rabbit hole, how deep will I go to find imports? Perhaps I can
 * revisit and try to find a better way to do this, or make an extension or
 * just make Tampermonkey remove CSP headers all together (there is a setting
 * for that). So for now, the script works fine for some websites and doesn't
 * for some.
 */

// FYI - this script doesn't inject anything until you click the button

(function () {
  'use strict';

  function addHypothesisButton() {
    const button = document.createElement('button');
    Object.assign(button.style, {
      position: 'fixed',
      top: '25px',
      right: '20px',
      zIndex: '9999',
      padding: '0', // in case browsers go brr with defaults
      fontSize: '18px',
      backgroundColor: '#bd1c2b',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
      fontWeight: 'bolder',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '40px',
      width: '40px'
    });
    button.id = 'hypothesis-activation-btn';
    button.textContent = 'h.';
    button.onclick = () => activateHypothesis(button);

    // Add the button to the page
    document.body.appendChild(button);
  }

  // Load Hypothesis script and update button state
  function activateHypothesis(button) {
    button.textContent = '⌛';
    button.disabled = true;
    const script = document.createElement('script');
    script.src = 'https://hypothes.is/embed.js';
    script.onerror = () => (button.textContent = '‼️');
    script.onload = () => checkForSidebar();
    document.body.appendChild(script);
  }

  // Monitor for the Hypothesis sidebar, remove button and script on load
  function checkForSidebar() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.tagName &&
            node.tagName.toLowerCase() === 'hypothesis-sidebar'
          ) {
            removeButton(); // Remove button immediately upon detecting sidebar
            observeSidebar(node.shadowRoot.childNodes);
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Observe sidebar visibility changes
  function observeSidebar(root) {
    const sidebarContainer = root[1]; // Assuming the sidebar container is the second child
    if (!sidebarContainer) return;
    const observer = new MutationObserver(() => {
      if (sidebarContainer.style.display !== 'none') {
        removeScript();
        observer.disconnect();
      }
    });
    observer.observe(sidebarContainer, { attributes: true });
  }

  // Remove the Hypothesis activation button
  function removeButton() {
    const button = document.getElementById('hypothesis-activation-btn');
    button && button.remove();
  }

  // Remove the Hypothesis script
  function removeScript() {
    const script = document.querySelector(
      'script[src="https://hypothes.is/embed.js"]'
    );
    script && script.remove();
  }

  addHypothesisButton();
})();
