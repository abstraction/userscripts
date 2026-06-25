# Userscripts

This repository serves as my personal archive for userscripts. Userscripts are JavaScript programs designed to modify web pages. They run in web browsers through a userscript manager (e.g., [Tampermonkey](https://www.tampermonkey.net/)).

It is structured as a monorepo collection to enhance various websites and web applications.

## Directory Structure

This repository follows a strict organizational structure depending on the complexity of the script.

### `src/` (Vanilla Scripts)

Contains simple, single-file userscripts built with vanilla JavaScript. These scripts manipulate the DOM directly and do not require build tools or external UI libraries.

**Notable Scripts:**

- [Reddit Tweaks](src/reddit-tweaks.user.js)
- [Hacker News Tweaks](src/hacker-news-tweaks.user.js)
- [Wikipedia Enhancements](src/wikipedia.user.js)
- [Add Hypothesis](src/add-hypothesis.user.js)

To install any of these, simply click on the `.user.js` file and view the raw file to trigger your userscript manager.

### `packages/` (Modern Packages)

Contains complex, modern userscripts built using Vite, TypeScript, and UI frameworks like React. These scripts offer advanced state management, dynamic settings UIs, and robust architectures.

**Notable Packages:**

- [**YouTube Creme**](packages/youtube-creme/README.md) - A highly-optimized, modern userscript that injects an exponentially scaled like/dislike rating bar directly into YouTube video thumbnails and provides powerful content filtering.

## Installation

To use these scripts, you must first install a userscript manager extension for your browser:

- [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
- [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

## Development Guidelines

If you are contributing or modifying scripts in this repository, please review the workspace conventions in the `.agents/AGENTS.md` file.

### Building Packages

Scripts in the `packages/` directory must be built before they can be used. For example:

```bash
cd packages/youtube-creme
pnpm install
pnpm run build
```

The distributable file will be generated in the respective package's `dist/` directory.
