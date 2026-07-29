# 帳戶管理中心（person）

`src/person/person.html` / `person.css` / `person.js`（3192 行，第二大模組）

## 用途
使用者個人中心：訂單（買家/賣家視角）、通知、設定、儀表板總覽等。是登入後最複雜的自助服務頁。

## 登入態判斷
**不依賴 `localStorage` 判斷登入狀態**——會等 `whoami()` 驗證完成後才決定顯示內容（見檔案開頭註解），避免 localStorage 被清掉但 session 其實還在/ 反之的不一致。

## 主要區塊
- `handleRouting()`：依 URL/hash 決定顯示哪個子頁面（訂單/通知/設定...）。
- 訂單：`loadSellerOrders(page)` / `loadBuyerOrders(page)`，`updateFilterTabCounts()` 更新分頁籤的數量 badge，`renderOrderPagination()` 共用分頁 UI，`resetOrderView()` 重置篩選狀態。
- `findTargetIdByOrderId()` / `handleAction(action, id, el)`：訂單列表裡各種操作按鈕（確認收貨、評價等）的統一入口。
- `showOrderSwal(type)`：訂單相關的 SweetAlert 客製彈窗。
- 通知：`loadOrderBadges()`、`_notifItemHtml()`、`_detectReportChanges()` / `_detectReportHistoryChanges()`（偵測檢舉案件狀態變化）、`_renderRecentNotifItem()`。
  - 近期通知其實聚合了 8 個不同來源的 API，**全部走靜默失敗**（單一來源掛掉不影響其他來源顯示）。
- `loadSettingsData()` / `loadDashboardData()`：設定頁與總覽頁資料載入。

## 後端整合
`BackendService`：whoami、訂單（買家/賣家）、通知、設定。
