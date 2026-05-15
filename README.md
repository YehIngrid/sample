# 拾貨寶庫 TreasureHub

中興大學二手拍賣競標平台。

## 專案簡介

TreasureHub 是專為國立中興大學學生設計的二手物品競標交易平台，提供許願池、聊天室、購物車、競標等核心功能。

## 技術架構

純前端（Vanilla HTML / CSS / JS），無需任何建置步驟，直接以靜態檔案開啟即可。後端 API 位於 `https://thpr.hlc23.dev`。

### 前端
- **Bootstrap 5.3.3** — 排版與元件
- **Axios** — HTTP 請求（`withCredentials: true`，Cookie-based JWT）
- **SweetAlert2** — 確認 / 錯誤對話框
- **GSAP 3.12.2 + AOS 2.3.1** — 動畫
- **PhotoSwipe 5** — 圖片燈箱（via jsDelivr）
- **Cropper.js** — 圖片裁切上傳
- **Font Awesome 6 + Tabler Icons** — 圖示

### 目錄結構

```
/                   根目錄（BackendService.js、wpBackendService.js、default.js/css）
/default/           全域共用元件（navbar、模態框、按鈕樣式）
/src/
  shoppingcart/     購物車
  shop/             商品列表 & 賣家頁面
  wishpool/         許願池（mini-SPA）
  chatroom/         聊天室（SSE 即時通訊）
  account/          帳號 & 個人資料
  introduce/        介紹頁
/newhome.html       首頁（含中英雙語切換）
```

## 開發環境

無任何建置、Lint 或測試指令，直接在瀏覽器開啟 HTML 檔案即可。

```bash
# 以 VS Code Live Server 或任意靜態伺服器開啟即可
```

## 設計規範

| 項目 | 值 |
|---|---|
| 主色藍 | `#004b97` |
| 互動 / 成功綠 | `rgb(36, 182, 133)` |
| 柔和輔色 | `#abdad5` |
| 卡片背景 | `aliceblue` |
| 圓角 | `8px` |
| 價格格式 | `NT$ X,XXX` |

詳細設計語言請參考 `src/shoppingcart/shoppingcart.css`。

## 主要功能

- 商品瀏覽、競標、購物車、下單
- 許願池（會員付費許願 + 賣家媒合）
- 即時聊天室（Server-Sent Events）
- 圖片裁切上傳（WebP 壓縮）
- 通知面板
- 首頁中英雙語切換
