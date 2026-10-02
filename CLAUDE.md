# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static marketing website for DataCentral (AI systems for businesses) — seven hand-written HTML pages, one shared stylesheet, one shared vanilla-JS behavior file. No build step, no package manager, no framework, no dependencies beyond two web font CDNs.

- `index.html`, `industries.html`, `about.html`, `partnerships.html`, `research.html`, `contact.html` — the six pages linked in the live nav, each a full `<head>`+`<body>` document sharing the same header/footer markup. Nav order: Home → Industries → About → Partnerships → Research → Contact.
- `services.html` — a seventh page that still exists with full content but is intentionally unlinked from every page's nav/footer (removed from rotation on request); re-adding it means restoring its `<li>` entries everywhere the pattern above appears.
- `style.css` — single stylesheet for the whole site, organized as numbered sections (see below).
- `main.js` — single IIFE behavior file, organized as named `init*()` functions.
- `assets/` — static images (partner/program logos, research-source logos).
- `.github/workflows/azure-static-web-apps-*.yml` — CI/CD: pushes to `main` auto-deploy via Azure Static Web Apps (`app_location: "/"`, `output_location: "."` — the repo is deployed as-is, unbuilt).

## Running locally

There is no dev server or build command. Serve the directory with any static file server and open in a browser, e.g.:

```
npx serve .
```

(`.vscode/launch.json` expects something listening on `http://localhost:8080`.) There is no test suite, linter, or formatter configured — verify changes by loading the affected page(s) in a browser.

## Architecture

### Page structure
Every page repeats the same shell: a `.preloader` curtain, skip link, `<header>` with logo/nav/mobile toggle/scroll-progress bar, `<main id="main">`, and a shared `<footer>`. When editing shared chrome (nav links, footer columns, preloader markup), change it identically across all linked HTML files (currently six — see above) — there is no templating, so drift between pages is a real risk.

### `main.js` — one IIFE, independent `init*()` functions
Everything lives in a single closure. At the bottom, `DOMContentLoaded` runs a list of `init*()` functions, each wrapped in its own try/catch so one failing feature (e.g. a missing WebGL context) can't strand the rest of the page (nav, curtain, forms). When adding a new interactive behavior, follow this pattern: write a self-contained `initX()` that bails early (`if (!el) return;`) when its markup isn't present on the current page, and add it to the init list.

Key behaviors and why they're built the way they are:
- **Preloader** (`initPreloader`): plays once per `sessionStorage` key `dc-intro`, not once per page — internal navigations skip it. The `<head>` inline script (before `main.js` loads) reads this same key synchronously to add `intro-done` to `<html>` before first paint, avoiding a flash of the curtain on internal nav.
- **`document.documentElement` classes as feature/state flags**: `js` (JS available, set inline in `<head>`), `script-ready` (main.js parsed), `is-ready` (preloader finished), `intro-done` (session already saw the intro). CSS reads these classes for fallback/first-paint behavior — check `style.css` before assuming JS absence means no styling.
- **Motion gating**: `reduced` (`prefers-reduced-motion`) and `fine` (`hover: hover` + `pointer: fine`) are computed once at the top of the IIFE and checked by nearly every init function. Any new pointer-driven or animated feature should respect both.
- **Custom properties as the animation bus**: pointer-reactive effects (ambient glow, glass sheen, magnetic buttons, card tilt, hero crystal) write CSS custom properties (`--px/--py`, `--mx/--my`, `--mag-x/--mag-y`, `rotate`) from `rAF`-throttled handlers rather than fighting over the `transform` property directly, so multiple effects can compose on the same element.
- **`initSmoothScroll`**: intercepts vertical wheel scroll and eases it manually by driving real `window.scrollTo` (not a transformed wrapper), so sticky headers, scroll-linked reveals, and `IntersectionObserver`-based features keep working untouched. Any listener or gesture it doesn't own (keyboard, scrollbar drag, anchors) immediately hands control back.
- **`initCrystal`**: raw WebGL (no libraries) raymarched shader for the hero. Handles context-loss/restore by tearing down and re-running itself on the same holder element. Capped at 1.5x device pixel ratio for cost.
- **`initSplit`/`initReveal`**: headings tagged `data-reveal` get rebuilt word-by-word into masked spans (`data-words`) for a rise-in effect, but only if the heading is a single plain text node — anything with nested markup is left alone. Reveal targets (`data-reveal`, `data-lines`, `data-words`) are synchronously shown if already in the viewport on load, since `IntersectionObserver`'s first callback can be deferred past first paint.
- **`initIndustries`**: an ARIA tabs widget driven by `data-industries` / `.industry-row` (see `industries.html`) — if any tab's `aria-controls` panel is missing, it bails entirely and leaves the no-JS layout (all panels visible) in place rather than partially wiring up a broken widget.
- **`initTilt`**: pointer-tracked card tilt applied to `.mode-card, .rail-card, .service-card, .stat, .research-card` — any new card-grid component should be added to this selector and to the `perspective: 1600px` rule in style.css section 4 to get the same effect.
- **Contact form** (`initContactForm`, top of file): behavior is controlled by the two vars at the very top of `main.js` — `FORM_ENDPOINT` (POSTs via `fetch`, visitor never leaves the page) takes priority; if blank, falls back to `CONTACT_EMAIL` (opens a pre-filled `mailto:`); if both are blank, the form validates but shows an error explaining it can't deliver yet. Change these two vars, not the submit handler, to reconfigure where the form goes.

