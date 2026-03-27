# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TreasureHub (拾貨寶庫) — a Traditional Chinese secondhand auction marketplace for National Chung Hsing University. Pure vanilla HTML/CSS/JS frontend with no build tooling. All pages are served as static files; the backend API is hosted at `https://thpr.hlc23.dev`.

## No Build / Lint / Test Commands

There is no build step, bundler, linter, or test runner. Edit HTML/CSS/JS files directly and open in a browser. No `npm run` commands apply.

## Architecture

### Multi-Page Application (MPA)
Each feature is a self-contained folder with `feature.html`, `feature.css`, and `feature.js`. Navigation is direct `href` links between HTML files. URL query params carry context (e.g. `?id=productId`, `?page=seller`, `?redirect=URL`).

### Backend Service Pattern
Three API client classes, all using Axios with `withCredentials: true` (cookie-based JWT):
- **`BackendService.js`** (root) — main API: auth, products, cart, orders
- **`wpBackendService.js`** (root) — wishpool API (`/api/wishpool`)
- **`chatroom/ChatBackendService.js`** — chat API + Server-Sent Events for real-time

All pages instantiate the relevant service on `DOMContentLoaded`:
```js
let backendService = null;
document.addEventListener('DOMContentLoaded', async () => {
    backendService = new BackendService();
});
```

Session keep-alive pings `whoami()` every 5 minutes. `localStorage` stores `uid`, `username`, `avatar`.

### Shared Utilities (`/default/`)
- **`default.js`** — `renderAuthUI()` (navbar auth state), `requireLogin()` (auth gate + redirect), `doLogout()`, `formatTaipeiTime()`, mobile search toggle, loader management
- **`default.css`** — global navbar, modals, buttons
- **`default-font.css`** — font imports (Zen Kaku Gothic New, Noto Sans TC)

Every page includes these three files.

### Key CSS/JS Libraries (all via CDN)
- **Bootstrap 5.3.3** — grid, utilities, modals
- **SweetAlert2** — all confirmation/error dialogs
- **Axios** — all HTTP requests
- **Font Awesome 6** + **Tabler Icons** — icons
- **GSAP 3.12.2** + **AOS 2.3.1** — animations
- **PhotoSwipe 5** (via jsDelivr: `cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/`) — image lightbox in chatroom, wishpool, wishinfo
- **Cropper.js** — image crop modal in wishpool, chatroom, shop

### Internationalization (i18n)
`newhome.js` has a bilingual system: `data-i18n` attributes on elements, `applyLang()` iterates `querySelectorAll('[data-i18n]')` and sets `textContent` from a `translations` object. Only the homepage is bilingual; other pages are Chinese-only.

### Wishpool SPA-within-MPA
`wishpool.html` is a mini-SPA: multiple `.page` divs toggled with `.active` class and CSS `animation: pageIn`. Mobile navigation is a persistent tab row below the navbar (`.wp-mobile-tabs`), not inside the hamburger menu.

### Image Upload Flow (wishpool, chatroom, shop)
1. File input → `openCropModal(file)` using `FileReader.readAsDataURL()` (not `URL.createObjectURL` — avoids revocation timing bugs)
2. Crop modal shows Cropper.js; initialized inside `shown.bs.modal` event with load-check guard:
   ```js
   if (img.complete && img.naturalWidth > 0) init(); else img.addEventListener('load', init, {once:true});
   ```
3. On confirm: `getCroppedCanvas()` → `toBlob()` → `compressImage()` (Canvas API → WebP)
4. Result assigned to `input.files` via `DataTransfer` API

### Notification Panel (wishpool)
HTML: `#notificationPanel.notif-panel` (position:fixed, toggled via `.open` class).
JS: `wish.js` — `loadNotifications()` renders into `#notifList`; `relativeTime()` formats timestamps.

### Hot Items Alignment (shop)
`.hot-items-container.overflows` → `justify-content: flex-start` (CSS class toggled by JS after `requestAnimationFrame` measuring `scrollWidth > clientWidth`).

## UI / Design System

All new UI components and style adjustments must follow the design language established in `src/shoppingcart/shoppingcart.css`. Key tokens:

| Token | Value |
|---|---|
| Primary blue | `#004b97` |
| Hover / success green | `rgb(36, 182, 133)` |
| Soft accent | `#abdad5` |
| Card background | `aliceblue` |
| Border radius (cards/buttons) | `8px` |
| Card shadow | `0 1px 4px rgba(0,0,0,0.1)` |
| Card hover | `translateY(-1px)` + `0 8px 20px rgba(0,0,0,0.1)` + `border: 1px solid rgba(0,75,151,0.2)` |
| Card selected/active border | `1px solid #004b97` |
| Price color | `#004b97` (not red) |
| Price format | `NT$ X,XXX` |
| SweetAlert2 confirm btn | `#004b97` → hover `rgb(36,182,133)` (set globally in `default.css`) |
| SweetAlert2 cancel btn | `#f0f0f0` with `#555` text |

**Do not** use the old teal `#7bcdd6` as a primary accent — use `#abdad5` instead.

## Common Gotchas

- **PhotoSwipe CDN**: Must use jsDelivr (`cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.css`), not cdnjs (which 404s for v5.4.4).
- **Cropper.js modal overflow**: The `overflow:hidden` constraint must be on an inner wrapper `<div>`, not on `.modal-body` itself — otherwise drag handles are clipped.
- **TOC anchor links in shop `page=seller`**: Use `scrollIntoView({behavior:'smooth'})` + `preventDefault()` instead of `href="#id"` to avoid polluting history stack.
- **CSS custom property `--card-color`** on wish cards: photo wishes use random `#C1E8DD`/`#BDD6E1`, no-photo wishes use `#ffffff` (with `wishbg.svg` positioned `absolute; bottom:0`).
