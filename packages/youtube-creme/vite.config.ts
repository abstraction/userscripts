import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/main.tsx',
      userscript: {
        name: 'youtube-creme',
        namespace: 'https://github.com/abstraction/userscripts',
        description: 'youtube-creme',
        author: 'abstraction',
        match: ['*://*.youtube.com/*', '*://*.youtubekids.com/*'],
        exclude: ['*://music.youtube.com/*', '*://studio.youtube.com/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=youtube.com',
        homepageURL: 'https://github.com/abstraction/userscripts',
        supportURL: 'https://github.com/abstraction/userscripts/issues',
        updateURL: 'https://raw.githubusercontent.com/abstraction/userscripts/master/packages/youtube-creme/dist/youtube-creme.user.js',
        downloadURL: 'https://raw.githubusercontent.com/abstraction/userscripts/master/packages/youtube-creme/dist/youtube-creme.user.js',
        connect: ['returnyoutubedislikeapi.com'],
        grant: ['GM_getValue', 'GM_setValue', 'GM_registerMenuCommand', 'GM_xmlhttpRequest'],
        'run-at': 'document-end',
      },
    }),
  ],
});
