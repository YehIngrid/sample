# 聊天室（chatroom）

`src/chatroom/chatroom.html` / `chatroom.css` / `chatroom.js`（~3000 行，站內最大的前端模組）/ `chat.js` / `ChatBackendService.js`

## 用途
買賣雙方即時聊天，支援圖片、公告置頂、快速回覆、訊息主題分類。

## 後端整合
`ChatBackendService`（`/api/chat` 系列）用 Axios 打 REST API + **Server-Sent Events（SSE）** 做即時推播（不是 WebSocket）。`this.auth = new BackendService()` 另外處理登入態。

## 主要功能區塊（chatroom.js）
- `openChatRoomList(roomId)` / `openChatWithTarget(targetUserId)`：從商品頁/購物車等其他頁面帶著對象 ID 直接開啟聊天室。
- 訊息主題功能（`_syncQuickReplyPad`、訊息主題相關區塊）：讓對話可以標記主題、快速回覆。
- `compressImage(blob, maxWidth, quality)`：聊天內圖片上傳前用 Canvas 壓成 WebP（跟 wishpool／shop 的圖片壓縮共用同一套模式，各自獨立實作）。
- 公告：站方/客服可在聊天室頂部推播置頂公告（近期修過公告 bug 與 UI、訊息 toast 位置）。

## 圖片上傳慣例（跟全站一致）
`FileReader.readAsDataURL()`（不是 `URL.createObjectURL`，避免 blob URL revoke 時機的 bug）→ Cropper.js（在 `shown.bs.modal` 內初始化，帶 `img.complete` 判斷避免圖片還沒載入就裁切）→ `toBlob()` → `compressImage()`。

## 待辦/近期異動
- 訊息 toast 位置曾經跟公告 bar 打架，已調整。
- 聊天室公告的顯示/隱藏邏輯有修過 bug（見 git log「聊天室公告bug/ui」）。
