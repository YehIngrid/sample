# 購物首頁（shop）

`src/shop/shop.html` / `shop.css` / `shop.js`

## 用途
拾貨寶庫的購物入口首頁，同時承載「賣家專區」的商品上架表單（`?page=seller`）。是使用者登入後最常落地的頁面。

## 主要區塊
- Navbar + 搜尋列（含桌機分類 pill、手機 offcanvas 搜尋、搜尋紀錄）
- `.quick-actions`：賣家專區／許願專區／常見問題 三顆快捷卡片
  - 中間「許願專區」卡（`.qa-btn.aqua`）在桌機（`d-lg-flex`）會多顯示 `#qaWishLive` 即時願望輪播泡泡，每 4.2 秒換一則（`initWishTicker()`）
  - 手機版另外有 `.wish-letter-row`（信封抽信動畫）取代泡泡
- 熱賣專區 / 最新上架：橫向捲動卡片（`#hotItems`，`prevHotBtn`/`nextHotBtn` 換頁）
- `?page=seller` 時整頁切換成賣家上架表單（`#seller` 區塊），`#midcontent` 隱藏

## 管理員捷徑
`#moderatorBtn`／`#apiDocsBtn`／`#designSystemBtn`／`#schoolGuideBtn` 四顆 `position:fixed` 按鈕，依 `localStorage.role`（MODERATOR/ADMIN）由 `shop.js` 的 DOMContentLoaded handler 控制顯示。
- 桌機：右上角浮動按鈕，`@media (max-width: 991.98px)` 強制隱藏（避免疊在卡片上）。
- 手機：改成收在漢堡選單（`#navbarNav`）裡的 `#mobileModeratorItem`／`#mobileApiDocsItem`／`#mobileDesignSystemItem`／`#mobileSchoolGuideItem`，同一段 JS 用 `classList.remove('d-none')` 控制。

## 已知/修過的坑
- `.quick-actions` 各卡片文字用 `flex:1` 分配空間，**`.qa-copy` 的 `min-width` 只能在 `@media (min-width:992px)` 內設**——曾經不小心讓它變成全域規則，手機版 3 顆按鈕加起來超過 100vw 造成整頁橫向溢出。
- 促銷輪播（`#promoBannerCarousel`）已於 2026-07 移除。
- 問卷/IG 廣告彈窗（`#adFormModal`）已於 2026-07-30 移除，樣式與重啟用方式見 [`docs/ads.md`](../ads.md)。
- 願望泡泡文字若過長會擠壓 `.qa-copy` 到只剩個位數 px、造成中文逐字換行；已用 min-width 解掉（見上）。

## 後端整合
`BackendService`（商品清單、whoami）、`wpBackendService`（願望池首則資料，`initWishTicker`）。
