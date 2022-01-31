// ==UserScript==
// @name        Hypothesis
// @namespace   https://github.com/abstraction/userscripts
// @description Hypothesis annotator for Firefox and Firefox Android
// @author      abstraction
// @version     1.0.0
// @match       http*://*/*
// @homepageURL https://github.com/abstraction/userscripts
// @updateURL   https://github.com/abstraction/userscripts/blob/master/src/hypothesis.user.js
// ==/UserScript==

// modified header info to bypass csp (see notes) or use Tampermonkey

(function() {
   window.hypothesisConfig = function() {
      return {
         showHighlights: true,
         appType: 'bookmarklet'
      };
   };
   var d = document,
      s = d.createElement('script');
   s.setAttribute('src', 'https://hypothes.is/embed.js');
   d.body.appendChild(s)
})();