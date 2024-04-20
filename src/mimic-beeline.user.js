// ==UserScript==
// @name         Continuous Gradient Text
// @match        *://*/*
// @version      1.0
// @author       abstraction
// @description  Applies a continuous gradient to text across lines, enhancing readability.
// @grant        none
// @run-at       document-end
// @homepageURL  https://github.com/abstraction/userscripts
// @homepage     https://github.com/abstraction/userscripts
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/mimic-beeline.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/mimic-beeline.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Include the lineWrapDetector code
  !(function () {
    var e = function (e, t, n, r) {
      for (var r = r || '', i = e.split(''), a = 0; a < i.length; a++) {
        i[a] = t + i[a] + n;
      }
      return i.join(r);
    };
    var t = function (t) {
      if ('js-detect-wrap' != t.parentElement.className) {
        if ('#text' == t.nodeName) {
          for (var n = t.textContent.split(''), r = 0; r < n.length; r++) {
            if (n[r].length > 0) {
              var i = document.createElement('span');
              i.className = 'js-detect-wrap';
              i.innerText = n[r];
              t.parentNode.insertBefore(i, t);
            }
          }
          t.parentNode.removeChild(t);
        } else {
          t.innerText &&
            (t.innerHTML = e(
              t.innerText,
              '<span class="js-detect-wrap">',
              '</span>'
            ));
        }
      }
    };
    var n = function (e) {
      if (e.firstChild) {
        var r = [],
          i = e.firstChild;
        do {
          r.push(i);
        } while ((i = i.nextSibling));
        for (var a = 0; a < r.length; a++) {
          n(r[a]);
        }
      } else {
        t(e);
      }
    };
    var r = function (e) {
      n(e);
      var t = e.getElementsByClassName('js-detect-wrap');
      var r = 0,
        i = [],
        a = [],
        s = 0;
      for (var l = 0; l < t.length; l++) {
        var o = t[l].offsetTop + t[l].getBoundingClientRect().height;
        if (o == r) {
          i.push(t[l]);
        } else {
          if (i.length > 0) {
            a[s++] = i;
          }
          i = [t[l]];
        }
        r = o;
      }
      a.push(i);
      return a;
    };
    var i = {
      wrapWords: e,
      wrapWordsInElement: n,
      wrapWordsInChildElement: t,
      getLines: r
    };
    if (typeof define === 'function') {
      define(function () {
        return i;
      });
    } else {
      window.lineWrapDetector = i;
    }
  })();

  // Modified main.js code
  !(function () {
    // Assume lineWrapDetector code is already included above this function

    function lerp(v0, v1, t) {
      return v0 * (1 - t) + v1 * t;
    }
    function hexToRgb(hex) {
      return hex
        .replace('#', '')
        .match(/.{1,2}/g)
        .map(function (v) {
          return parseInt(v, 16);
        });
    }

    function applyGradient(colors, color_text, gradient_size) {
      const paragraphs = [
        ...document.getElementsByTagName('p'),
        ...document.getElementsByTagName('li')
      ];
      const base_color = hexToRgb(color_text);
      let coloridx = 0;
      let lineno = 0;

      for (let paragraph of paragraphs) {
        const lines = lineWrapDetector.getLines(paragraph);

        for (let line of lines) {
          // Alternate between left and right for every color
          const active_color = hexToRgb(colors[coloridx]);

          // Flip array around if on left to color correctly
          const is_left = lineno % 2 === 0;
          if (is_left) {
            line = Array.from(line).reverse();
          }

          // Color lines using lerp of RGB values
          for (let loc in line) {
            const t = 1 - loc / ((line.length * gradient_size) / 50);
            const red = lerp(base_color[0], active_color[0], t);
            const green = lerp(base_color[1], active_color[1], t);
            const blue = lerp(base_color[2], active_color[2], t);

            line[loc].style.color = `rgb(${red | 0},${green | 0},${blue | 0})`;
          }

          // Increment color index after every left/right pair, and lineno
          // after every line
          if (!is_left) {
            coloridx = (coloridx + 1) % colors.length;
          }
          lineno += 1;
        }
      }
    }

    applyGradient(['#FF0000', '#0000FF'], '#000000', 50); // Example: Gradient from red to blue with black as base text color
  })();
})();
