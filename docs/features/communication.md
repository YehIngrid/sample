# 客服諮詢（communication）

`src/communication/communication.html` / `communication.css`（無獨立 `.js`，邏輯多半掛在共用元件或 inline script）

## 用途
客服諮詢/聯絡管道頁，導向真人客服或常見問題（`questions.html`）。

## 備註
`communication.js` 目前是空檔案（0 行），頁面互動邏輯可能是 inline `<script>` 寫在 `communication.html` 內，或完全依賴 `default.js` 的共用邏輯（navbar、登入態等）。之後如果要加功能，先確認是否該建立獨立 JS 檔而不是塞 inline script。
