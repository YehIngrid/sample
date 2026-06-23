# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TreasureHub (拾貨寶庫) — a Traditional Chinese secondhand auction marketplace for National Chung Hsing University. Pure vanilla HTML/CSS/JS frontend with no build tooling. All pages are served as static files; frontend and backend are integrated at `https://treasurehub.tw`.

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

The canonical design reference is `src/shop/Design System.html` (admin-only). All new UI must follow the language below.

### Color Tokens

| Role | Token | Value |
|---|---|---|
| Primary CTA / heading / active | `--navy` | `#004b97` |
| Primary dark (hover) | `--navy-d` | `#003a78` |
| Mid blue | `--mid` | `#4a85c4` |
| Sky blue | `--sky` | `#7eb8d8` |
| Soft accent / secondary btn | `--aqua` | `#abdad5` |
| Warm accent (燈光/認證/精選 only) | `--cream` | `#f3e3b5` |
| Warning / cancel | `--terracotta` | `#c97f5a` |
| Heading text | `--ink` | `#0f2745` |
| Body text | `--body` | `#1a2840` |
| Muted / secondary text | `--muted` | `#6f87a0` |
| Border / divider | `--line` | `#d6e2ec` |
| Light block background | `--alice` | `aliceblue` |
| Admin/back-office page bg | `--page` | `#eef4f8` |
| Hover / success green | — | `rgb(36, 182, 133)` |

**Rules:** All colors stay in the blue-green spectrum. `--cream` is the only warm color and must be used sparingly. Do not use old teal `#7bcdd6` — use `#abdad5` instead.

### Typography

| Level | Size / Weight / Tracking |
|---|---|
| H1 | `40px / 700 / letter-spacing 0.06em` |
| H2 | `30px / 700 / 0.04em` |
| H3 | `20px / 700 / 0.04em` |
| Body | `15px / 400 / line-height 1.7` |
| Eyebrow | `11px / uppercase / letter-spacing 0.28em / color --muted` |

Font stack: `"Helvetica Neue", Helvetica, "PingFang TC", "Noto Sans TC", Arial, sans-serif`

### Shape & Motion Tokens

| Token | Value |
|---|---|
| Card radius | `18px` |
| Button / pill radius | `999px` |
| Icon-box radius | `12–14px` |
| Border | `1px solid #d6e2ec` |
| Transition | `all 0.22s ease` |
| Card hover | `translateY(-3px)` + `box-shadow: 0 16px 36px -22px rgba(0,75,151,0.3)` + `border-color: --navy` |
| Card shadow (rest) | `0 1px 4px rgba(0,0,0,0.06)` |
| Icon style | line-art SVG, `stroke-width: 1.8`, `stroke: --navy`, no fill |

### Status Pills

| State | Background | Text |
|---|---|---|
| 待確認 | `rgba(243,227,181,0.55)` | `#a08540` |
| 待出貨 | `rgba(171,218,213,0.45)` | `#007568` |
| 待收貨 | `rgba(126,184,216,0.45)` | `#1a5b85` |
| 已完成 | `#004b97` | `#fff` |
| 已取消 | `#f0f2f4` | `#6f87a0` |

### Other Tokens
| Token | Value |
|---|---|
| Price color | `#004b97` (not red) |
| Price format | `NT$ X,XXX` |
| SweetAlert2 confirm btn | `#004b97` → hover `rgb(36,182,133)` |
| SweetAlert2 cancel btn | `#f0f0f0` / `#555` text |

## Common Gotchas

- **PhotoSwipe CDN**: Must use jsDelivr (`cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.css`), not cdnjs (which 404s for v5.4.4).
- **Cropper.js modal overflow**: The `overflow:hidden` constraint must be on an inner wrapper `<div>`, not on `.modal-body` itself — otherwise drag handles are clipped.
- **TOC anchor links in shop `page=seller`**: Use `scrollIntoView({behavior:'smooth'})` + `preventDefault()` instead of `href="#id"` to avoid polluting history stack.
- **CSS custom property `--card-color`** on wish cards: photo wishes use random `#C1E8DD`/`#BDD6E1`, no-photo wishes use `#ffffff` (with `wishbg.svg` positioned `absolute; bottom:0`).
