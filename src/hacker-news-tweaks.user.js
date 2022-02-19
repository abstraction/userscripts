// ==UserScript==
// @name        Hacker News Tweaks
// @namespace   https://github.com/abstraction/userscripts
// @description Cosmetic and usability tweaks for Hacker News
// @author      abstraction
// @version     1.1
// @match       https://news.ycombinator.com/*
// @match       http://news.ycombinator.com/*
// @homepageURL https://github.com/abstraction/userscripts
// @updateURL   https://github.com/abstraction/userscripts/blob/master/src/hacker-news-tweaks.user.js
// ==/UserScript==

var css =
  '<style type="text/css">' +
  // Wildcards
  '* { font-family: "Iosevka Aile", Helvetica, sans-serif !important; font-size: 18px; }' +
  // Header
  'body { margin:0; background-color:#F6F6F0 } ' +
  // hacky stuff start
  '#hnmain > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) { opacity: 0.15; background-color:inherit; }' + // topbar
  '#hnmain > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > a:nth-child(1) > img:nth-child(1) {display:none}' + // logo
  'div.comment { width: 60ch }' + // comment <= 60 characters
  'body { width: 50vw; margin: 0 auto }' +
  // hacker stuff end
  'body > center > table > tbody > tr:first-child { color:#47260F }' +
  'body > center > table > tbody > tr:first-child > td { padding:5px 0 }' +
  'body > center > table > tbody > tr:first-child > td a:hover { color:#fff }' +
  'body > center > table > tbody > tr:first-child > td b a { margin-left:1px }' +
  'body > center > table > tbody > tr:first-child > td > table { padding:0 5px !important }' +
  'body > center > table > tbody > tr:first-child > td td:nth-child(2) img { width:28px !important }' +
  'body > center > table > tbody > tr:first-child > td td:nth-child(2) a { text-transform:capitalize }' +
  // INDEX
  // Body
  'body > center > table > tbody > tr:nth-child(3) tr a { color:#262626 }' +
  'body > center > table > tbody > tr:nth-child(3) tr a:hover { text-decoration:underline }' +
  'body > center > table > tbody > tr:nth-child(3) tr a:visited { color:#828282 }' +
  'body > center > table > tbody > tr:nth-child(3) tr > td.title:first-child { visibility:hidden; overflow:hidden; text-indent:-999px }' +
  'body > center > table > tbody > tr:nth-child(3) tr > td:nth-child(2) > center > a { width:30px; height:16px; display:block }' +
  'body > center > table > tbody > tr:nth-child(3) tr > td:nth-child(2) > center > a:hover img { opacity:1 }' +
  'body > center > table > tbody > tr:nth-child(3) tr > td:nth-child(2) img { margin:0 !important; opacity:.5 }' +
  'body > center > table > tbody > tr:nth-child(3) tr:nth-child(3n) { height:10px !important }' +
  // ITEM
  // Item Link
  'body > center > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td > center > a > img { margin:0 }' +
  'body > center > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td > center > a { width:23px; display:block }' +
  // Comments
  'body > center > table > tbody > tr:nth-child(3) tr > td[valign=top] > center > a { width:10px; padding:3px 6px 0 0 }' +
  '.comment { /*max-width:400px;*/ padding-right: 36rem; line-height:1.4; display:block }' +
  '.comment p { margin:1em 0 0 0 }' +
  // + '.default > div { margin-bottom:-6px !important }'

  // PROFILE
  // Form
  'body > center > table > tbody > tr:nth-child(3) form tbody > tr > td:first-child { padding-left:26px }' +
  // CUSTOM
  '.votelinks { border-left: 4px solid #828282 !important }' +
  'div.reply a { color: #828282 !important }' +
  'td.ind { background-color: #828282 !important; opacity: 0.2 }' +
  'tr.comtr > td:nth-child(1) > table:nth-child(1) { border-collapse: collapse }' +
  '.comment-tree { border-collapse: collapse }' +
  // END OF CSS
  '</style>';

document.head.innerHTML += css;

const createIIFE = (fn) => {
  var script = document.createElement('script');
  script.setAttribute('type', 'application/javascript');
  script.textContent = '(' + fn + ')();';
  document.body.appendChild(script); // run the script
  document.body.removeChild(script); // clean up
};

const collapseComments = () => {
  createIIFE(function () {
    const comments = document.querySelectorAll('.comtr');
    const exclude = ['p', 'a', 'span', 'pre', 'code'];

    for (let comment of comments) {
      comment.addEventListener('click', (e) => {
        if (!exclude.includes(e.target.tagName.toLowerCase())) {
          toggle(attr(comment, 'id')); // not the event
          let currentCom = comment.querySelector('.comhead');
          if (currentCom.style['font-weight'] === '') {
            currentCom.style['font-weight'] = 'bold';
            currentCom.style['font-style'] = 'italic';
          } else {
            comheadStrong = false;
            currentCom.style['font-weight'] = '';
          }
        }
      });
    }
  });
};

window.addEventListener('load', collapseComments);
