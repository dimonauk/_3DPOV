/* Holo-Flow card embed loader — drop-in script tag for auto-resizing iframes.
 *
 * Usage:
 *   <script async src="https://holoflow.co.uk/embed.js" data-card="<slug>"></script>
 *   <div data-holoflow-card="<slug>"></div>
 *
 * Or with explicit options:
 *   <div data-holoflow-card="<slug>" data-height="640" data-width="100%"></div>
 *
 * Finds every <div data-holoflow-card="..."> on the page, replaces its
 * contents with an iframe pointing to /c/<slug>/embed, and listens for
 * postMessage height broadcasts from the iframe to auto-resize.
 *
 * No dependencies, no IIFE leakage, vanilla DOM.
 */
(function () {
  "use strict";
  // Find our own script tag so we can read data-card / data-height defaults
  // from it as fallbacks when individual divs don't specify them.
  var scripts = document.querySelectorAll(
    'script[src*="embed.js"][data-card]',
  );
  var scriptDefaults = {};
  for (var i = 0; i < scripts.length; i++) {
    var s = scripts[i];
    scriptDefaults[s.getAttribute("data-card")] = {
      height: s.getAttribute("data-height") || "640",
      width: s.getAttribute("data-width") || "100%",
    };
  }

  var origin = (function () {
    var current = document.currentScript;
    if (current && current.src) {
      try {
        return new URL(current.src).origin;
      } catch (e) {
        // fall through
      }
    }
    // Best-effort fallback — assume the script lives on the same origin.
    return "https://holoflow.co.uk";
  })();

  var EXPECTED_ORIGIN = origin;

  function mount(div) {
    if (div.getAttribute("data-holoflow-mounted") === "1") return;
    var slug = div.getAttribute("data-holoflow-card");
    if (!slug) return;
    var defaults = scriptDefaults[slug] || {};
    var height = div.getAttribute("data-height") || defaults.height || "640";
    var width = div.getAttribute("data-width") || defaults.width || "100%";

    var iframe = document.createElement("iframe");
    iframe.src = origin + "/c/" + encodeURIComponent(slug) + "/embed";
    iframe.title = "Holo-Flow card embed";
    iframe.loading = "lazy";
    iframe.setAttribute("allow", "camera; xr-spatial-tracking");
    iframe.style.border = "0";
    iframe.style.borderRadius = "12px";
    iframe.style.width = width;
    iframe.style.height = height + "px";
    iframe.setAttribute("data-holoflow-slug", slug);

    div.innerHTML = "";
    div.appendChild(iframe);
    div.setAttribute("data-holoflow-mounted", "1");
  }

  function mountAll() {
    var divs = document.querySelectorAll("div[data-holoflow-card]");
    for (var i = 0; i < divs.length; i++) mount(divs[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }

  // Re-mount when new <div data-holoflow-card> nodes are added dynamically.
  if (typeof MutationObserver !== "undefined") {
    var mo = new MutationObserver(function () {
      mountAll();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Auto-resize: listen for height broadcasts from any embed iframe.
  window.addEventListener("message", function (e) {
    if (e.origin !== EXPECTED_ORIGIN) return;
    var data = e.data;
    if (!data || data.type !== "holoflow:height") return;
    var slug = data.slug;
    var h = parseInt(data.height, 10);
    if (!slug || !isFinite(h) || h < 100) return;
    var frames = document.querySelectorAll(
      'iframe[data-holoflow-slug="' + slug + '"]',
    );
    for (var i = 0; i < frames.length; i++) {
      frames[i].style.height = h + "px";
    }
  });
})();
