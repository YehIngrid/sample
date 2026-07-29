# 商品詳細頁（product）

`src/product/product.html` / `product.css` / `product.js`（1162 行）

## 用途
單一商品的詳情頁：圖片、賣家資訊、評價、加入購物車/直接下單、分享。

## 主要函式
- `_renderSellerPage(page)`：賣家其他商品的分頁列表。
- 分享功能：`getShareInfo()` / `updateOGTags()`（動態改 Open Graph meta，讓分享連結預覽正確）/ `updateDesktopShareLinks()` / `copyLink()`。
- `loadSimilarProducts(category, currentId)`：同分類相似商品推薦。
- `renderSellerInfo(data)` / `toggleSellerReviews()`：賣家資訊卡與評價展開收合。
- `reportSeller(sellerId, sellerName)`：檢舉賣家。
- `onAddToCart(e)` / `orderNow(e)`：加入購物車 / 直接下單兩條路徑。
- `openChatWithSeller(targetSellerId)` / `openCloseChatInterface()`：從商品頁直接開聊天室聯絡賣家（帶著目前瀏覽的商品資訊，見 `_renderSellerPage` 附近的「目前瀏覽的商品（傳給聊天室用）」）。
- `renderTagsByGroup(tags)` / `getTagLabel(tag)` / `isTagPositive(tag)`：商品標籤（分組顯示、正負面樣式）。

## 圖片
`toSmallImg(url)` / `toBigImg(url)`：跟 commodity 頁共用同樣的圖片尺寸慣例（各自獨立實作，非共用檔案）。

## 後端整合
`BackendService`：商品詳情、加入購物車、下單、檢舉、賣家資訊/評價。
