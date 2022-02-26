// ==UserScript==
// @name          HTMLg Cleaner
// @namespace     https://github.com/abstraction/userscripts
// @description   Shhhhh...
// @author        abstraction
// @version       1.1
// @match         https://htmlg.com/html-editor/
// @homepageURL   https://github.com/abstraction/userscripts
// @updateURL     https://github.com/abstraction/userscripts/blob/master/src/htmlg-cleaner.user.js
// @grant         unsafeWindow
// @run-at        document-end
// ==/UserScript==

(function() {
    'use strict';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    /** updateLeft() 99999 (320)
     ** inputChanged() 9999999 (5e4; ff debugger shows as 5000) */
    /* line 43-x onwards might cause crash */
    script.textContent = `

    function updateLeft(e, t) {
        var b = sourceEditorFricc[_0x6b09[75]]();
        b[_0x6b09[275]](_0x6b09[274]) && popupBox(_0x6b09[276]), 0 == linkedEditors && 1 == e || (0 == wysiwygActive && tinyMCE[_0x6b09[278]][_0x6b09[277]](b), 1 == scrollEditorsTogether && 0 != sourceEditorObject && setVisualScroll(sourceEditorObject));
        var x = $(_0x6b09[280])[_0x6b09[279]]();
        x = x[_0x6b09[246]](_0x6b09[281], _0x6b09[2]), (x = Number(x)) > 99999 ? (document[_0x6b09[84]](_0x6b09[282])[_0x6b09[204]][_0x6b09[203]] = _0x6b09[206], $(_0x6b09[280])[_0x6b09[44]](_0x6b09[283], _0x6b09[284]), $(_0x6b09[280])[_0x6b09[44]](_0x6b09[285], _0x6b09[286]), openCTA()) : (document[_0x6b09[84]](_0x6b09[282])[_0x6b09[204]][_0x6b09[203]] = _0x6b09[287], $(_0x6b09[280])[_0x6b09[44]](_0x6b09[283], _0x6b09[288]), $(_0x6b09[280])[_0x6b09[44]](_0x6b09[285], _0x6b09[288]))
    }

    function inputChanged(e, t) {
        var b = sourceEditorFricc[_0x6b09[75]]()[_0x6b09[217]];
        document[_0x6b09[84]](_0x6b09[289])[_0x6b09[116]] = _0x6b09[290] + b, updateLeft(e, _0x6b09[291] + t), b > 9999999 ? $(_0x6b09[293])[_0x6b09[44]]({
            color: _0x6b09[292],
            "font-weight": _0x6b09[286]
        }) : $(_0x6b09[293])[_0x6b09[44]]({
            color: _0x6b09[294],
            "font-weight": _0x6b09[295]
        })
    }

    document.querySelector('div#wrapCTA').style.display = 'none';

    $(document)[_0x6b09[811]](function() {
        $(_0x6b09[799])[_0x6b09[161]](function() {
            if (treeViewCount = 0, sourceEditorFricc[_0x6b09[75]]()[_0x6b09[217]] < 9999999) {
                document.querySelector('div#popupUzenetBox').style.display = 'none'; // untriggering main script's trigger
                document[_0x6b09[84]](_0x6b09[647])[_0x6b09[204]][_0x6b09[298]] = _0x6b09[794],
                document[_0x6b09[84]](_0x6b09[795])[_0x6b09[204]][_0x6b09[283]] = _0x6b09[796],
                document[_0x6b09[50]][_0x6b09[204]][_0x6b09[649]] = _0x6b09[797],
                $(_0x6b09[652])[_0x6b09[109]]();
                setTimeout(function() {
                    convertText()
                }, 50)
            } else popupBox(_0x6b09[798])
        }),
        $(_0x6b09[800])[_0x6b09[161]](function() {
            if (sourceEditorFricc[_0x6b09[75]]()[_0x6b09[217]] < 9999999) {
                document.querySelector('div#popupUzenetBox').style.display = 'none'; // untriggering main script's trigger
                document[_0x6b09[84]](_0x6b09[647])[_0x6b09[204]][_0x6b09[298]] = _0x6b09[794],
                document[_0x6b09[84]](_0x6b09[795])[_0x6b09[204]][_0x6b09[283]] = _0x6b09[796],
                document[_0x6b09[50]][_0x6b09[204]][_0x6b09[649]] = _0x6b09[797],
                $(_0x6b09[652])[_0x6b09[109]]();
                setTimeout(function() {
                    convertText()
                }, 50)
            } else popupBox(_0x6b09[798])
        })
    });

    `;

    const head = document.querySelector('head');
    head.appendChild(script);
})();