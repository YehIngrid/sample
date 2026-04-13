# 後台數據分析 API 規格文件

> **目的：** 為 `official.html` 數據分析面板補充以下統計 API，支援平台招商流量報告。  
> **Auth：** 所有端點需驗證 Cookie JWT，且限 `role = admin` 才可存取。  
> **Base URL：** `https://thpr.hlc23.dev`

---

## 目錄

1. [DAU / MAU 趨勢](#1-dau--mau-趨勢)
2. [熱門上線時段](#2-熱門上線時段)
3. [用戶畫像（系所 / 年級 / 性別）](#3-用戶畫像系所--年級--性別)
4. [全體熱門搜尋關鍵字](#4-全體熱門搜尋關鍵字)
5. [搜尋關鍵字追蹤（前端呼叫）](#5-搜尋關鍵字追蹤前端呼叫)
6. [平台規模補充（用戶數 / 訂單數）](#6-平台規模補充用戶數--訂單數)
7. [Session 記錄（前端呼叫）](#7-session-記錄前端呼叫)
8. [前端整合備註](#8-前端整合備註)

---

## 1. DAU / MAU 趨勢

### `GET /api/admin/analytics/dau-mau`

回傳近 N 天每日活躍用戶數，用於繪製折線圖，向廣告主證明平台持續有人氣。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `days` | integer | 否 | 查詢天數，預設 `30`，最大 `90` |

**Response 200**

```json
{
  "dau_today": 142,
  "mau_this_month": 1038,
  "trend": [
    { "date": "2026-04-01", "dau": 98 },
    { "date": "2026-04-02", "dau": 115 },
    { "date": "2026-04-13", "dau": 142 }
  ]
}
```

| 欄位 | 說明 |
|------|------|
| `dau_today` | 今日不重複登入用戶數 |
| `mau_this_month` | 本月不重複登入用戶數 |
| `trend` | 近 N 天每日活躍數陣列（依日期升序） |

**實作建議**  
- 用戶每次呼叫 `/api/whoami` 或登入時，記錄 `user_id + date(UTC+8)` 到 `daily_active_users` 表（UPSERT，去重）。
- MAU 查詢同表，條件改為當月。

---

## 2. 熱門上線時段

### `GET /api/admin/analytics/peak-hours`

回傳過去 7 天各小時（0–23）的累計 session 啟動次數，用於告知廣告主最佳投放時段。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `days` | integer | 否 | 統計天數，預設 `7` |

**Response 200**

```json
{
  "timezone": "Asia/Taipei",
  "days": 7,
  "hours": [
    { "hour": 0,  "count": 45 },
    { "hour": 1,  "count": 72 },
    { "hour": 2,  "count": 38 },
    { "hour": 23, "count": 198 }
  ]
}
```

| 欄位 | 說明 |
|------|------|
| `timezone` | 時區（固定 `Asia/Taipei`） |
| `hours` | 長度固定 24，`hour` 為 0–23，`count` 為該小時累計 session 數 |

**實作建議**  
- 每筆 session 記錄（見第 7 節）存入時，額外記錄 `hour_of_day`（台北時間）。
- 此 API 直接 `GROUP BY hour_of_day` 加總即可。

---

## 3. 用戶畫像（系所 / 年級 / 性別）

### `GET /api/admin/analytics/user-demographics`

回傳所有已驗證用戶的系所、年級、性別分佈，用於向補習班或品牌商展示精準受眾。

**Response 200**

```json
{
  "total_users": 1284,
  "departments": [
    { "name": "農業暨自然資源學院", "count": 210 },
    { "name": "理學院", "count": 185 },
    { "name": "工學院", "count": 172 }
  ],
  "grades": [
    { "grade": 1, "label": "大一", "count": 280 },
    { "grade": 2, "label": "大二", "count": 310 },
    { "grade": 3, "label": "大三", "count": 355 },
    { "grade": 4, "label": "大四", "count": 290 },
    { "grade": 5, "label": "研究生", "count": 49 }
  ],
  "genders": [
    { "gender": "male",   "count": 601 },
    { "gender": "female", "count": 672 },
    { "gender": "other",  "count": 11 }
  ]
}
```

**實作建議**  
- 資料來源為 `users` 表中 `department`、`grade`、`gender` 欄位。
- 若目前 schema 沒有這些欄位，需在**註冊流程**補充收集（或讓用戶在個人資料頁填寫）。
- `departments` 依 `count` 降序排列，前端只顯示前 10 筆。

---

## 4. 全體熱門搜尋關鍵字

### `GET /api/admin/analytics/search-keywords`

回傳全體用戶的搜尋熱詞統計，用於直接拿數據去找對應補習班談合作。

**Query Parameters**

| 參數 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `days` | integer | 否 | 統計天數，預設 `30` |
| `limit` | integer | 否 | 回傳筆數，預設 `20`，最大 `50` |

**Response 200**

```json
{
  "period_days": 30,
  "keywords": [
    { "keyword": "會計學", "count": 87 },
    { "keyword": "多益",   "count": 74 },
    { "keyword": "微積分", "count": 61 },
    { "keyword": "雅思",   "count": 53 }
  ]
}
```

**實作建議**  
- 資料來源為第 5 節 `POST /api/analytics/search` 所記錄的日誌表。
- 建議對 keyword 做基本正規化（去除前後空白、轉小寫）後再存入，避免 `"多益 "` 和 `"多益"` 分開計算。

---

## 5. 搜尋關鍵字追蹤（前端呼叫）

### `POST /api/analytics/search`

由前端搜尋頁在每次執行搜尋時呼叫，記錄搜尋關鍵字到日誌。

> **Auth：** 需登入（有 Cookie 即可），未登入直接回 `401` 不影響搜尋功能。

**Request Body**

```json
{
  "keyword": "會計學"
}
```

**Response 200**

```json
{ "ok": true }
```

**前端整合位置**  
在 `src/newhome/newhome.js` 或 shop 搜尋框的 submit handler 加入：

```js
// 搜尋執行後，非同步呼叫，不阻塞 UI
axios.post('/api/analytics/search', { keyword: searchQuery }).catch(() => {});
```

**實作建議**  
- 新建 `search_logs` 表：`id, user_id, keyword, created_at`。
- `rate limit`：同一用戶同一 keyword 10 秒內只記錄一次，避免重複計數。

---

## 6. 平台規模補充（用戶數 / 訂單數）

### `GET /api/admin/analytics/platform-stats`

補充「數據分析」面板中目前顯示 `–` 的兩個欄位。

**Response 200**

```json
{
  "total_users":  1284,
  "total_orders": 3571
}
```

**實作建議**  
- `total_users`：`SELECT COUNT(*) FROM users WHERE email_verified = true`
- `total_orders`：`SELECT COUNT(*) FROM orders`（含所有狀態）
- 可加 Redis cache，TTL 10 分鐘，避免每次開後台都全表 scan。

**前端對應 element ID**

| 欄位 | element id |
|------|-----------|
| `total_users` | `#stat-users` |
| `total_orders` | `#stat-orders` |

---

## 7. Session 記錄（前端呼叫）

### `POST /api/analytics/session`

由前端在頁面載入時記錄 session 開始，用於計算 DAU、停留時間、留存率。

> 此 API 為「盡力送出」（fire-and-forget），失敗不影響用戶體驗。

**Request Body**

```json
{
  "event":      "start",
  "page":       "/newhome/newhome.html",
  "session_id": "abc123xyz"
}
```

| 欄位 | 說明 |
|------|------|
| `event` | `"start"` 或 `"end"` |
| `page` | `window.location.pathname` |
| `session_id` | 前端產生的 UUID，`start` 和 `end` 需一致以計算停留時間 |

**Response 200**

```json
{ "ok": true }
```

**前端整合位置（加入 `default.js`）**

```js
// 在 default.js 底部加入
(function trackSession() {
  const sessionId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  const page = window.location.pathname;
  const send = (event) =>
    axios.post('/api/analytics/session', { event, page, session_id: sessionId })
      .catch(() => {});

  send('start');
  window.addEventListener('beforeunload', () => send('end'));
})();
```

**實作建議**  
- 建 `sessions` 表：`id, user_id, session_id, page, event, created_at`。
- 停留時間 = `end.created_at - start.created_at`（同 session_id）。
- 次日留存率 = 今天登入的用戶中，昨天也有 session 的比例。

---

## 8. 前端整合備註

後端完成後，在 `official.js` 的 `loadAnalytics()` 中，對應 element id 如下：

| API 回傳欄位 | 前端 element id |
|-------------|----------------|
| `dau_today` | `#stat-dau` |
| `mau_this_month` | `#stat-mau` |
| `platform-stats.total_users` | `#stat-users` |
| `platform-stats.total_orders` | `#stat-orders` |
| 平均停留時間（由 session 計算） | `#stat-session` |
| 次日留存率（由 session 計算） | `#stat-retention` |

前端 `loadAnalytics()` 目前以 `Promise.allSettled` 並行呼叫所有 API，任一 API 失敗不影響其他區塊顯示，**直接串接即可，不需修改前端邏輯結構**。

---

*文件維護：前端 @YehIngrid　·　最後更新：2026-04-13*
