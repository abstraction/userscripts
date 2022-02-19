// ==UserScript==
// @name        Goto Old Reddit
// @namespace   https://github.com/abstraction/userscripts
// @description Redirect new Reddit to the (G)old one
// @author      abstraction
// @version     1.1
// @author      abstraction
// @match       https://www.reddit.com/*
// @match       https://reddit.com/*
// @match       https://old.reddit.com/*
// @homepageURL https://github.com/abstraction/userscripts
// @updateURL   https://github.com/abstraction/userscripts/blob/master/src/goto-old-reddit.user.js
// @run-at       document-start
// ==/UserScript==

const prettify = () => {
  let paras = document.querySelectorAll('p');
  for(let para of paras){
      if (para.classList.length === 0) {  // don't big fluff like author, question, etc
          para.style.fontSize ="18px";
          para.style.lineHeight = '1.45';
          para.style.fontFamily = 'Iosevka Aile';
      }
  }
}

const main = () => {
  if (top.location.hostname !== 'old.reddit.com') top.location.hostname = 'old.reddit.com';
  else document.addEventListener('DOMContentLoaded', prettify);
}

main();

// rm filter
/*
old.reddit.com##.listingsignupbar.infobar
old.reddit.com###header
old.reddit.com##.login-form-side.login-form
old.reddit.com##.submit-text.submit.sidebox > .morelink > .access-required.login-required
old.reddit.com##.side
old.reddit.com##.commentsignupbar.infobar
old.reddit.com##.rounded.footer
old.reddit.com##p.bottommenu:nth-of-type(1)
old.reddit.com##p.bottommenu:nth-of-type(2)
*/