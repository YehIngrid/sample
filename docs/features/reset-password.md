# 重設密碼（reset-password）

`src/reset-password/reset-password.html` / `reset-password.css` / `reset-password.js`（112 行）

## 用途
從忘記密碼信件連結進來的重設密碼頁（帶 `reset_token`），跟 `account.html` 內建的忘記密碼流程是兩個不同入口，但共用同一組 token 概念。

## 主要函式
- `showState(id)`：切換頁面狀態（輸入新密碼／成功／連結失效等）。
- `setError(id, msg)` / `clearErrors()`：表單錯誤提示。

## 後端整合
`BackendService` 的重設密碼確認 API（帶 token + 新密碼）。
