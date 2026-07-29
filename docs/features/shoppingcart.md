# 購物車（shoppingcart）

`src/shoppingcart/shoppingcart.html` / `shoppingcart.css` / `shoppingcart.js`

## 用途
購物車列表、勾選結帳、跟賣家聊天確認。

## 主要函式
- `loadState()` / `saveState()`：本地購物車狀態快取。
- `initCartFromAPI()` / `normalizeCartResponse(res)`：從後端拉取購物車內容並正規化格式。
- `getItemInfoAsync(id)` / `enrichMissingProductFields(items)`：補齊購物車項目缺少的商品欄位（例如後端只回 ID 時，前端再查一次商品詳情）。
- `renderCart()` / `updateSummary()`：渲染與金額小計。
- `onItemCheckChange(itemId, checked)`：單項勾選/取消勾選，連動總金額。
- `showCheckoutLoading()` / `closeCheckoutLoading()`：結帳中 loading 狀態。
- `openChatWithSeller(targetSellerId)` / `openCloseChatInterface()`：跟商品頁一樣，可直接開聊天室聯絡賣家。
- `applyPreselectedItem()`：從商品頁「加入購物車」跳轉過來時，預先勾選剛加入的項目。

## 後端整合
`BackendService`（購物車 CRUD、結帳）+ `ChatBackendService`（聯絡賣家）。
