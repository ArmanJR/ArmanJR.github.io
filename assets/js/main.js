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

  function run(name, fn) {
    try { fn(); } catch (err) { log.error(name + " failed", err); }
  }

  document.addEventListener("DOMContentLoaded", function () {
    run("anchors", addAnchors);
    run("code bars", addCodeBars);
    run("math", renderMath);
  });
})();
