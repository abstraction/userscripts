import type { DeclutterSettings } from '../config/settings';

let commentsObserver: MutationObserver | null = null;

export function initCommentFilter(settings: DeclutterSettings) {
  if (!settings.enabled || !settings.timestampCommentsOnly) return;

  if (!commentsObserver) {
    commentsObserver = new MutationObserver((mutations) => {
      if (window.location.pathname !== '/watch') return;
      
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // Find any comment threads added
            const threads = node.tagName === 'YTD-COMMENT-THREAD-RENDERER' 
              ? [node] 
              : Array.from(node.querySelectorAll('ytd-comment-thread-renderer'));
            
            for (const thread of threads) {
              checkCommentForTimestamp(thread);
            }
          }
        }
      }
    });

    commentsObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Also inject a small CSS rule for the hidden comments
  let styleEl = document.getElementById('yte-comment-filter-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'yte-comment-filter-styles';
    styleEl.textContent = `ytd-comment-thread-renderer[data-yte-hidden-comment="true"] { display: none !important; }`;
    document.head.appendChild(styleEl);
  }
}

function checkCommentForTimestamp(thread: HTMLElement) {
  if (thread.hasAttribute('data-yte-hidden-comment')) return;

  // The actual text content is usually inside a ytd-expander
  const expander = thread.querySelector('ytd-expander');
  if (!expander) return;

  // Timestamps are rendered as links with &t= inside
  const timestampLinks = expander.querySelectorAll('a[href*="&t="]');
  
  if (timestampLinks.length === 0) {
    // No timestamp found, hide the comment
    thread.setAttribute('data-yte-hidden-comment', 'true');
  }
}
