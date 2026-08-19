/* --------------------------------------------------------------------------
   Contact configuration — set one of these before launch.

   FORM_ENDPOINT  Preferred. A form-to-inbox URL (Formspree, Basin, Netlify
                  Forms, your own handler). The form posts in the background
                  and the visitor never leaves the page.
   CONTACT_EMAIL  Fallback. Opens the visitor's mail client with the message
                  pre-filled, and reveals the direct email line on the contact
                  page. Requires them to have a mail client configured.

   With both blank the form validates but cannot deliver, and says so.
   -------------------------------------------------------------------------- */
var FORM_ENDPOINT = "https://api.web3forms.com/submit";
var CONTACT_EMAIL = "";

(function () {
  "use strict";

  // The head marks that JavaScript is available so the preloader can appear.
  // This second marker means the main behavior script itself loaded, allowing
  // CSS to keep a usable fallback if this file is missing or fails to parse.
  document.documentElement.classList.add("script-ready");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Preloader ---------- */
  function initPreloader() {
    var el = document.querySelector(".preloader");
    if (!el) return;

    var mark = el.querySelector(".preloader-mark");
    var bar = el.querySelector(".preloader-bar span");
    var done = false;

    // Intro plays once per session. Without this it replays on every internal
    // navigation, which is friction rather than atmosphere.
    var seen = false;
    try {
      seen = window.sessionStorage.getItem("dc-intro") === "1";
      window.sessionStorage.setItem("dc-intro", "1");
    } catch (err) {
      seen = false;
    }

    if (seen) {
      el.style.display = "none";
      document.documentElement.classList.add("is-ready");
      return;
    }

    function finish() {
      // The interval and the hard stop can both land here. Only run once.
      if (done) return;
      done = true;
      el.classList.add("is-done");
      document.documentElement.classList.add("is-ready");
      window.setTimeout(function () {
        el.style.display = "none";
      }, 1100);
    }

    if (reduced) {
      el.style.display = "none";
      document.documentElement.classList.add("is-ready");
      return;
    }

    var value = 0;
    var timer = window.setInterval(function () {
      value = Math.min(100, value + Math.random() * 18 + 6);
      if (mark) mark.textContent = String(Math.round(value)).padStart(3, "0");
      if (bar) bar.style.width = value + "%";
      if (value >= 100) {
        window.clearInterval(timer);
        window.setTimeout(finish, 260);
      }
    }, 90);

    // Hard stop, whatever else happens.
    window.setTimeout(function () {
      window.clearInterval(timer);
      finish();
    }, 3200);
  }

  /* ---------- Ambient light follows the pointer ---------- */
  function initAmbient() {
    if (!fine || reduced) return;

    // Built here rather than in the markup so it simply never exists without
    // JS, and no page has to carry a decorative empty div.
    var glow = document.createElement("div");
    glow.className = "ambient-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    var x = 0;
    var y = 0;
    var queued = false;

    document.addEventListener(
      "pointermove",
      function (event) {
        x = event.clientX;
        y = event.clientY;
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          glow.style.setProperty("--px", x + "px");
          glow.style.setProperty("--py", y + "px");
        });
      },
      { passive: true }
    );
  }

  /* ---------- Glass sheen follows the pointer ---------- */
  function initSheen() {
    if (!fine) return;

    var card = null;
    var px = 0;
    var py = 0;
    var queued = false;

    document.addEventListener(
      "pointermove",
      function (event) {
        // Measuring on every raw move is a layout flush per event; the sheen
        // only has to be correct once per painted frame.
        var next = event.target.closest && event.target.closest(".glass");
        if (!next) return;
        card = next;
        px = event.clientX;
        py = event.clientY;
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          if (!card) return;
          var box = card.getBoundingClientRect();
          if (!box.width || !box.height) return;
          card.style.setProperty("--mx", ((px - box.left) / box.width) * 100 + "%");
          card.style.setProperty("--my", ((py - box.top) / box.height) * 100 + "%");
        });
      },
      { passive: true }
    );
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnets() {
    if (!fine || reduced) return;

    // Written as --mag-x/--mag-y and consumed by `translate` in CSS, so the
    // element's own `transform` (reveal offset, hover slide) still composes.
    var targets = document.querySelectorAll(".btn, .link-arrow span");

    targets.forEach(function (el) {
      var queued = false;
      var px = 0;
      var py = 0;

      el.addEventListener("pointermove", function (event) {
        px = event.clientX;
        py = event.clientY;
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          var box = el.getBoundingClientRect();
          var dx = px - (box.left + box.width / 2);
          var dy = py - (box.top + box.height / 2);
          el.style.setProperty("--mag-x", dx * 0.22 + "px");
          el.style.setProperty("--mag-y", dy * 0.3 + "px");
        });
      });

      el.addEventListener("pointerleave", function () {
        el.style.removeProperty("--mag-x");
        el.style.removeProperty("--mag-y");
      });
    });
  }

  /* ---------- Card tilt ---------- */
  function initTilt() {
    if (!fine || reduced) return;

    var cards = document.querySelectorAll(".mode-card, .rail-card, .service-card, .stat");
    if (!cards.length) return;

    var LIMIT = 4.2;

    cards.forEach(function (el) {
      var queued = false;
      var px = 0;
      var py = 0;

      el.addEventListener("pointermove", function (event) {
        px = event.clientX;
        py = event.clientY;
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          var box = el.getBoundingClientRect();
          if (!box.width || !box.height) return;

          // Two small rotations expressed as one axis-angle, so the CSS
          // `rotate` property carries the tilt and leaves `transform` and
          // `translate` free for the hover lift and the magnet offset.
          var ax = -((py - (box.top + box.height / 2)) / (box.height / 2)) * LIMIT;
          var ay = ((px - (box.left + box.width / 2)) / (box.width / 2)) * LIMIT;
          var angle = Math.sqrt(ax * ax + ay * ay);

          if (angle < 0.05) {
            el.style.rotate = "";
            return;
          }
          el.style.rotate = ax.toFixed(3) + " " + ay.toFixed(3) + " 0 " + angle.toFixed(3) + "deg";
        });
      });

      el.addEventListener("pointerleave", function () {
        el.style.rotate = "";
      });
    });
  }

  /* ---------- Eased wheel scrolling ---------- */
  /* Driven through the real scroll position rather than a transformed wrapper,
     so sticky panels, the fixed header, scroll-linked animations and every
     IntersectionObserver on the page keep working untouched. */
  function initSmoothScroll() {
    if (reduced || !fine) return;

    var target = window.scrollY;
    var current = target;
    var running = false;

    function limit() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function jump(y) {
      // `instant` overrides the stylesheet's smooth scroll-behavior, which
      // would otherwise animate against this loop every frame.
      window.scrollTo({ top: y, behavior: "instant" });
    }

    function frame() {
      if (!running) return;

      target = Math.max(0, Math.min(limit(), target));
      var delta = target - current;

      if (Math.abs(delta) < 0.5) {
        current = target;
        running = false;
        jump(current);
        return;
      }

      current += delta * 0.12;
      jump(current);
      window.requestAnimationFrame(frame);
    }

    // Anything we did not drive — a keyboard page-down, an anchor jump, a
    // scrollbar drag, scrollIntoView — hands control straight back to the
    // browser and re-anchors the next gesture to wherever the page now is.
    window.addEventListener(
      "scroll",
      function () {
        if (running && Math.abs(window.scrollY - current) <= 2) return;
        running = false;
        current = target = window.scrollY;
      },
      { passive: true }
    );

    function scrollsVertically(node) {
      while (node && node.nodeType === 1 && node !== document.body && node !== document.documentElement) {
        var overflow = window.getComputedStyle(node).overflowY;
        if ((overflow === "auto" || overflow === "scroll") && node.scrollHeight > node.clientHeight + 1) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }

    window.addEventListener(
      "wheel",
      function (event) {
        // Zoom gestures, sideways trackpad swipes over the rails, and the
        // line/page delta modes some mice and assistive tools send stay native.
        if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
        if (event.deltaMode !== 0) return;
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
        if (scrollsVertically(event.target)) return;

        event.preventDefault();
        target = Math.max(0, Math.min(limit(), (running ? target : window.scrollY) + event.deltaY));

        if (!running) {
          running = true;
          current = window.scrollY;
          window.requestAnimationFrame(frame);
        }
      },
      { passive: false }
    );
  }

  /* ---------- Header ---------- */
  function initHeader() {
    var header = document.querySelector("header");
    if (!header) return;

    var progress = header.querySelector(".scroll-progress");
    var ticking = false;

    function paint() {
      ticking = false;
      header.classList.toggle("is-stuck", window.scrollY > 12);

      if (!progress) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max) : 0);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paint);
    }

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector("header nav");
    if (!toggle || !nav) return;

    nav.id = nav.id || "primary-navigation";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");

    function close() {
      if (!nav.classList.contains("open")) return;
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest("header")) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !nav.classList.contains("open")) return;
      close();
      toggle.focus();
    });
  }

  /* ---------- Word-mask headings ---------- */
  /* Rebuilds plain headings as masked words so display type rises out of its
     own line box instead of fading in as one block. */
  function initSplit() {
    if (reduced) return;

    document.querySelectorAll("h1[data-reveal], h2[data-reveal]").forEach(function (el) {
      // Only a single uninterrupted run of text is safe to rebuild — anything
      // carrying nested markup keeps the structure the author wrote.
      if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;

      var words = el.textContent.trim().split(/\s+/);
      if (words.length < 2) return;

      var frag = document.createDocumentFragment();

      words.forEach(function (word, index) {
        var mask = document.createElement("span");
        mask.className = "word";
        mask.style.setProperty("--w", index);

        var inner = document.createElement("span");
        inner.textContent = word;
        mask.appendChild(inner);
        frag.appendChild(mask);

        // A real space between the inline-blocks, so the heading still wraps
        // and still reads as one sentence to a screen reader.
        if (index < words.length - 1) frag.appendChild(document.createTextNode(" "));
      });

      el.textContent = "";
      el.appendChild(frag);
      // Hands the heading from the block reveal to the word reveal, so only one
      // of the two ever drives it.
      el.removeAttribute("data-reveal");
      el.setAttribute("data-words", "");
    });
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    var targets = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal], [data-lines], [data-words]")
    );
    if (!targets.length) return;

    function show(el) {
      el.classList.add("is-in");
    }

    if (!("IntersectionObserver" in window) || reduced) {
      targets.forEach(show);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          show(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el, index) {
      if (el.hasAttribute("data-reveal")) {
        el.style.animationDelay = Math.min(index % 5, 4) * 80 + "ms";
      }
      observer.observe(el);
    });

    // Anything already on screen is revealed synchronously rather than waiting
    // on the observer's first callback. That callback is deferred until the
    // page composites a frame, so a background tab or a throttled webview can
    // leave the whole masthead sitting at opacity 0 with no way back.
    targets.forEach(function (el) {
      var box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) {
        observer.unobserve(el);
        show(el);
      }
    });
  }

  /* ---------- Count-up stats ---------- */
  function initCounters() {
    var values = document.querySelectorAll("[data-count]");
    if (!values.length) return;

    function paint(el, n) {
      var pad = el.getAttribute("data-pad");
      var text = String(n);
      if (pad) text = text.padStart(Number(pad), "0");
      el.textContent = text + (el.getAttribute("data-suffix") || "");
    }

    function markCard(el) {
      var card = el.closest(".stat");
      if (card) card.classList.add("is-in");
    }

    if (!("IntersectionObserver" in window) || reduced) {
      values.forEach(function (el) {
        paint(el, Number(el.getAttribute("data-count")));
        markCard(el);
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          observer.unobserve(el);
          markCard(el);

          var target = Number(el.getAttribute("data-count"));
          var start = null;
          var span = 1400;

          function step(now) {
            if (start === null) start = now;
            var t = Math.min(1, (now - start) / span);
            var eased = 1 - Math.pow(1 - t, 4);
            paint(el, Math.round(target * eased));
            if (t < 1) window.requestAnimationFrame(step);
          }

          window.requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );

    values.forEach(function (el) {
      paint(el, 0);
      observer.observe(el);
    });
  }

  /* ---------- Sparklines ---------- */
  function initSparks() {
    // Written as a custom property, not as inline stroke-dashoffset — an inline
    // value would outrank the `.stat.is-in` rule that draws the line in.
    document.querySelectorAll(".spark path").forEach(function (path) {
      if (typeof path.getTotalLength !== "function") return;
      path.style.setProperty("--dash", path.getTotalLength());
    });
  }

  /* ---------- Draggable systems rail ---------- */
  function initRail() {
    var rail = document.querySelector("[data-rail]");
    if (!rail) return;

    var down = false;
    var moved = false;
    var startX = 0;
    var startScroll = 0;

    rail.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") return; // native momentum is better
      down = true;
      moved = false;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      rail.setPointerCapture(event.pointerId);
      rail.classList.add("is-dragging");
    });

    rail.addEventListener("pointermove", function (event) {
      if (!down) return;
      var dx = event.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
    });

    function release(event) {
      if (!down) return;
      down = false;
      rail.classList.remove("is-dragging");
      if (rail.hasPointerCapture && event.pointerId !== undefined && rail.hasPointerCapture(event.pointerId)) {
        rail.releasePointerCapture(event.pointerId);
      }
    }

    rail.addEventListener("pointerup", release);
    rail.addEventListener("pointercancel", release);

    // Swallow the click that ends a drag so cards don't fire mid-swipe.
    rail.addEventListener(
      "click",
      function (event) {
        if (moved) {
          event.preventDefault();
          event.stopPropagation();
          moved = false;
        }
      },
      true
    );
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    var list = document.querySelector("[data-faq]");
    if (!list) return;

    // Wire the button to its answer and take collapsed answers out of the
    // accessibility tree — a zero-height panel is still readable otherwise.
    list.querySelectorAll(".faq-item").forEach(function (item, index) {
      var button = item.querySelector(".faq-q");
      var panel = item.querySelector(".faq-a");
      if (!button || !panel) return;

      panel.id = panel.id || "faq-answer-" + (index + 1);
      button.setAttribute("aria-controls", panel.id);
      button.setAttribute("aria-expanded", "false");
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-label", button.textContent.trim());
      panel.inert = true;
    });

    list.addEventListener("click", function (event) {
      var button = event.target.closest(".faq-q");
      if (!button) return;

      var item = button.closest(".faq-item");
      var open = button.getAttribute("aria-expanded") === "true";

      list.querySelectorAll(".faq-item").forEach(function (other) {
        other.classList.remove("is-open");
        var otherButton = other.querySelector(".faq-q");
        var otherPanel = other.querySelector(".faq-a");
        if (otherButton) otherButton.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.inert = true;
      });

      if (!open) {
        button.setAttribute("aria-expanded", "true");
        item.classList.add("is-open");
        var panel = item.querySelector(".faq-a");
        if (panel) panel.inert = false;
      }
    });
  }

  /* ---------- Services jump nav ---------- */
  function initJumpNav() {
    var links = document.querySelectorAll(".jump-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    var sections = [];

    links.forEach(function (link) {
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target) return;
      byId[target.id] = link;
      sections.push(target);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || !byId[entry.target.id]) return;
          links.forEach(function (link) {
            link.classList.remove("active");
          });
          byId[entry.target.id].classList.add("active");
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------- Industry index ---------- */
  function initIndustries() {
    var root = document.querySelector("[data-industries]");
    if (!root) return;

    var tabs = Array.prototype.slice.call(root.querySelectorAll(".industry-row"));
    if (!tabs.length) return;

    var panels = [];
    var current = 0;

    for (var i = 0; i < tabs.length; i++) {
      var panel = document.getElementById(tabs[i].getAttribute("aria-controls"));
      // A row without its panel would strand the whole index — leave the
      // no-JS layout in place instead, where every panel is already visible.
      if (!panel) return;
      panels.push(panel);
      if (tabs[i].getAttribute("aria-selected") === "true") current = i;
    }

    var stacked = window.matchMedia("(max-width: 1080px)");

    function select(index, focus) {
      if (index !== current) {
        current = index;

        tabs.forEach(function (tab, i) {
          var on = i === index;
          tab.setAttribute("aria-selected", String(on));
          tab.tabIndex = on ? 0 : -1;
          panels[i].hidden = !on;
        });

        // Restart the swap even when the class is already on the element.
        var shown = panels[index];
        shown.classList.remove("is-swapping");
        void shown.offsetWidth;
        shown.classList.add("is-swapping");

        // Stacked layout puts the panel below the whole list, so a tap near
        // the top of it would otherwise change something entirely off-screen.
        if (stacked.matches) {
          shown.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        }
      }

      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.tabIndex = i === current ? 0 : -1;
      panels[i].hidden = i !== current;

      tab.addEventListener("click", function () {
        select(i, false);
      });
    });

    root.addEventListener("keydown", function (event) {
      var index = tabs.indexOf(event.target);
      if (index === -1) return;

      var next = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;

      event.preventDefault();
      select(next, true);
    });
  }

  /* ---------- Hero crystal (raw WebGL, no libraries) ---------- */
  var VERT = [
    "attribute vec2 p;",
    "void main(){ gl_Position = vec4(p, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2 u_res;",
    "uniform float u_time;",
    "uniform vec2 u_mouse;",
    "uniform float u_scroll;",

    "mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c); }",
    "mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c); }",

    "float sdOcta(vec3 p, float s){ p = abs(p); return (p.x+p.y+p.z-s)*0.57735027; }",

    // Crystal: octahedron softened toward a sphere, with fine facet ripples.
    "float map(vec3 p){",
    "  mat3 r = rotY(u_time*0.22 + u_mouse.x*0.6 + u_scroll*1.7) * rotX(-0.35 + u_mouse.y*0.35 + u_scroll*0.5);",
    "  vec3 q = r * p;",
    "  float o = sdOcta(q, 0.98);",
    "  float s = length(q) - 0.74;",
    "  float d = mix(o, s, 0.32);",
    "  d += 0.018*sin(9.0*q.x)*sin(9.0*q.y)*sin(9.0*q.z);",
    "  return d*0.85;",
    "}",

    "vec3 normalAt(vec3 p){",
    "  vec2 e = vec2(0.0015, 0.0);",
    "  return normalize(vec3(",
    "    map(p+e.xyy)-map(p-e.xyy),",
    "    map(p+e.yxy)-map(p-e.yxy),",
    "    map(p+e.yyx)-map(p-e.yyx)));",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / max(min(u_res.x, u_res.y), 1.0);",
    "  vec3 ro = vec3(0.0, 0.0, 3.6);",
    "  vec3 rd = normalize(vec3(uv, -1.9));",

    "  float t = 0.0;",
    "  float hit = 0.0;",
    "  for(int i=0;i<56;i++){",
    "    vec3 p = ro + rd*t;",
    "    float d = map(p);",
    "    if(d < 0.0012){ hit = 1.0; break; }",
    "    t += d;",
    "    if(t > 7.0) break;",
    "  }",

    // Ambient bloom so the shape sits in light rather than on a hard cut.
    "  float halo = exp(-length(uv)*2.2);",
    "  vec3 col = vec3(0.34,0.46,1.0) * halo * 0.55;",
    "  float alpha = halo*0.42;",

    "  if(hit > 0.5){",
    "    vec3 p = ro + rd*t;",
    "    vec3 n = normalAt(p);",
    "    vec3 l = normalize(vec3(0.6, 0.9, 0.7));",
    "    float diff = max(dot(n,l), 0.0);",
    "    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.2);",
    "    float spec = pow(max(dot(reflect(-l,n), -rd), 0.0), 64.0);",

    // Interior stays dark enough to read as glass, edges carry the light.
    "    vec3 deep = vec3(0.10,0.14,0.30);",
    "    vec3 edge = vec3(0.58,0.68,1.0);",
    "    vec3 warm = vec3(1.0,0.82,0.58);",

    "    col = mix(deep, edge, fres);",
    "    col += warm * spec * 0.9;",
    "    col += edge * diff * 0.26;",
    "    col += vec3(0.49,0.94,0.78) * pow(fres, 3.0) * 0.55;",
    "    col += vec3(0.30,0.40,0.85) * 0.25;",
    "    alpha = clamp(0.52 + fres*0.9 + spec*1.2, 0.0, 1.0);",
    "  }",

    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "shader compile failed");
    }
    return shader;
  }

  function initCrystal(existingHolder) {
    var holder = existingHolder || document.querySelector("[data-crystal]");
    if (!holder || reduced) return;

    var canvas = document.createElement("canvas");
    holder.appendChild(canvas);

    var gl =
      canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, antialias: false });

    if (!gl) {
      // No WebGL: the ambient CSS gradients already carry the hero.
      canvas.remove();
      return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      canvas.remove();
      return;
    }
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(program, "u_res");
    var uTime = gl.getUniformLocation(program, "u_time");
    var uMouse = gl.getUniformLocation(program, "u_mouse");
    var uScroll = gl.getUniformLocation(program, "u_scroll");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    function resize() {
      // Capped at 1.5, not the full device ratio: this is a per-pixel raymarch,
      // and 2x on a large hero is a measurable cost on integrated graphics.
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var box = holder.getBoundingClientRect();
      var w = Math.max(1, Math.round(box.width * dpr));
      var h = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    var mx = 0;
    var my = 0;
    var tmx = 0;
    var tmy = 0;

    var onPointerMove = null;
    if (fine) {
      onPointerMove = function (event) {
        tmx = (event.clientX / window.innerWidth) * 2 - 1;
        tmy = (event.clientY / window.innerHeight) * 2 - 1;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    var visible = true;
    var visibilityObserver = null;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      });
      visibilityObserver.observe(holder);
    }

    // The crystal turns as the hero leaves — the scroll drives the object
    // rather than just moving past it.
    var scroll = 0;
    function onScroll() {
      scroll = Math.min(1, window.scrollY / Math.max(window.innerHeight, 1));
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    var running = true;

    function stop() {
      running = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      if (onPointerMove) window.removeEventListener("pointermove", onPointerMove);
      if (visibilityObserver) visibilityObserver.disconnect();
    }

    // A lost context (GPU reset, driver sleep, tab backgrounded for a long
    // while) must not leave the loop spinning against a dead context.
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      stop();
      holder.classList.remove("is-live");
    });

    canvas.addEventListener("webglcontextrestored", function () {
      // Restoring invalidates all WebGL resources. Rebuild inside the same
      // holder so the effect can recover after a graphics-context reset.
      canvas.remove();
      initCrystal(holder);
    });

    window.addEventListener("resize", resize, { passive: true });
    resize();
    holder.classList.add("is-live");

    var start = performance.now();

    (function frame(now) {
      if (!running) return;
      window.requestAnimationFrame(frame);
      if (!visible || document.hidden) return;

      resize();
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, ((now || performance.now()) - start) / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uScroll, scroll);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    })(start);
  }

  /* ---------- Contact form ---------- */
  function showFieldError(field, message) {
    var holder = field.parentElement;
    var note = holder.querySelector(".field-error");

    if (!message) {
      field.removeAttribute("aria-invalid");
      if (note) note.remove();
      return;
    }

    field.setAttribute("aria-invalid", "true");
    if (!note) {
      note = document.createElement("p");
      note.className = "field-error";
      holder.appendChild(note);
    }
    note.textContent = message;
  }

  function initContactDirect() {
    var holder = document.querySelector("[data-contact-direct]");
    var link = document.querySelector("[data-contact-link]");
    var email = typeof CONTACT_EMAIL === "string" ? CONTACT_EMAIL.trim() : "";
    if (!holder || !link || !email) return;

    link.textContent = email;
    link.href = "mailto:" + email;
    holder.hidden = false;
  }

  function initContactForm() {
    var form = document.querySelector("#contact-form-el");
    var status = document.querySelector("#contact-form-status");
    if (!form || !status) return;

    var required = form.querySelectorAll("[required]");
    var submitButton = form.querySelector('button[type="submit"]');
    var submitting = false;

    function showStatus(message, kind) {
      status.textContent = message;
      status.className = "contact-form-status" + (kind ? " " + kind : "");
      status.hidden = false;
    }

    function clearFieldErrors() {
      required.forEach(function (field) {
        showFieldError(field, "");
      });
    }

    required.forEach(function (field) {
      field.addEventListener("blur", function () {
        showFieldError(field, field.checkValidity() ? "" : field.validationMessage);
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") && field.checkValidity()) {
          showFieldError(field, "");
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Ignore repeated activation while an endpoint request is in flight.
      if (submitting) return;

      var firstInvalid = null;
      required.forEach(function (field) {
        var ok = field.checkValidity();
        showFieldError(field, ok ? "" : field.validationMessage);
        if (!ok && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        showStatus("Please fix the highlighted fields and try again.", "is-error");
        firstInvalid.focus();
        return;
      }

      var endpoint = typeof FORM_ENDPOINT === "string" ? FORM_ENDPOINT.trim() : "";
      var email = typeof CONTACT_EMAIL === "string" ? CONTACT_EMAIL.trim() : "";

      if (endpoint) {
        if (!window.fetch) {
          showStatus("This form cannot send messages in this browser. Please try again shortly.", "is-error");
          return;
        }

        submitting = true;
        form.setAttribute("aria-busy", "true");
        if (submitButton) submitButton.disabled = true;
        showStatus("Sending your message...", "");

        window
          .fetch(endpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form)
          })
          .then(function (response) {
            if (response.ok) {
              form.reset();
              clearFieldErrors();
              showStatus("Thanks — your message is on its way. We'll be in touch soon.", "is-success");
              return;
            }

            if (response.status === 429) {
              showStatus("We've received several messages. Please wait a moment, then try again.", "is-error");
              return;
            }

            showStatus("We couldn't send your message. Please try again shortly.", "is-error");
          })
          .catch(function () {
            showStatus("We couldn't send your message. Please check your connection and try again.", "is-error");
          })
          .finally(function () {
            submitting = false;
            form.removeAttribute("aria-busy");
            if (submitButton) submitButton.disabled = false;
          });
        return;
      }

      if (!email) {
        // Visitor-facing copy, not a note to the developer.
        status.textContent =
          "This form isn't connected to an inbox yet. Please try again shortly — we're switching it on.";
        status.className = "contact-form-status is-error";
        status.hidden = false;
        return;
      }

      var data = new FormData(form);
      var subject = "New enquiry from " + (data.get("name") || "website visitor");
      var body = [
        "Name: " + (data.get("name") || ""),
        "Business: " + (data.get("business") || ""),
        "Email: " + (data.get("email") || ""),
        "Phone: " + (data.get("phone") || ""),
        "Industry: " + (data.get("industry") || ""),
        "",
        "Message:",
        data.get("message") || ""
      ].join("\n");

      window.location.href =
        "mailto:" + email +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      status.textContent = "Opening your email client to send this message...";
      status.className = "contact-form-status is-success";
      status.hidden = false;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Each init is isolated: one failure must never strand the curtain or the nav.
    [
      initPreloader,
      initHeader,
      initNav,
      initSmoothScroll,
      initSplit,
      initReveal,
      initCounters,
      initSparks,
      initSheen,
      initAmbient,
      initMagnets,
      initTilt,
      initRail,
      initFaq,
      initJumpNav,
      initIndustries,
      initCrystal,
      initContactDirect,
      initContactForm
    ].forEach(function (fn) {
      try {
        fn();
      } catch (err) {
        if (window.console) console.error("[DataCentral] " + fn.name + " failed:", err);
      }
    });
  });
})();
