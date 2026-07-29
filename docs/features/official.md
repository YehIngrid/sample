# 官方後台管理（official）

`src/official/official.html` / `official.css` / `official.js`（2172 行）+ `ANALYTICS_API_SPEC.md`

## 用途
給 MODERATOR/ADMIN 用的後台管理系統：使用者管理、公告發送、客服單、檢舉管理、數據分析等。跟其他頁面不同，這是「back-office」風格（`--page` 淺灰藍底），不是面向一般使用者的設計。

## 登入驗證
以 **cookie 為準**，不依賴 localStorage（跟 person.js 的原則一致）。

## 主要區塊
- 側邊欄：`openSidebar()`/`closeSidebar()`（手機版開關）、`switchPanel(panelId)`（面板切換）、群組折疊 toggle。
- 用戶管理：`GET /api/admin/users`，可依 `id` 搜尋、依 `createdAt`/`lastLogin`/`rate`/`name`/`email`/`inviteCount` 排序（`inviteCount` 排序時每筆會多回傳 `inviteesCount` 邀請人數）。**2026-07 新增依邀請人數排序**的下拉選項與列表顯示。
- 公告：`loadChannels()` / `selectChannel()`（發送公告用頻道選擇）、`loadHistoryChannels()` / `loadHistoryForChannel()`（公告紀錄）、`addBroadcastFiles()`/`removeBroadcastFile()`/`renderBroadcastImgList()`（公告附加圖片）。
- 最新資訊（news）後台：`loadNewsAdmin()` / `renderNewsAdminList()` / `newsStatusLabel()` / `newsStatusClass()`，用 **Quill** 富文字編輯器寫文章，`saveDraft()` + `scheduleDraftSave()` 自動存草稿。
- 客服單管理、檢舉管理、評論標籤、數據分析（見 `ANALYTICS_API_SPEC.md`）等其餘面板。

## 後端整合
`BackendService` + `ChatBackendService`（客服單可能牽涉聊天室）+ `wpBackendService`（許願池相關管理）。

## Admin 捷徑入口（跟 shop 頁互相呼應）
`shop.html` 右上角/漢堡選單的「管理後台」按鈕就是連去這裡（`../official/official.html`），只有 MODERATOR/ADMIN 角色看得到，見 [`docs/features/shop.md`](shop.md)。
