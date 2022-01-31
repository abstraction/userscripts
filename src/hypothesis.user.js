// ==UserScript==
// @name        Hypothesis 2
// @namespace   https://github.com/abstraction/userscripts
// @description Hypothesis annotator for Firefox and Firefox Android
// @author      abstraction
// @version     1.1.0
// @match       http*://*/*
// @homepageURL https://github.com/abstraction/userscripts
// @updateURL   https://github.com/abstraction/userscripts/blob/master/src/hypothesis.user.js
// @grant       GM_addStyle
// ==/UserScript==

const hypo = function() {
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
};

const btn = document.createElement('button');
btn.id = 'btn-hypo'
btn.textContent = '🖊️'
document.body.appendChild(btn);

const getBtn = document.getElementById('btn-hypo');

let listenHypo = getBtn.addEventListener('click', () => {
  hypo();
   getBtn.style.display = 'none';
}, {once: true})

//--- Style our newly added elements using CSS.
GM_addStyle ( `
#btn-hypo {
 position: fixed;
 top: 50px;
 right: 10px;
 background: #FBCA1F;
 font-family: inherit;
 padding: 0.1em 0.6em;
 font-weight: 900;
 font-size: 18px;
 border: 1px solid black;
 border-radius: 0.4em;
 box-shadow: 0.1em 0.1em;
 z-index: 9999;
}

#btn-hypo:hover {
 transform: translate(-0.05em, -0.05em);
 box-shadow: 0.15em 0.15em;
}

#btn-hypo:active {
 transform: translate(0.05em, 0.05em);
 box-shadow: 0.05em 0.05em;
}
` );