// ==UserScript==
// @name         [EXT] Bread
// @match        *://*/*
// @version      2.7.0
// @author       Toby (v1.0.5), ltGuillaume
// @license      MIT
// @description  Bread (Bionic Reading) - Read text faster & easier
// @grant        GM_addStyle
// @grant        GM_getValue
// @run-at       document-start
// @homepageURL  https://github.com/abstraction/userscripts/
// @updateURL    https://github.com/abstraction/userscripts/raw/master/external/ext-bread.user.js
// @downloadURL  https://github.com/abstraction/userscripts/raw/master/external/ext-bread.user.js
// ==/UserScript==

/* source: https://github.com/tobyxdd/bread (v1.0.5) */
/* jshint esversion: 6 */

let minWordLength = GM_getValue('minWordLength') || 4, // Minimum word length
  minTextLength = GM_getValue('minTextLength') || 20, // Minimum text length
  boldRatio = GM_getValue('boldRatio') || 0.4, // Bold ratio (percentage of letters per word)
  processDyn = GM_getValue('processDyn'), // Process dynamically loaded content, which may cause performance issues (True/False)
  breadAllSites = GM_getValue('breadAllSites'), // Apply to all sites visited (True), or just the ones listed in breadSites (False)
  breadSites =
    GM_getValue('breadSites') ||
    {
      /* Configure sites bread will be triggered on
  Apply to domains including "domain_part", restrict bread to a node via a "css_selector" (or false), apply custom CSS "custom_css"
  "domain_part" : "css_selector",
  "domain_part" : ["css_selector", "custom_css"],
*/
    },
  insertTextBefore = (text, node, bold) => {
    if (bold) {
      let span = document.createElement('span');
      span.className = 'bread';
      span.appendChild(document.createTextNode(text));

      node.parentNode.insertBefore(span, node);
    } else {
      node.parentNode.insertBefore(document.createTextNode(text), node);
    }
  },
  processNode = (root) => {
    let walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        return node.parentNode.nodeName !== 'INPUT' &&
          node.parentNode.nodeName !== 'NOSCRIPT' &&
          node.parentNode.nodeName !== 'SCRIPT' &&
          node.parentNode.nodeName !== 'STYLE' &&
          node.parentNode.nodeName !== 'TEXTAREA' &&
          node.parentNode.nodeName !== 'TITLE' &&
          (node.parentNode.nodeName === 'A' ||
            node.parentNode.nodeName === 'EM' ||
            node.parentNode.nodeName === 'STRONG' ||
            node.nodeValue.length >= minTextLength)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      let text = node.nodeValue;
      let wStart = -1,
        wLen = 0,
        eng = null;

      for (let i = 0; i <= text.length; i++) {
        // We use <= here because we want to include the last character in the loop
        let cEng =
          i < text.length ? /[\p{Letter}\p{Mark}]/u.test(text[i]) : false;

        if (i == text.length || eng !== cEng) {
          // State flipped or end of string
          if (eng && wLen >= minWordLength) {
            let word = text.substring(wStart, wStart + wLen);
            let numBold = Math.ceil(word.length * boldRatio);
            let bt = word.substring(0, numBold),
              nt = word.substring(numBold);
            insertTextBefore(bt, node, true);
            insertTextBefore(nt, node, false);
          } else if (wLen > 0) {
            let word = text.substring(wStart, wStart + wLen);
            insertTextBefore(word, node, false);
          }
          wStart = i;
          wLen = 1;
          eng = cEng;
        } else {
          wLen++;
        }
      }

      node.nodeValue = ''; // Can't remove the node (otherwise the tree walker will break) so just set it to empty
    }
  };

GM_addStyle(`
	span.bread {
		display: contents !important;
		font-weight: bolder !important;
	}
`);

let breadNode = breadAllSites != false ? 'body' : false;
for (domain in breadSites) {
  if (document.location.host.includes(domain)) {
    if (Array.isArray(breadSites[domain])) {
      GM_addStyle(breadSites[domain][1]);
      breadSites[domain] = breadSites[domain][0];
    }
    breadNode = breadSites[domain] || 'body';
    break;
  }
}

if (breadNode)
  window.addEventListener(
    'load',
    (e) => {
      let node = document.querySelector(breadNode);
      // eslint-disable-next-line no-console
      if (!node) return console.log('Bread: cannot find node', breadNode);
      if (processDyn != false) {
        const observer = new MutationObserver((mutations) =>
          mutations.forEach((mutation) =>
            mutation.addedNodes.forEach((addedNode) => processNode(addedNode))
          )
        );
        observer.observe(node, { subtree: true, childList: true });
      }
      processNode(node);
    },
    false
  );
