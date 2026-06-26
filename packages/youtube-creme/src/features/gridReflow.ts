import type { DeclutterSettings } from '../config/settings';
import { Logger } from '../utils/logger';

let gridObserver: MutationObserver | null = null;
let timeoutId: number | null = null;

export function initGridReflow(settings: DeclutterSettings) {
  if (!settings.enabled || !settings.fixGridGaps) return;

  if (gridObserver) return;

  Logger.info('[GridReflow] Starting Grid Reflow Observer');

  gridObserver = new MutationObserver((mutations) => {
    // Only care about the homepage / watch pages where rich grids exist
    if (window.location.pathname !== '/' && window.location.pathname !== '/watch') return;

    // Debounce the recalculation to avoid layout thrashing during massive DOM inserts
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      recalculateGrid();
      timeoutId = null;
    }, 100);
  });

  // Observe the main content area
  gridObserver.observe(document.body, { childList: true, subtree: true });
}

function recalculateGrid() {
  const rows = document.querySelectorAll('ytd-rich-grid-row');
  
  rows.forEach((row) => {
    const items = Array.from(row.querySelectorAll('ytd-rich-item-renderer')) as HTMLElement[];
    if (items.length === 0) return;

    let visibleCount = 0;

    for (const item of items) {
      // Check if it's explicitly hidden by our data attribute
      if (item.hasAttribute('data-yte-hidden-by-us')) {
        continue;
      }

      // Check if it's hidden by our CSS rules (computed style)
      // This is slightly expensive, but debouncing mitigates it
      const style = window.getComputedStyle(item);
      if (style.display === 'none') {
        continue;
      }

      visibleCount++;
    }

    // Force YouTube's internal math to expand the items
    if (visibleCount > 0) {
      row.style.display = ''; // Ensure the row is visible
      row.style.setProperty('--ytd-rich-grid-items-per-row', visibleCount.toString(), 'important');
    } else {
      // If the row is completely empty of visible items, hide the whole row to prevent vertical gaps
      row.style.display = 'none';
    }
  });
}
