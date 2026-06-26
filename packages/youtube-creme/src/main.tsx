import React from 'react';
import { createRoot } from 'react-dom/client';
import { GM_registerMenuCommand } from 'vite-plugin-monkey/dist/client';
import { loadSettings } from './config/settings';
import { initObserver, registerDomMutationCallback } from './utils/observer';
import { applyStyles, applyColorSettings } from './ui/styles';
import { SELECTORS } from './config/selectors';
import { getVideoData } from './api/dislikeApi';
import { findVideoContainer } from './utils/dom';

// Feature modules
import * as RatingBarModule from './features/ratingBar';
import * as VideoFilterModule from './features/videoFilter';
import * as DurationFilterModule from './features/durationFilter';
import * as SeenVideosModule from './features/seenVideos';
import * as DeclutterModule from './features/declutter';
import { setupRedirects } from './features/redirects';
import { initPlayerTweaks } from './features/playerTweaks';
import { initCommentFilter } from './features/commentFilter';
import { initGridReflow } from './features/gridReflow';

import { SettingsMenu } from './ui/SettingsMenu';
import { initMastheadButton } from './ui/masthead';
import { Logger } from './utils/logger';

const settings = loadSettings();

async function processThumbnail(thumbnailElement: HTMLElement, thumbnailUrl: string, passedVideoId?: string) {
  if (thumbnailElement.closest("snackbar-container, ytd-expandable-metadata-renderer, ytd-macro-markers-list-item-renderer, yt-player-storyboard")) {
    return;
  }

  const splitUrl = thumbnailUrl.split("/");
  const extractedVideoId = splitUrl[4];
  const videoId = passedVideoId || extractedVideoId;
  if (!videoId) return;

  const prevVideoId = thumbnailElement.getAttribute("data-yte-video-id");
  if (prevVideoId) {
    if (prevVideoId === videoId) return;
    Logger.debug(`Video ID changed for thumbnail: ${prevVideoId} -> ${videoId}`);
    if (settings.ratingBar.enabled && settings.ratingBar.height !== 0) {
      RatingBarModule.removeBar(thumbnailElement);
    }
    if (settings.ratingBar.enabled && settings.ratingBar.showStatsText) {
      RatingBarModule.removePercentage(thumbnailElement);
    }
  }

  thumbnailElement.setAttribute("data-yte-video-id", videoId);
  Logger.debug(`Processing thumbnail for video: ${videoId}`);

  const videoData = await getVideoData(videoId);
  if (!videoData) {
    thumbnailElement.removeAttribute("data-yte-video-id");
    return;
  }

  const container = findVideoContainer(thumbnailElement);
  if (container && settings.videoFilter.enabled) {
    if (VideoFilterModule.applyFilter(container, videoData, settings.videoFilter)) {
      return;
    }
    VideoFilterModule.applyViewsFilter(container, settings.videoFilter);
  }

  if (settings.ratingBar.enabled && settings.ratingBar.height !== 0) {
    RatingBarModule.addBar(thumbnailElement, videoData, settings.ratingBar);
  }

  const creatorDisabledLikes = videoData.likes === 0 && videoData.dislikes >= 10;
  if (settings.ratingBar.enabled && settings.ratingBar.showStatsText && videoData.rating != null && !creatorDisabledLikes) {
    RatingBarModule.addPercentage(thumbnailElement, videoData);
  }
}

function processNewThumbnails() {
    // Process thumbnails for rating bar and video filter
    const thumbnails = document.querySelectorAll(SELECTORS.thumbnails);
    Logger.debug(`[Main] Found ${thumbnails.length} potential thumbnail elements to process`);
    
    thumbnails.forEach((thumbnailElement) => {
      // Find the video ID directly from the element or its parent
      let videoId: string | null = null;
      
      // Short-circuit decluttered videos
      if (settings.declutter && DeclutterModule.isThumbnailHiddenByDeclutter(thumbnailElement, settings.declutter)) {
        if (!thumbnailElement.hasAttribute('data-yte-hidden-by-us')) {
          thumbnailElement.setAttribute('data-yte-hidden-by-us', 'true');
          Logger.debug(`[Main] Skipping hidden thumbnail`, thumbnailElement);
        }
        return;
      } else if (thumbnailElement.hasAttribute('data-yte-hidden-by-us')) {
        thumbnailElement.removeAttribute('data-yte-hidden-by-us');
      }

      // 1. Check data attribute
      videoId = thumbnailElement.getAttribute("data-yte-video-id");
      
      // 2. Check closest link
      if (!videoId) {
        const link = thumbnailElement.closest('a[href*="/watch?v="], a[href*="/shorts/"]');
        if (link) {
          const href = link.getAttribute("href");
          if (href) {
            const watchMatch = href.match(/[?&]v=([^&]+)/);
            if (watchMatch) videoId = watchMatch[1];
            const shortsMatch = href.match(/\/shorts\/([^/?]+)/);
            if (shortsMatch) videoId = shortsMatch[1];
          }
        }
      }
      
      // 3. Check for vi/ URL in image
      if (!videoId) {
        const img = thumbnailElement.querySelector("img");
        const src = img?.src || img?.getAttribute("src");
        if (src && src.includes("/vi/")) {
          const match = src.match(/\/vi\/([^\/]+)\//);
          if (match) videoId = match[1];
        }
      }

      if (videoId) {
        processThumbnail(thumbnailElement as HTMLElement, `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, videoId);
      } else {
        Logger.debug(`[Main] Skipping thumbnail element: no video ID found`, thumbnailElement);
      }
    });
}

function openSettings() {
  const host = document.createElement('div');
  host.id = 'yte-settings-root';
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(
    <SettingsMenu initialSettings={settings} onClose={() => {
      root.unmount();
      host.remove();
    }} />
  );
}

function main() {
  const init = () => {
    // 1. Setup styles
    Logger.info("Initializing styles and color settings");
    applyColorSettings(settings);
    applyStyles(settings);
    if (settings.declutter) {
      DeclutterModule.applyDeclutterStyles(settings.declutter);
      setupRedirects(settings.declutter);
      initPlayerTweaks(settings.declutter);
      initCommentFilter(settings.declutter);
      initGridReflow(settings.declutter);
    }

    // 2. Register callbacks
    Logger.info("Registering feature modules");
    registerDomMutationCallback(() => {
      if (settings.videoFilter.enabled) {
        VideoFilterModule.processViewsFilter(settings.videoFilter);
      }
      
      const needsApiData = (settings.ratingBar.enabled && (settings.ratingBar.height !== 0 || settings.ratingBar.showStatsText)) || 
                           (settings.videoFilter.enabled && settings.videoFilter.minRatingPercent > 0);
      if (needsApiData) {
        processNewThumbnails();
      }
      if (settings.durationFilter.enabled) {
        DurationFilterModule.processDurationFilter(settings.durationFilter);
      }
      if (settings.seenVideos.enabled) {
        SeenVideosModule.processSeenVideos(settings.seenVideos);
      }
      
      // Clean up empty shelves
      const shelves = document.querySelectorAll<HTMLElement>(SELECTORS.shelves);
      for (const shelf of shelves) {
        const visibleVideos = shelf.querySelectorAll(SELECTORS.visibleVideosInShelf);
        if (visibleVideos.length === 0) {
          shelf.style.display = "none";
        }
      }
    });

    // 3. Start Observer
    initObserver();

    // 4. Hook up Settings Menu
    GM_registerMenuCommand("Settings...", openSettings);

    // 5. Inject settings button into YouTube masthead
    initMastheadButton(openSettings);
  };

  if (document.body && document.head) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
}

main();
