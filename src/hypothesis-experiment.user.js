// ==UserScript==
// @name         Hypothesis Annotation Tool
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Load Hypothesis annotation tool on supported pages
// @author       Your Name
// @match        *://*/*
// @grant        GM_addElement
// @sandbox      JavaScript
// ==/UserScript==

/**
 * EXPERIMENT -
 * Port of Hypothesis' embed.js to a userscript. For more, read `add-hypothesis.user.js`
 */

(function () {
  'use strict';

  var resourcesWithCacheBusting = {
    'scripts/annotator.bundle.js': 'scripts/annotator.bundle.js?508d46',
    'styles/annotator.css': 'styles/annotator.css?46da94',
    'styles/annotator.css.map': 'styles/annotator.css.map?b9addc',
    'styles/highlights.css': 'styles/highlights.css?6b4ebd',
    'styles/highlights.css.map': 'styles/highlights.css.map?241350',
    'styles/katex.min.css': 'styles/katex.min.css?cf6da0',
    'styles/katex.min.css.map': 'styles/katex.min.css.map?8b4c15',
    'styles/pdfjs-overrides.css': 'styles/pdfjs-overrides.css?c95edf',
    'styles/pdfjs-overrides.css.map': 'styles/pdfjs-overrides.css.map?1d8ac6',
    'styles/sidebar.css': 'styles/sidebar.css?83c466',
    'styles/sidebar.css.map': 'styles/sidebar.css.map?d811d1',
    'styles/ui-playground.css.map': 'styles/ui-playground.css.map?7b5350',
    'styles/ui-playground.css': 'styles/ui-playground.css?b7fb6a',
    'scripts/annotator.bundle.js.map': 'scripts/annotator.bundle.js.map?ef5eda',
    'scripts/sidebar.bundle.js': 'scripts/sidebar.bundle.js?5689e9',
    'scripts/ui-playground.bundle.js': 'scripts/ui-playground.bundle.js?7abd21',
    'scripts/ui-playground.bundle.js.map':
      'scripts/ui-playground.bundle.js.map?15c431',
    'scripts/sidebar.bundle.js.map': 'scripts/sidebar.bundle.js.map?3942bc'
  };

  function setDataHypothesisAssetAttribute(element) {
    element.setAttribute('data-hypothesis-asset', '');
  }

  /* function appendStylesheet(document, url) {
    var linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.type = 'text/css';
    linkElement.href = url;
    setDataHypothesisAssetAttribute(linkElement);
    document.head.appendChild(linkElement);
  } */

  function appendStylesheet(document, url) {
    GM_addElement('link', {
      href: url,
      rel: 'stylesheet',
      type: 'text/css',
      'data-hypothesis-asset': ''
    });
  }

  /*   function appendScript(document, url, options = {}) {
    var esModule = options.esModule || false;
    var forceReload = options.forceReload || false;
    var scriptElement = document.createElement('script');
    scriptElement.type = esModule ? 'module' : 'text/javascript';
    scriptElement.src = forceReload ? url + '#ts=' + Date.now() : url;
    scriptElement.async = false;
    setDataHypothesisAssetAttribute(scriptElement);
    document.head.appendChild(scriptElement);
  } */

  function appendScript(document, url, options = {}) {
    var esModule = options.esModule || false;
    var forceReload = options.forceReload || false;

    GM_addElement('script', {
      type: esModule ? 'module' : 'text/javascript',
      src: forceReload ? url + '#ts=' + Date.now() : url,
      async: false,
      'data-hypothesis-asset': ''
    });
  }

  /*   function appendResourceLink(document, rel, type, url) {
    var linkElement = document.createElement('link');
    linkElement.rel = rel;
    linkElement.href = url;
    linkElement.type = 'application/annotator+' + type;
    setDataHypothesisAssetAttribute(linkElement);
    document.head.appendChild(linkElement);
  } */

  function appendResourceLink(document, rel, type, url) {
    GM_addElement('link', {
      rel: rel,
      href: url,
      type: 'application/annotator+' + type,
      'data-hypothesis-asset': ''
    });
  }

  /*   function preloadResource(document, resourceType, url) {
    var linkElement = document.createElement('link');
    linkElement.rel = 'preload';
    linkElement.as = resourceType;
    linkElement.href = url;
    if (resourceType === 'fetch') {
      linkElement.crossOrigin = 'anonymous';
    }
    setDataHypothesisAssetAttribute(linkElement);
    document.head.appendChild(linkElement);
  } */

  function preloadResource(document, resourceType, url) {
    if (resourceType === 'fetch') {
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin
      // cross-origin="" is different from when there is none at all
      GM_addElement('link', {
        rel: 'preload',
        as: resourceType,
        href: url,
        'cross-origin': 'anonymous',
        'data-hypothesis-asset': ''
      });
    } else {
      GM_addElement('link', {
        rel: 'preload',
        as: resourceType,
        href: url,
        'data-hypothesis-asset': ''
      });
    }
  }

  function getAssetPath(config, assetKey) {
    return config.assetRoot + 'build/' + resourcesWithCacheBusting[assetKey];
  }

  function processUrlTemplate(urlTemplate, defaultDocument = document) {
    if (!urlTemplate.includes('{')) return urlTemplate;
    var scriptElement = defaultDocument.currentScript;
    if (!scriptElement) {
      throw new Error('Cannot process URL template: script origin is unknown.');
    }
    var scriptSrc = scriptElement.src;
    var urlMatch = scriptSrc.match(/(https?):\/\/([^:/]+)/);
    if (!urlMatch) {
      throw new Error('Cannot process URL template: script origin is unknown.');
    }
    var protocol = urlMatch[1];
    var hostname = urlMatch[2];
    return urlTemplate
      .replace('{current_host}', hostname)
      .replace('{current_scheme}', protocol);
  }

  function areFeaturesSupported() {
    var featureTests = [
      function () {
        return Object.fromEntries([]);
      },
      function () {
        return new URL(document.location.href);
      },
      function () {
        return new Request('https://hypothes.is');
      },
      function () {
        return Element.prototype.attachShadow;
      },
      function () {
        return CSS.supports('display: grid');
      },
      function () {
        document.evaluate(
          '/html/body',
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        );
        return true;
      }
    ];
    try {
      return featureTests.every(function (test) {
        return test();
      });
    } catch (error) {
      return false;
    }
  }

  if (areFeaturesSupported()) {
    var settingsFromScripts = (function (document) {
      var settings = {};
      var configScriptElements = document.querySelectorAll(
        'script.js-hypothesis-config'
      );
      configScriptElements.forEach(function (element) {
        try {
          var parsedSettings = JSON.parse(element.textContent || '{}');
          Object.assign(settings, parsedSettings);
        } catch (error) {
          console.warn(
            'Error parsing settings from js-hypothesis-config tags:',
            error
          );
        }
      });
      return settings;
    })(document);

    var cdnBasePath = processUrlTemplate(
      settingsFromScripts.assetRoot ||
        'https://cdn.hypothes.is/hypothesis/1.1489.0/'
    );
    if (document.querySelector('hypothesis-app')) {
      (function initializeHypothesisApp(document, config) {
        preloadResource(document, 'fetch', config.apiUrl);
        preloadResource(document, 'fetch', config.apiUrl + 'links');
        var scriptAssets = ['scripts/sidebar.bundle.js'];
        scriptAssets.forEach(function (script) {
          appendScript(document, getAssetPath(config, script), {
            esModule: true
          });
        });
        var cssAssets = ['styles/katex.min.css', 'styles/sidebar.css'];
        cssAssets.forEach(function (css) {
          appendStylesheet(document, getAssetPath(config, css));
        });
      })(document, {
        assetRoot: cdnBasePath,
        manifest: resourcesWithCacheBusting,
        apiUrl: settingsFromScripts.apiUrl
      });
    } else {
      (function handleNoHypothesisApp(document) {
        var chromeExtensionId = (function getChromeExtensionId() {
          var chromeRuntime = (window.chrome || {}).runtime;
          return chromeRuntime ? chromeRuntime.id : undefined;
        })();
        if (
          chromeExtensionId &&
          !document.querySelector(
            `script.js-hypothesis-config[data-extension-id="${chromeExtensionId}"]`
          )
        ) {
          throw new Error(
            'Could not start Hypothesis extension as configuration is missing'
          );
        }
        var configUrls = {
          notebookAppUrl: processUrlTemplate(
            settingsFromScripts.notebookAppUrl || 'https://hypothes.is/notebook'
          ),
          profileAppUrl: processUrlTemplate(
            settingsFromScripts.profileAppUrl ||
              'https://hypothes.is/user-profile'
          ),
          sidebarAppUrl: processUrlTemplate(
            settingsFromScripts.sidebarAppUrl || 'https://hypothes.is/app.html'
          )
        };
        if (
          !document.querySelector('link[type="application/annotator+html"]')
        ) {
          appendResourceLink(
            document,
            'sidebar',
            'html',
            configUrls.sidebarAppUrl
          );
          appendResourceLink(
            document,
            'notebook',
            'html',
            configUrls.notebookAppUrl
          );
          appendResourceLink(
            document,
            'profile',
            'html',
            configUrls.profileAppUrl
          );
          preloadResource(
            document,
            'style',
            getAssetPath(
              { assetRoot: cdnBasePath, manifest: resourcesWithCacheBusting },
              'styles/annotator.css'
            )
          );
          appendResourceLink(
            document,
            'hypothesis-client',
            'javascript',
            cdnBasePath + 'build/boot.js'
          );
          var additionalScripts = ['scripts/annotator.bundle.js'];
          additionalScripts.forEach(function (script) {
            appendScript(
              document,
              getAssetPath(
                { assetRoot: cdnBasePath, manifest: resourcesWithCacheBusting },
                script
              ),
              { esModule: false }
            );
          });
          var pdfAndHighlightStyles = [];
          if (window.PDFViewerApplication) {
            pdfAndHighlightStyles.push('styles/pdfjs-overrides.css');
          }
          pdfAndHighlightStyles.push('styles/highlights.css');
          pdfAndHighlightStyles.forEach(function (style) {
            appendStylesheet(
              document,
              getAssetPath(
                { assetRoot: cdnBasePath, manifest: resourcesWithCacheBusting },
                style
              )
            );
          });
        }
      })(document);
    }
  }

  customEyeballedInjections();
})();