### `style.css` — single file, numbered sections
Sections are marked with `/* ---------- N. Name ---------- */` comments and increase linearly (1. Tokens, 2. Reset, ... 28. Responsive), with lettered sub-sections (e.g. `25b`, `25c`) inserted between numbers when a new page-specific component belongs next to an existing one rather than at the end. Responsive overrides live in their own section (28) at three breakpoints (1080px, 820px, 480px) plus a print block — not inlined next to each component; a new grid component almost always needs a matching entry added to the 820px collapse-to-1-column rule there.

- **Design tokens** (`:root`, section 1): all color, type, spacing, radius, and easing values are custom properties — `--void*` (backgrounds), `--ink*` (text, deliberately capped short of pure white to avoid glare), `--iris`/`--mint`/`--amber`/`--rose` (accent "light", never used as the sole carrier of meaning), `--glass-*`/`--hairline` (the glass-panel look used by `.glass` elements throughout). Reuse these tokens rather than hardcoding colors/spacing.
- **`color-scheme: dark`** — this is a dark-only design; there is no light theme to preserve.
- **`@view-transition` (section 1b)** — same-origin navigations between pages cross-fade via the View Transitions API when the browser supports it; unsupported browsers just get a normal navigation cut. No JS is involved in this.
- **`.glass` (section 4)** is the shared frosted-panel primitive (cards, pins, stats, form) — it cooperates with `main.js`'s `initSheen` pointer-tracked highlight via `--mx`/`--my`.
- **`.research-logo` (section 25c)** puts a white chip behind any logo dropped into a `.research-meta` row, so a dark or colored third-party logo (government seals, company wordmarks) always reads cleanly against the dark card — reuse this pattern for any future "citation" style content instead of inlining a logo directly.

## Conventions to follow when editing

- Keep `main.js` framework-free and dependency-free — it's meant to stay a single vanilla-JS file.
- Any new interactive feature must degrade: check for `reduced`/`fine` where relevant, guard missing DOM with early returns, and never let one feature's failure block another (follow the try/catch-per-init pattern).
- Because there's no templating, shared markup (header, footer, preloader, meta boilerplate) must be updated by hand in every linked `.html` file together.
- CI deploys the repo root as-is on every push to `main` — there's no build/minify step, so whatever is committed is what ships.
- Third-party organization logos used for citation/attribution (see `research.html`) are sourced from Wikimedia Commons and credited for identification purposes only, not endorsement — government seals (Census, SBA, Fed) are public domain; company wordmarks (Goldman Sachs, Intuit) are trademarked but used only to name them as a cited source.
