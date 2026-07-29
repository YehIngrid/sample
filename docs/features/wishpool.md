# 許願池（wishpool）

`src/wishpool/wishpool.html` / `wishpool.css` / `wish.js` / `wishpool.js`

## 用途
買家「許願」想要的商品，賣家瀏覽願望並主動媒合。是站內少數的 SPA-within-MPA 頁面。

## 架構
- 單一 HTML 檔用多個 `.page` div + `.active` class 切換（`showPage(hash)` 依 URL hash 決定顯示哪個子頁），CSS 用 `animation:pageIn` 做轉場。
- 手機導覽是 navbar 正下方常駐的 `.wp-mobile-tabs`（不是收在漢堡選單裡）。
- 願望卡（wish card）是糖果紋邊框：`border:4px solid transparent` + 兩層 `background-image`（白底 `linear-gradient` + `repeating-linear-gradient` 糖果條紋）+ `background-clip: padding-box, border-box`。兩種版型：`.wn-has-photo`（88px/68px 縮圖）與 `.wn-no-photo`（純文字欄）。桌機 2 欄、手機 1 欄。

## 主要流程（wishpool.js）
- `listAll(page)` / `listMyWishes(mypage)`：全部願望 / 我的願望，各自分頁狀態與 `updatePaginationUI()`。
- `showInfo(data)` / `showMyInfo(data)`：願望詳情卡渲染。
- 發布願望：圖片上傳走共用流程（`FileReader.readAsDataURL` → Cropper.js 裁切 → `compressImage()` 轉 WebP），`validatePhoto()`/`validateBudgetMax()`/`validateUrgency()` 做前端驗證。
- `resendWish()` / `deleteWish()`：重新發佈／刪除。
- `generateTags(data)`：依內容自動產生搜尋用標籤。

## 通知（wish.js）
`#notificationPanel.notif-panel`（`position:fixed`，`.open` class 切換顯示），`loadNotifications()` 渲染進 `#notifList`，`relativeTime()` 格式化時間。

## 站內邀請系統的入口
`default.js` 在使用者登入後，若頁面有 `#chaticon`，會注入 `#inviteFab` 按鈕（釘在聊天圖示上方），點開 `#invitePanel` 顯示邀請碼與邀請紀錄（跟 wishpool 本身無直接關係，但常一起出現在同樣的頁面）。

## 後端整合
`wpBackendService`（`/api/wishpool`）：`listWishes`、發布/刪除/重新發佈願望等。「我也想要」按鈕（原型設計稿裡有）**目前沒有對應後端 API，功能延後**。
