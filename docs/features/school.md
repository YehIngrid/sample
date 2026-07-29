# 校園攻略站（school）

`src/school/` — 站內另一個內容平台，讓學生寫「攻略文」（付費/免費知識文章）換錢，主題涵蓋推甄、學分、實習、證照等。

## 頁面地圖
| 檔案 | 用途 |
|---|---|
| `school.html` | 攻略首頁：精選文章 + `ARTICLES`（`school-new.js` 內建假資料）卡片列表 + 熱門標籤側欄 |
| `school-article.html` | 全部文章列表 |
| `school-about.html` | 攻略介紹 |
| `school-studio.html` | 撰寫攻略的入口（「創作起點」，繼續草稿 / 展開新頁） |
| `school-composer.html` | 富文本編輯器，撰寫/編輯攻略本體 |
| `school-preview.html` | 草稿即時預覽（讀 `localStorage['cg-preview']`），跟 `school-post.html` 呈現邏輯要保持同步 |
| `school-post.html` | 單篇文章詳情頁（目前是手寫的靜態示範文章，研究所推甄主題） |
| `school-search.html` / `school-profile.html` | 搜尋結果 / 作者主頁 |
| `school-contest.html` / `school-contests.html` | 單一競賽 / 全部競賽（種子創作者計畫等徵稿活動） |

## 資料層
- `school-data.js`：`TOPICS`（主題 → 預設標籤 + icon + **`anchorFields`** 錨點欄位schema）、`BADGE_CLASS`/`BADGE_LABEL`、`MOCK_ARTICLES`。
- `school-new.js`：`ARTICLES`（首頁卡片假資料，含每篇的 `anchorValues`）、`renderArticles()`、`anchorRowHTML()`、按讚/收藏、通知、admin 按鈕顯示等共用邏輯。多數 school 頁面都靠 `<script defer src="school-new.js">` 提供互動。

## 錨點欄位（anchorFields）功能 — 2026-07 新增
每個主題可以定義幾個「必填、AI 無法泛用生成」的結構化欄位（例如研究所推甄：錄取校系所／推甄年度／面試方式），撰寫時強制填、顯示時秀出來，增加文章可信度。

- **Schema**：`TOPICS[主題].anchorFields = [{key, label, placeholder}, ...]`，尚未提供的主題先給 `[]`。
- **撰寫（電腦版）**：`school-composer.html` 側欄「分類與標籤」下方多一張 `#anchorCard`，隨 `#catSel` 切換動態渲染必填輸入框，未填會擋 `發佈` 按鈕（跟既有 checklist 邏輯整合）。
- **撰寫（手機版）**：進入 `?new=1` 且螢幕 ≤860px 時，跳出全螢幕 `#topicWizard`：第一步用下拉選單選主題、第二步填該主題的錨點欄位，確認後才進編輯器。
- **草稿預覽**：`school-preview.html` 在標題下方渲染「錨點資訊」卡（讀 `d.anchorFields`/`d.anchorValues`）。
- **正式文章頁**：`school-post.html` — 電腦版在右側欄（`aside.side`，價格卡下方）、手機版在作者資訊卡上方（`.side` ≤991px 整個隱藏，改用 `d-lg-none` 的獨立區塊），白底無邊框、`錨點資訊`標題跟「本文章節」同樣式（11px、大寫感、`--muted`）。
- **列表卡片**：`school.html`／`school-new.js` 的 `anchorRowHTML()`，`.anchor-row` 是 `flex-direction:column` 每欄位一行、`justify-content:space-between`（label 左 value 右）、`align-self:flex-end` 貼齊卡片右側、淺藍底整排無邊框。

⚠️ **`.anchor-box`／`.anchor-row` 樣式共用 `school-post.css`**，`school-preview.html` 也載入同一份 CSS，改 `school-post.html` 的錨點樣式時記得同步改 `school-preview.html` 的 HTML 結構（兩邊各自維護一份 markup，只有 CSS 共用）。

## 部署注意
2026-07-30 發現正式站（treasurehub.tw）的 `school-new.js` 曾經漏部署、卡在錨點功能之前的舊版（`school-data.js`/`school.css` 都已更新但 `school-new.js` 沒有），導致正式站看不到錨點資訊。之後遇到「部分頁面新、部分頁面舊」的狀況，可以直接 fetch 正式站對應的 `.js`/`.css` 檔案內容，grep 關鍵字（如 `anchorRowHTML`）確認是否為最新版。
