# YouTube Creme

A highly-optimized, modern userscript that enhances the YouTube browsing experience. Built with Vite, TypeScript, and React, it injects an exponentially scaled like/dislike rating bar directly into video thumbnails and offers powerful content filtering capabilities.

## Features

- **Exponential Rating Bar**: Displays a visual indicator of a video's like-to-dislike ratio under thumbnails. The exponential scaling algorithm (`rating^power`) visually penalizes clickbait by making imperfect ratios (e.g., 90%) significantly more obvious.
- **Return YouTube Dislike API Integration**: Seamlessly fetches accurate, crowdsourced dislike statistics.
- **High-Performance Caching**: Uses a robust asynchronous IndexedDB cache to store API responses, preventing UI stutters and API rate limits. Cache duration is fully configurable.
- **Video Filtering Engine**: Automatically hides or dims videos based on custom thresholds (e.g., minimum views, minimum rating percentage).
- **Duration & Content Filtering**: Filter out YouTube Shorts, live streams, or videos above/below specific duration limits.
- **Seen Videos Tracking**: Automatically dims or hides videos you have already watched.
- **React UI Settings Menu**: A clean, injected settings panel to configure custom selectors, colors, filters, and caching behavior dynamically.

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click the following link to install the script:
   [Install YouTube Creme](https://raw.githubusercontent.com/abstraction/userscripts/master/packages/youtube-creme/dist/youtube-creme.user.js)

## Development

This script is developed as a modern package within the monorepo.

### Prerequisites

- Node.js
- pnpm

### Build Instructions

1. Navigate to the package directory:
   ```bash
   cd packages/youtube-creme
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server (auto-injects into the browser via Vite Monkey Plugin):
   ```bash
   pnpm run dev
   ```
4. Build the production userscript artifact:
   ```bash
   pnpm run build
   ```
   _The compiled artifact will be generated at `dist/youtube-creme.user.js`._
