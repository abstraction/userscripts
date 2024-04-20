// ==UserScript==
// @name         Hacker News Tweaks
// @namespace    https://github.com/abstraction/userscripts
// @description  Easily editable CSS for Hacker News
// @author       abstraction
// @version      2024-04-20
// @grant        GM_addStyle
// @run-at       document-start
// @match        https://news.ycombinator.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/hacker-news-tweaks.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/hacker-news-tweaks.user.js
// ==/UserScript==

const supriseFont = () =>
  ['"Gotham Pro"', '"Iosevka Aile"'][Math.round(Math.random())];

const styles = {
  base: {
    '*': {
      'font-family': supriseFont() + ', Helvetica, sans-serif',
      'font-size': '18px'
    },
    body: {
      margin: '0 auto'
    }
  },
  comments: {
    '.comment': {
      'max-width': '600px',
      'text-align': 'justify',
      'line-height': '1.4'
    },
    '.comment p': {
      margin: '1rem 0 0 0'
    }
  },
  voting: {
    '.votelinks': {
      'border-left': '2px dashed #828282',
      'border-right': '2px dashed #828282'
    }
  },
  interactive: {
    'div.reply a': {
      color: '#828282 !important' // impt otherwsie gets overwritten
    }
  }
};

function applyStyles(styleObject) {
  let cssString = '';
  for (let element in styleObject) {
    cssString += `${element} { `;
    for (let property in styleObject[element]) {
      cssString += `${property}: ${styleObject[element][property]}; `;
    }
    cssString += '} ';
  }
  if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(cssString);
  } else {
    const node = document.createElement('style');
    node.type = 'text/css';
    node.appendChild(document.createTextNode(cssString));
    document.head.appendChild(node);
  }
}

applyStyles({
  ...styles.base,
  ...styles.comments,
  ...styles.voting,
  ...styles.interactive
});
