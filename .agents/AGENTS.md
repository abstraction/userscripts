# Userscripts Monorepo Guidelines

Welcome to the Userscripts monorepo! This workspace has specific conventions for developing simple and complex userscripts.

## Directory Structure

*   **`src/`**: Plain JavaScript (Vanilla) userscripts.
*   **`packages/`**: Complex modern userscripts built with Vite, TypeScript, and UI frameworks like React.
*   **`external/`**: Third-party scripts maintained as-is.

## Rules for Creating New Scripts

When tasked with creating a new userscript, you must decide whether it should be a **Vanilla** script or a **Modern Package**:

### 1. Vanilla Scripts (`src/`)
Use vanilla JavaScript when the script is:
*   Simple and single-file.
*   Primarily manipulating the DOM directly without complex state.
*   Doesn't require external UI libraries or dependencies.

**Workflow:**
*   Create the file directly in the `src/` directory.
*   Copy the metadata header from `.meta.user.js` and populate the tags.
*   Ensure `@updateURL` and `@downloadURL` use the raw endpoint: `https://raw.githubusercontent.com/abstraction/userscripts/master/src/<script-name>.user.js`.

### 2. Modern Packages (`packages/`)
Use the modern approach (Vite + TypeScript + React/Preact/Vue) when the script is:
*   Complex, with many components or state management.
*   Injecting non-trivial UI into the page.
*   Benefiting significantly from TypeScript's type safety against DOM APIs.

**Workflow:**
*   Navigate to the `packages/` directory.
*   Scaffold the project using the standard Vite react-swc-ts template:
    `pnpm create vite@latest <package-name> --template react-swc-ts`
*   Install `vite-plugin-monkey` to automatically generate userscript metadata and bundle the output:
    `pnpm add -D vite-plugin-monkey`
*   Configure `vite.config.ts` to include the monkey plugin with appropriate metadata (namespace, match URLs, icon, etc.).
*   Build the project into a single `dist/` file. Do **not** copy compiled bundles into the `src/` directory.
*   Ensure `@updateURL` and `@downloadURL` point to the package's dist folder: `https://raw.githubusercontent.com/abstraction/userscripts/master/packages/<package-name>/dist/<package-name>.user.js`.

## Script Development Standards
*   **Maintainability**: Document all major DOM modifications or complex logic with comments.
*   **Performance**: Avoid heavy polling (e.g. `setInterval`). Use `MutationObserver`. 
*   **Caching**: Never use `GM_setValue` for large, frequently updated datasets (e.g. API caches) as JSON stringification blocks the main thread. Use asynchronous `IndexedDB`.
*   **Security & CSP**: Do not use `.innerHTML`. Modern sites (e.g. YouTube) use strict Trusted Types CSP which blocks strings. Always use standard DOM APIs (`document.createElement`, `textContent`).
