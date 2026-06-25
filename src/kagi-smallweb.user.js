// ==UserScript==
// @name         Kagi Smallweb Enhacements
// @namespace    http://tampermonkey.net/
// @version      2025-04-26
// @description  GitHub-like embedded preview with scrollable rendered GitHub-flavored Markdown README on Kagi SmallWeb pages
// @author       You
// @match        https://kagi.com/smallweb/?gh*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kagi.com
// @grant        none
// ==/UserScript==

(async () => {
    // Load marked.js for GitHub-flavored Markdown rendering
    await loadScript('https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js');

    // Configure marked for GitHub-flavored Markdown
    function configureMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                gfm: true, // GitHub-flavored Markdown
                breaks: true, // Convert \n to <br>
                headerIds: true, // Add IDs to headers
                langPrefix: 'language-', // CSS language prefix for code blocks
                mangle: false, // Don't escape HTML in output
                sanitize: false, // Allow HTML in input
                smartLists: true, // Use smarter list behavior
                smartypants: true, // Use "smart" typographic punctuation
                xhtml: false // Don't close empty tags with />
            });
        }
    }

    // Load highlight.js for code syntax highlighting
    await loadScript('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/highlight.min.js');

    // Load highlight.js CSS with GitHub theme
    const highlightCSS = document.createElement('link');
    highlightCSS.rel = 'stylesheet';
    highlightCSS.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.7.0/build/styles/github.min.css';
    document.head.appendChild(highlightCSS);

    configureMarked();

    // Process GitHub iframe
    const iframe = document.querySelector('iframe[src*="github.com"]');
    if (!iframe) return;

    const url = new URL(iframe.src);
    const [owner, repo] = url.pathname.split('/').slice(1, 3);
    let repoUrl = '';

    try {
        const [repoRes, readmeRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${owner}/${repo}`),
            fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                headers: { Accept: 'application/vnd.github.v3.raw' }
            })
        ]);

        if (!repoRes.ok) {
            console.error(`Failed to fetch repo data: ${repoRes.status}`);
            return;
        }

        const repoData = await repoRes.json();
        repoUrl = repoData.html_url;

        let readmeText = '';
        if (readmeRes.ok) {
            readmeText = await readmeRes.text();
        }

        // Process GitHub-flavored markdown readme
        const readmeHTML = readmeText
            ? marked.parse(readmeText.replace(/^# .*\n/, '')) // Remove H1 title but render the rest
            : '<p>No README available.</p>';

        const preview = document.createElement('div');
        preview.classList.add('gh-preview-card');
        preview.dataset.repoUrl = repoUrl;
        preview.style.cssText = `
            max-width: 700px;
            margin: 2em auto;
            padding: 1.5em 2em;
            border: 1px solid #d0d7de;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            background: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            color: #24292f;
            line-height: 1.6;
            position: relative;
            transition: box-shadow 0.2s ease;
        `;

        preview.innerHTML = `
            <h2 style="margin-top: 0; font-size: 1.5em;">
                <a href="${repoUrl}" target="_blank" style="text-decoration: none; color: #0969da;">
                    ${repoData.full_name}
                </a>
            </h2>
            <p style="color: #57606a;">${repoData.description || 'No description available.'}</p>

            <div style="font-size: 0.9em; margin-bottom: 1em; color: #57606a;">
                <span title="Stars">⭐ ${repoData.stargazers_count.toLocaleString()}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                <span title="Forks">🍴 ${repoData.forks_count.toLocaleString()}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                <span title="Last Updated">📝 ${new Date(repoData.updated_at).toLocaleDateString()}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                <span title="Primary Language">🧠 ${repoData.language || 'N/A'}</span>
            </div>

            ${repoData.topics && repoData.topics.length > 0 ? `
            <div style="margin-bottom: 1em;">
                ${repoData.topics.map(tag => `
                    <span style="
                        display: inline-block;
                        background: #ddf4ff;
                        color: #0969da;
                        border: 1px solid #0969da22;
                        padding: 2px 8px;
                        border-radius: 20px;
                        font-size: 0.75em;
                        margin-right: 6px;
                        margin-bottom: 4px;
                    ">${tag}</span>
                `).join('')}
            </div>` : ''}

            <div style="margin-top: 1em; padding-top: 1em; border-top: 1px solid #d0d7de;">
                <div class="readme-container" style="
                    height: 300px;
                    overflow-y: auto;
                    padding: 16px;
                    border: 1px solid #eaecef;
                    border-radius: 6px;
                    background: #f6f8fa;
                    font-size: 0.85em;
                ">
                    <div class="markdown-body">${readmeHTML}</div>
                </div>
            </div>
        `;

        // Add GitHub-flavored Markdown CSS
        const style = document.createElement('style');
        style.textContent = `
            .markdown-body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #24292f;
            }
            .markdown-body h1, .markdown-body h2, .markdown-body h3,
            .markdown-body h4, .markdown-body h5, .markdown-body h6 {
                margin-top: 24px;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.25;
                border-bottom: 1px solid #eaecef;
                padding-bottom: 0.3em;
            }
            .markdown-body h1 { font-size: 2em; }
            .markdown-body h2 { font-size: 1.5em; }
            .markdown-body h3 { font-size: 1.25em; border-bottom: none; }
            .markdown-body h4 { font-size: 1em; border-bottom: none; }
            .markdown-body h5 { font-size: 0.875em; border-bottom: none; }
            .markdown-body h6 { font-size: 0.85em; color: #57606a; border-bottom: none; }
            .markdown-body a { color: #0969da; text-decoration: none; }
            .markdown-body a:hover { text-decoration: underline; }
            .markdown-body code {
                padding: 0.2em 0.4em;
                margin: 0;
                font-size: 85%;
                background-color: rgba(175, 184, 193, 0.2);
                border-radius: 6px;
                font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
            }
            .markdown-body pre {
                padding: 16px;
                overflow: auto;
                font-size: 85%;
                line-height: 1.45;
                background-color: #f6f8fa;
                border-radius: 6px;
                word-wrap: normal;
            }
            .markdown-body pre code {
                padding: 0;
                margin: 0;
                font-size: 100%;
                word-break: normal;
                white-space: pre;
                background: transparent;
                border: 0;
                overflow: visible;
            }
            .markdown-body blockquote {
                padding: 0 1em;
                color: #57606a;
                border-left: 0.25em solid #d0d7de;
                margin: 0 0 16px 0;
            }
            .markdown-body img {
                max-width: 100%;
                box-sizing: content-box;
                background-color: #ffffff;
                border-style: none;
            }
            .markdown-body table {
                display: block;
                width: 100%;
                overflow: auto;
                border-spacing: 0;
                border-collapse: collapse;
                margin-top: 0;
                margin-bottom: 16px;
            }
            .markdown-body table th, .markdown-body table td {
                padding: 6px 13px;
                border: 1px solid #d0d7de;
            }
            .markdown-body table tr { background-color: #ffffff; border-top: 1px solid #d8dee4; }
            .markdown-body table tr:nth-child(2n) { background-color: #f6f8fa; }
            .markdown-body table th { font-weight: 600; }
            .markdown-body hr {
                height: 0.25em;
                padding: 0;
                margin: 24px 0;
                background-color: #d0d7de;
                border: 0;
            }
            .markdown-body ul, .markdown-body ol {
                padding-left: 2em;
                margin-top: 0;
                margin-bottom: 16px;
            }
            .markdown-body ul ul, .markdown-body ul ol,
            .markdown-body ol ol, .markdown-body ol ul {
                margin-top: 0;
                margin-bottom: 0;
            }
            .markdown-body li {
                word-wrap: break-all;
            }
            .markdown-body li + li {
                margin-top: 0.25em;
            }
            .markdown-body dl {
                padding: 0;
            }
            .markdown-body dl dt {
                padding: 0;
                margin-top: 16px;
                font-size: 1em;
                font-style: italic;
                font-weight: 600;
            }
            .markdown-body dl dd {
                padding: 0 16px;
                margin-bottom: 16px;
            }
            .markdown-body kbd {
                display: inline-block;
                padding: 3px 5px;
                font: 11px SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
                line-height: 10px;
                color: #24292f;
                vertical-align: middle;
                background-color: #f6f8fa;
                border: 1px solid #d0d7de;
                border-radius: 6px;
                box-shadow: inset 0 -1px 0 #d0d7de;
            }
            .markdown-body .task-list-item {
                list-style-type: none;
            }
            .markdown-body .task-list-item-checkbox {
                margin: 0 0.2em 0.25em -1.4em;
                vertical-align: middle;
            }
            .readme-container::-webkit-scrollbar {
                width: 8px;
            }
            .readme-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            .readme-container::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            .readme-container::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        document.head.appendChild(style);

        iframe.replaceWith(preview);

        // Apply syntax highlighting to code blocks
        if (window.hljs) {
            preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    } catch (error) {
        console.error(`Error processing ${owner}/${repo}:`, error);
        // Fallback to simple link if API fails
        const link = document.createElement('a');
        link.href = iframe.src;
        link.textContent = `Open ${owner}/${repo} on GitHub`;
        link.target = '_blank';
        link.style.display = 'block';
        link.style.margin = '1em 0';
        link.style.color = '#0969da';
        iframe.replaceWith(link);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Only process if not in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Enter key: click next button
        if (event.key === 'Enter') {
            const nextButton = document.querySelector('.next-button');
            if (nextButton) {
                nextButton.click();
                event.preventDefault();
            }
        }

        // 'o' key: open GitHub repo in background tab
        else if (event.key === 'o' && repoUrl) {
            window.open(repoUrl, '_blank', 'noopener noreferrer nofollow');
            event.preventDefault();
        }
    });

    // Helper function to load scripts
    async function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
})();