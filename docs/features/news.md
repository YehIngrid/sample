# 最新消息（news）

`src/news/news.html` / `news.css` / `news.js`

## 用途
官方公告/最新消息的列表與詳細頁（後台由 `official.html` 的 Quill 編輯器撰寫，見 [`official.md`](official.md)）。

## 主要函式
- `loadNewsList(page)` / `renderPagination(total, page)`：列表與分頁。
- `showNewsDetail(id, cachedIdx)` / `showNewsList()`：詳細頁 ↔ 列表頁切換，**支援 `?id=` 直接開啟指定文章**（頁面初始載入時會偵測）。
- `stripHtml(html)` / `extractPreview(html)` / `fmtDate(str)`：內容摘要與日期格式化工具。
- `openLightbox(src)` / `bindImageLightbox()`：文章內圖片點擊放大。
- `shareNews()`：分享功能。

## 後端整合
`BackendService`：最新消息列表/詳情 API。
