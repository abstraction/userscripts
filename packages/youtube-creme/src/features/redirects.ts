import type { DeclutterSettings } from '../config/settings';
import { Logger } from '../utils/logger';
import { registerUrlChangeCallback } from '../utils/observer';

export function setupRedirects(settings: DeclutterSettings) {
  if (!settings.enabled || settings.redirectHomepageTo === 'none') {
    return;
  }

  const checkRedirect = () => {
    if (window.location.pathname === '/') {
      const target = settings.redirectHomepageTo;
      let path = '/';
      
      if (target === 'subscriptions') path = '/feed/subscriptions';
      else if (target === 'library') path = '/feed/library';
      else if (target === 'watch_later') path = '/playlist?list=WL';

      if (path !== '/') {
        Logger.info(`[Redirect] Redirecting homepage to ${path}`);
        window.location.replace(path);
      }
    }
  };

  // Check immediately on load
  checkRedirect();

  // Also hook into our robust URL tracker
  registerUrlChangeCallback(checkRedirect);
  window.addEventListener('yt-navigate-start', checkRedirect);
}
