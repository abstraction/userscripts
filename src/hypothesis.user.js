// ==UserScript==
// @name         Hypothesis 2
// @namespace    https://github.com/abstraction/userscripts
// @description  Hypothesis annotator for Firefox and Firefox Android
// @author       abstraction
// @version      1.1.0
// @match        http*://*/*
// @homepageURL  https://github.com/abstraction/userscripts
// @homepage     https://github.com/abstraction/userscripts
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/hypothesis.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/hypothesis.user.js
// @grant        GM_addStyle
// @sandbox      DOM
// ==/UserScript==

/**
 * Note to self:
 * With the new FF update, you will have to disable CSP fully via about:config to inject external scripts for CSP sites.
 * There is a workaround to do it via Tampermonkey,
 */

const hypo = function () {
  window.hypothesisConfig = function () {
    return {
      showHighlights: true,
      appType: 'bookmarklet'
    };
  };

  const primaryScript = document.createElement('script');
  primaryScript.src = 'https://hypothes.is/embed.js';
  document.body.appendChild(primaryScript);

  const secondaryScript = document.createElement('script');
  secondaryScript.src =
    'https://cdn.hypothes.is/hypothesis/1.1487.0/build/scripts/annotator.bundle.js';
  document.body.appendChild(secondaryScript);

  const hStyle = document.createElement('link');
  hStyle.rel = 'stylesheet';
  hStyle.href =
    'https://cdn.hypothes.is/hypothesis/1.1487.0/build/styles/highlights.css';
  document.body.appendChild(hStyle);
};

const btn = document.createElement('button');
btn.id = 'btn-hypo';
btn.textContent = '🖊️';
document.body.appendChild(btn);

const getBtn = document.getElementById('btn-hypo');

let listenHypo = getBtn.addEventListener(
  'click',
  () => {
    hypo();
    getBtn.style.display = 'none';
  },
  { once: true }
);

//--- Style our newly added elements using CSS.
GM_addStyle(`
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
`);
