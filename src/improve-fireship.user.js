// ==UserScript==
// @name         Improve Fireship
// @version      2024.1
// @description  Improves Fireship by providing access
// @match        https://fireship.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fireship.io
// @grant        none
// @updateURL    https://github.com/abstraction/userscripts/blob/master/src/freeship.user.js
// @downloadURL  https://github.com/abstraction/userscripts/blob/master/src/freeship.user.js
// ==/UserScript==

const mutationObserver = new MutationObserver(() => {
  document
    .querySelectorAll('[free=""]')
    .forEach((el) => el.setAttribute('free', true));

  const accessElement = document.querySelector('if-access');
  if (accessElement) {
    const grantedSlot = accessElement.querySelector('[slot="granted"]');
    if (grantedSlot) {
      accessElement.querySelector('[slot="denied"]')?.remove();
      grantedSlot.setAttribute('slot', 'denied');
    }
  }

  const videoPlayer = document.querySelector('video-player');
  if (!videoPlayer || !videoPlayer.shadowRoot) return;

  const globalData = document.querySelector('global-data');
  if (!globalData) return;

  const youtubeId = atob(globalData.getAttribute('youtube'));
  const vimeoId = Number(atob(globalData.getAttribute('vimeo')));

  if (youtubeId) {
    videoPlayer.setAttribute('free', true);
    videoPlayer.shadowRoot.querySelector('.vid').innerHTML = `
        <iframe src="https://youtube.com/embed/${youtubeId}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen="" title="${location.pathname.split('/')[3]}" width="426" height="240" frameborder="0"></iframe>`;
    return;
  }

  if (vimeoId) {
    videoPlayer.setAttribute('free', true);
    fetch(
      `https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F${vimeoId}&id=${vimeoId}`
    )
      .then((response) => response.json())
      .then((data) => {
        videoPlayer.shadowRoot.querySelector('.vid').innerHTML = data.html;
      })
      // eslint-disable-next-line no-console
      .catch(console.error);
  }
});

mutationObserver.observe(document, { childList: true, subtree: true });
