// ==UserScript==
// @name          Goto Old Reddit
// @namespace     https://github.com/abstraction/userscripts
// @description   Old Reddit but a bit more pleasing.
// @author        abstraction
// @version       1.3
// @match         https://*.reddit.com*
// @match         https://reddit.com*
// @updateURL     https://raw.githubusercontent.com/abstraction/userscripts/master/src/goto-old-reddit.user.js
// @downloadURL   https://raw.githubusercontent.com/abstraction/userscripts/master/src/goto-old-reddit.user.js
// @run-at        document-start
// ==/UserScript==

const setStyles = (element, styles) => {
  for (let style in styles) {
    element.style[style] = styles[style];
  }
};

const prettify = () => {
  // Make paragraph text bigger
  let paras = document.querySelectorAll('p');
  for (let para of paras) {
    setStyles(para, {
      fontSize: '1.2rem',
      lineHeight: '1.45',
      // fontFamily: 'Iosevka Aile'
    });
  }

  // Normalize headlines
  let headlines = document.querySelectorAll('.title');
  for (let headline of headlines) {
    setStyles(headline, {
      fontSize: '1.35rem',
      lineHeight: '1.1',
      // fontFamily: 'Iosevka Aile'
    });
  }
};

const navigateToOldReddit = () => {
  if (top.location.hostname !== 'old.reddit.com') {
    top.location.hostname = 'old.reddit.com';
  }
};

const main = () => {
  document.addEventListener('DOMContentLoaded', () => {
    prettify();
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
