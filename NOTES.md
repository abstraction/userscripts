# Developer Insights & Notes

This document contains high-signal, crisp insights, tricks, and architectural knowledge gathered during the development of our userscripts. 

## YouTube Architecture (Polymer & SPA)

### Virtual DOM & Lazy Loading
*   **Virtual Scrolling**: YouTube's homepage grid does not spawn new `<ytd-thumbnail>` DOM nodes infinitely as you scroll. It recycles nodes that have scrolled off-screen by hot-swapping their `src` (image) and `href` (link) attributes.
*   **Trick**: When attaching `MutationObserver`s to detect new videos, **you must listen to attribute mutations** (`attributeFilter: ["src", "href"]`). If you only listen for `childList` additions, you will entirely miss lazy-loaded content.

### Masthead Injection (The Top Bar)
*   **Polymer Wipes vs Layout**: The `#buttons` container inside `#end` of the `<ytd-masthead>` is frequently re-rendered. Initially, you might try to inject *outside* of it (e.g. `insertBefore` on `#end`), but YouTube's flex layout often visually hides or misaligns elements outside the expected container.
*   **Trick**: You **must** inject directly into `#buttons` (e.g. using `prepend`). Since Polymer will wipe it occasionally, you must keep a `MutationObserver` permanently running on the DOM. When `#buttons` re-renders and your button disappears, the observer will instantly re-inject it before the user notices.
*   **Polymer Custom Elements**: Do not attempt to manually create and inject YouTube's custom tags like `<yt-icon-button>` or `<yt-interaction>`. Without Polymer's internal framework initializing them, these web components often fail to expand and silently collapse to 0x0 pixels, rendering them invisible.
*   **Trick**: Always inject standard HTML nodes (`<div>`, `<button>`, `<svg>`) and manually apply inline CSS (`width`, `height`, `border-radius`, `fill: currentColor`) to perfectly mimic the native UI rather than relying on their internal tags.

### CSS Grid Reflows (The Flex-Reflow Hack)
*   **The Issue**: YouTube calculates grid sizes using an inline CSS variable (`--ytd-rich-grid-items-per-row`) attached directly to each `ytd-rich-grid-row`. If a userscript hides an item (e.g., a Short) using `display: none`, the remaining videos do not expand. The row math breaks, leaving massive white gaps.
*   **Trick**: You must manually calculate how many items are *actually* visible (ignoring those with `display: none` or custom hidden attributes), and forcibly overwrite the CSS variable on the parent row: `row.style.setProperty('--ytd-rich-grid-items-per-row', visibleCount.toString(), 'important');`. If `visibleCount` hits `0`, hide the entire row to prevent vertical whitespace buildup.

### The New ViewModel Architecture & SPA Navigation
*   **The Issue**: YouTube is actively rolling out a new highly obfuscated "ViewModel" DOM structure (e.g. `<yt-thumbnail-view-model>`, `shortsLockupViewModelHost`). Scripts relying on legacy tags like `<ytd-rich-shelf-renderer[is-shorts]>` or `<ytd-thumbnail-overlay-time-status-renderer>` will silently fail to apply CSS to these new elements.
*   **Trick**: To target containers robustly regardless of the architecture, rely on the underlying functional links. Use CSS selectors like `ytd-rich-section-renderer:has(a[href^="/shorts/"])` to target entire shelves, and `ytd-rich-item-renderer:has(a[href^="/shorts/"])` for individual lockups. This ignores the volatile DOM tags and tracks the stable URL structure instead.
*   **SPA Navigation Issue**: YouTube's Single Page Application router often swaps massive DOM branches without preserving legacy attributes like `page-subtype="home"`. Hardcoded CSS selectors targeting these attributes will break the moment the user clicks the YouTube logo to return to the homepage. Furthermore, YouTube's own custom events (`yt-navigate-start`, `yt-navigate-finish`) are highly flaky and often fail to fire on certain interactions like logo clicks.
*   **Trick**: Do not rely on YouTube's custom navigation events. Instead, track `window.location.pathname` manually inside your primary `MutationObserver` (which runs continuously). Whenever the pathname changes, set a custom attribute directly on `document.documentElement` (e.g., `data-yte-is-homepage="true"`). You can then use this bulletproof custom attribute in your CSS (`html[data-yte-is-homepage="true"] ytd-page-manager > ytd-browse { display: none !important; }`) to reliably hide elements based on the actual router state.

### Userscript Race Conditions (`document.head` availability)
*   **The Issue**: Even if a Userscript manager is instructed to run at `document-end` (or if handled by Vite's build tools), aggressive single-page applications or slow document loads can trigger the script before `document.head` or `document.body` is fully instantiated by the browser parser. Calling `document.head.appendChild(...)` or `observer.observe(document.body)` immediately will throw an unhandled exception, permanently halting script execution and breaking the entire extension silently.
*   **Trick**: Always wrap the entirety of your main initializers inside a strict DOM availability check. If `document.body && document.head` aren't ready, fallback to attaching your initialization sequence to the `DOMContentLoaded` event listener. Never assume the DOM roots exist synchronously on the first tick.

### Short-Circuiting Performance
*   **Trick**: If your script does expensive work on videos (e.g., fetching API data, heavy DOM parsing), establish a "Declutter" or "Hidden" check *before* the expensive work begins. If the video belongs to a hidden category (like Shorts or Mixes), flag it with a data attribute (e.g., `data-hidden-by-us="true"`) and `return` immediately. This completely bypasses the expensive logic for elements the user will never see, drastically improving performance.
