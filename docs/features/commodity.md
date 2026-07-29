# 購物商場（commodity）

`src/commodity/commodity.html` / `commodity.css` / `commodity.js`

## 用途
商品列表頁（分類瀏覽 + 搜尋結果），可從導覽列分類 pill、搜尋列、或 `?q=` 帶關鍵字進來。

## 主要函式
- `changeCategory(category)` / `loadProducts()`：依分類或搜尋詞載入商品，`commoditySkeletonHTML(n)` 顯示載入骨架屏。
- `renderProductsBootstrap(items)` / `finishRender(items)`：卡片渲染。
- `applyFilters(items)` / `clearFilters()` / `triggerFilter()`：篩選（價格區間、分類等）。
- `renderPagination(totalCount)`：分頁。
- 手機版格狀/列表切換（grid ↔ list 檢視）。
- 搜尋無結果時的兩個 CTA：`showWishCta(keyword)`（導去許願池發起心願）、`showYouMightLike()`（相關推薦）。

## 圖片
`toBigImg(url)`：把商品縮圖 URL 轉成大圖版本（後端圖片有 size variant 慣例）。

## 後端整合
`BackendService.getCommodityList(category, {page, limit})` 等。
