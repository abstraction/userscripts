// ==UserScript==
// @name         Reddit Tweaks
// @namespace    https://github.com/abstraction/userscripts
// @description  Reddit with a bit of edit
// @author       abstraction
// @version      2024-07-02
// @match        https://old.reddit.com/*
// @homepageURL  https://github.com/abstraction/userscripts
// @updateURL    https://raw.githubusercontent.com/abstraction/userscripts/master/src/reddit-tweaks.user.js
// @downloadURL  https://raw.githubusercontent.com/abstraction/userscripts/master/src/reddit-tweaks.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// ==/UserScript==

(function () {
  'use strict';

  // For future self: We can use maxToucPoints to detect for mobile as well, its
  // more modern but there is a caveat where it returns 256 for non-touch
  // devices in Windows: https://stackoverflow.com/q/55833326
  const isMobileDevice = () => window.matchMedia('(max-width: 768px)').matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);


  const setMobileViewport = () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
    viewportMeta.name = "viewport";
    viewportMeta.content = "width=device-width, initial-scale=1.0";
    if (!document.querySelector('meta[name="viewport"]')) {
      document.head.appendChild(viewportMeta);
    }
  };

  const createToggleButton = (sideDiv) => {
    const button = document.createElement('button');
    Object.assign(button.style, {
      position: 'fixed', top: '10px', left: '10px', zIndex: '1000'
    });
    button.innerHTML = '→';
    button.onclick = () => {
      sideDiv.style.display = sideDiv.style.display === 'none' ? 'block' : 'none';
      button.innerHTML = sideDiv.style.display === 'none' ? '→' : '←';
    };
    document.body.appendChild(button);
  };

  const applyMobileStyles = () => {
    const sideDiv = document.querySelector('.side');
    if (sideDiv) {
      sideDiv.style.display = 'none';
      document.head.appendChild(Object.assign(document.createElement('style'), {
        textContent: `
                    .side { width: auto !important; }
                    body .comment { padding: 2px 0 0 4px !important; }
                    .panestack-title { margin: 10px auto 10px 10px; }
                    .commentarea .menuarea, .usertext-edit { width: auto !important; }
                    .usertext-edit textarea { width: 90% !important; }
                `
      }));
      createToggleButton(sideDiv);
    }
  };

  const setStyles = (element, styles) => Object.assign(element.style, styles);

  const removeElements = (...selectors) => selectors.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) element.remove();
  });

  const enhanceComments = () => {
    document.querySelectorAll('.commentarea .md p').forEach(comment =>
      setStyles(comment, { 'font-size': '1.2rem', 'line-height': '1.6' }));

    document.querySelectorAll('.comment').forEach(container => {
      setStyles(container, {
        'background-color': '#f6f6f6',
        padding: '10px',
        'border-radius': '5px',
        'margin-bottom': '10px'
      });

      container.addEventListener('click', () => {
        const commentBody = container.querySelector('.md');
        if (commentBody) {
          const isVisible = commentBody.style.display !== 'none';
          commentBody.style.display = isVisible ? 'none' : '';
          container.style.backgroundColor = isVisible ? '#e6e6e6' : '#f6f6f6';
        }
      });

      const createToggleLink = (text, action) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = text;
        link.style.marginRight = '10px';
        link.onclick = (e) => {
          e.preventDefault();
          action(container);
        };
        return link;
      };

      const toggleChildren = (display, bgColor) => {
        container.querySelectorAll('.child .comment').forEach(child => {
          child.querySelector('.md').style.display = display;
          child.style.backgroundColor = bgColor;
        });
      };

      const collapseLink = createToggleLink('Collapse All', () => toggleChildren('none', '#e6e6e6'));
      const expandLink = createToggleLink('Expand All', () => toggleChildren('', '#f6f6f6'));

      const tagline = container.querySelector('.tagline');
      if (tagline) {
        tagline.appendChild(collapseLink);
        tagline.appendChild(expandLink);
      }
    });

    document.querySelectorAll('.comment a').forEach(link =>
      link.addEventListener('click', e => e.stopPropagation()));
  };

  const applyDesktopStyles = () => {
    removeElements('section.infobar', '.reddit-infobar', '.side');

    setStyles(document.querySelector('.content'), {
      display: 'flex',
      flexDirection: 'row-reverse',
      margin: 0
    });

    setStyles(document.querySelector('.thing'), {
      position: 'sticky',
      top: '2rem'
    });

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const element = mutation.target;
          if (element.classList.contains('pinned')) {
            element.classList.remove('pinned');
          }
        }
      });
    }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

    enhanceComments();
  };

  if (isMobileDevice()) {
    setMobileViewport();
    applyMobileStyles();
  } else if (/^https:\/\/old\.reddit\.com\/.*\/comments\/.*/.test(window.location.href)) {
    applyDesktopStyles();
  }
})();