// Progressive enhancements. The site is fully readable without this file.
(function () {
  "use strict";

  var log = {
    error: function (msg, err) { console.error("[blog] " + msg, err || ""); }
  };

  // Section links on headings that kramdown gave an id.
  function addAnchors() {
    document.querySelectorAll(".prose :is(h2, h3, h4)[id]").forEach(function (h) {
      var a = document.createElement("a");
      a.className = "anchor";
      a.href = "#" + h.id;
      a.textContent = "#";
      a.setAttribute("aria-label", "Link to section: " + h.textContent.trim());
      h.prepend(a);
    });
  }

  // Language label and copy button on fenced code blocks.
  function addCodeBars() {
    document.querySelectorAll(".prose div.highlighter-rouge").forEach(function (block) {
      var code = block.querySelector("pre code");
      if (!code) return;

      var bar = document.createElement("div");
      bar.className = "code-bar";

      var match = block.className.match(/\blanguage-([\w+#-]+)/);
      var lang = match ? match[1] : "";
      if (lang && lang !== "plaintext" && lang !== "text") {
        var label = document.createElement("span");
        label.textContent = lang;
        bar.appendChild(label);
      }

      if (navigator.clipboard && window.isSecureContext) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "code-copy";
        button.textContent = "copy";
        button.addEventListener("click", function () {
          navigator.clipboard.writeText(code.innerText.replace(/\n$/, "")).then(
            function () { flash(button, "copied", "done"); },
            function (err) {
              log.error("copy to clipboard failed", err);
              flash(button, "failed", "error");
            }
          );
        });
        bar.appendChild(button);
      }

      if (bar.childNodes.length) block.insertBefore(bar, block.firstChild);
    });
  }

  function flash(button, text, state) {
    button.textContent = text;
    button.dataset.state = state;
    clearTimeout(button._timer);
    button._timer = setTimeout(function () {
      button.textContent = "copy";
      delete button.dataset.state;
    }, 1600);
  }

  // Math, only on pages that loaded KaTeX (front matter `math: true`).
  function renderMath() {
    if (typeof window.renderMathInElement !== "function") return;
    var root = document.querySelector(".prose");
    if (!root) return;
    // kramdown emits display math as a bare text node; give it a block so it
    // takes the text column like every other element.
    Array.prototype.slice.call(root.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        var block = document.createElement("div");
        block.className = "math-block";
        root.insertBefore(block, node);
        block.appendChild(node);
      }
    });
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    } catch (err) {
      log.error("math rendering failed", err);
    }
  }

  // Table of contents. kramdown renders `* TOC {:toc}` as ul#markdown-toc;
  // wrap it in a labelled, collapsible nav. CSS makes it a sticky sidebar on
  // wide screens, where it is always open and marks the section being read.
  var TOC_SIDEBAR = "(min-width: 75rem)"; // keep in sync with main.css

  function buildToc() {
    var list = document.querySelector(".prose > #markdown-toc");
    if (!list) return;

    var sections = [];
    list.querySelectorAll("a[href^='#']").forEach(function (link) {
      var heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (heading) sections.push({ link: link, heading: heading });
      else log.error("TOC entry has no matching heading: " + link.hash);
    });
    if (!sections.length) return;

    var nav = document.createElement("nav");
    nav.className = "toc";
    nav.setAttribute("aria-labelledby", "toc-title");

    var details = document.createElement("details");
    details.className = "toc__details";

    var summary = document.createElement("summary");
    summary.className = "toc__summary";
    var title = document.createElement("span");
    title.id = "toc-title";
    title.textContent = "Contents";
    var count = document.createElement("span");
    count.className = "toc__count";
    count.textContent = sections.length + (sections.length === 1 ? " section" : " sections");
    summary.append(title, count);

    list.parentNode.insertBefore(nav, list);
    list.classList.add("toc__list");
    details.append(summary, list);
    nav.appendChild(details);

    // Span every row after the TOC so the sticky sidebar can travel the whole
    // post. Runs after renderMath, which adds rows of its own.
    var rows = 1;
    for (var el = nav.nextElementSibling; el; el = el.nextElementSibling) rows++;
    nav.style.setProperty("--toc-rows", rows);

    // Open in the sidebar; collapsed in the text column so it doesn't push
    // the post down. The sidebar's heading is a label, not a toggle.
    var sidebar = window.matchMedia(TOC_SIDEBAR);
    function syncLayout() {
      details.open = sidebar.matches;
      summary.tabIndex = sidebar.matches ? -1 : 0;
    }
    syncLayout();
    sidebar.addEventListener("change", syncLayout);
    summary.addEventListener("click", function (event) {
      if (sidebar.matches) event.preventDefault();
    });

    trackSection(nav, sections, sidebar);
  }

  // Mark the section whose heading most recently scrolled past the top of
  // the viewport.
  function trackSection(nav, sections, sidebar) {
    var current = null;
    var pending = false;

    function update() {
      pending = false;
      var root = document.documentElement;
      var line = Math.min(window.innerHeight * 0.25, 120);
      var active = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].heading.getBoundingClientRect().top > line) break;
        active = sections[i];
      }
      // A short final section never reaches the line; finish on it.
      var maxScroll = root.scrollHeight - window.innerHeight;
      if (active && maxScroll > 0 && window.scrollY >= maxScroll - 2) {
        active = sections[sections.length - 1];
      }
      if (active === current) return;

      if (current) current.link.removeAttribute("aria-current");
      current = active;
      if (!active) return;

      active.link.setAttribute("aria-current", "true");

      // Keep the mark visible when the sidebar list is taller than the screen.
      if (sidebar.matches && nav.scrollHeight > nav.clientHeight) {
        var box = nav.getBoundingClientRect();
        var item = active.link.getBoundingClientRect();
        if (item.top < box.top || item.bottom > box.bottom) {
          nav.scrollTop += item.top - box.top - box.height / 2;
        }
      }
    }

    function schedule() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }

  function run(name, fn) {
    try { fn(); } catch (err) { log.error(name + " failed", err); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    run("anchors", addAnchors);
    run("code bars", addCodeBars);
    run("math", renderMath);
    run("table of contents", buildToc);
  });
})();
