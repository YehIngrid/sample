# 帳號（account）

`src/account/account.html` / `account.css` / `account.js`（657 行）

## 用途
登入／註冊／忘記密碼，全部整合在同一個頁面，用 URL query 決定顯示哪個表單。

## URL 規則
- `?page=login|signup|forgot`：決定初始顯示的表單，頁內切換表單時用 `history.replaceState` 同步 URL（不會塞歷史紀錄）。
- `?invite=CODE`：預填註冊邀請碼欄位；若沒帶 `page` 參數，隱含直接顯示 signup 表單。
- `reset_token` / `verify_token`：優先權高於 `page`——帶這兩個 token 時走對應的重設密碼/驗證流程，不受 `page` 影響。
- `?redirect=URL`：登入成功後導回原本要去的頁面（`requireLogin()` 機制帶進來的）。

## 主要函式
- `showPage(nextId)` + `_syncUrlToStep()`：表單切換與 URL 同步。
- `callSignUp()` / `callLogin()`：註冊/登入 API 呼叫，`isValidSignupEmail()` 限定學校信箱格式。
- `fieldError()` / `fieldClear()`：inline 表單錯誤提示 helper。
- 條款 Modal、密碼顯示/隱藏眼睛圖示、`startCountdown()`（忘記密碼驗證碼倒數）。

## 後端整合
`BackendService`：signup（可帶 `inviteCode`）、login、忘記密碼流程。
