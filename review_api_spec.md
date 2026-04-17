# 評價系統 API 規格文件

> 前端對接負責人：拾貨寶庫前端  
> 文件日期：2026-04-17  
> 所有請求皆須帶上 cookie（JWT），使用 `withCredentials: true`

---

## 目錄

1. [送出評價](#1-送出評價)
2. [查詢某用戶的歷史評價](#2-查詢某用戶的歷史評價)
3. [查詢某訂單的雙方評論](#3-查詢某訂單的雙方評論)
4. [信用積分說明（供參考）](#4-信用積分說明供參考)

---

## 1. 送出評價

**前端觸發時機：** 訂單狀態為 `completed`，點選「給對方評價」→ 填完表單後送出

```
POST /api/reviews
Content-Type: application/json
```

### Request Body

**賣家評買家（isSeller = true）**
```json
{
  "orderId": "abc123",
  "targetId": "user456",
  "comment": "交易很順利，推薦！",
  "positiveItems": {
    "accurate":  1,
    "fast":      1,
    "polite":    1,
    "reliable":  0,
    "packaging": 1
  },
  "reportedIssues": ["late"]
}
```

**買家評賣家（isSeller = false）**
```json
{
  "orderId": "abc123",
  "targetId": "user456",
  "comment": "賣家很有耐心！",
  "positiveItems": {
    "onTime":        1,
    "communication": 1,
    "reliability":   0
  },
  "reportedIssues": []
}
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `orderId` | string | ✅ | 訂單 ID |
| `targetId` | string | ✅ | 被評分者的 user ID |
| `comment` | string | ❌ | 文字評論（可空白） |
| `positiveItems` | object | ❌ | 正評勾選項（1 = 勾選，0 = 未勾選）。後端依角色決定合法 key：賣家為 `accurate / fast / polite / reliable / packaging`，買家為 `onTime / communication / reliability`，多餘的 key 忽略 |
| `reportedIssues` | string[] | ❌ | 負評回報 key 列表，可為空陣列 |

### 負評 key 對照

| key | 意義 | 核實後扣分 |
|-----|------|-----------|
| `noShow` | 買家無故爽約或失聯 | −15 |
| `mismatch` | 賣家商品與描述嚴重不符 | −10 |
| `late` | 遲到超過 10 分鐘（買家或賣家） | −5 |

> ⚠️ `reportedIssues` 只是**回報**，不立即扣分。後端需進入人工審核流程，確認後才執行扣分。

### 後端應執行的邏輯

1. 驗證 `orderId` 存在且評分者為訂單參與方
2. 確認此訂單此方向尚未評分（避免重複送出）
3. 給**評分者**加 `+5`（完成交易）
4. 後端自行計算 `positiveItems` 中勾選數，若過半（`>= ceil(合法總數 / 2)`），給**被評者**加 `+2`
5. 將 `reportedIssues` 存入待審核佇列，**不立即扣分**
6. 訂單雙方都評分完成後，將訂單狀態更新為 `scored`

### Response（成功）

```json
{
  "success": true,
  "message": "評價已送出",
  "data": {
    "reviewId": "rev789",
    "creditGranted": 5
  }
}
```

### Response（失敗範例）

```json
{
  "success": false,
  "message": "此訂單已評分過"
}
```

---

## 2. 查詢某用戶的歷史評價

**前端使用位置：**
- `product.html` 商品頁 → 「查看評價」展開區
- `person.html` → 「查看對方評論」modal
- `person.html` → 側邊欄「我的評價」

```
GET /api/reviews/user/:userId?page=1&limit=10
```

### Path Params

| 參數 | 說明 |
|------|------|
| `userId` | 要查詢的用戶 ID（可以是自己或他人） |

### Query Params

| 參數 | 預設 | 說明 |
|------|------|------|
| `page` | 1 | 分頁頁碼 |
| `limit` | 10 | 每頁筆數 |

### Response

```json
{
  "success": true,
  "data": {
    "total": 23,
    "page": 1,
    "limit": 10,
    "reviews": [
      {
        "reviewId": "rev001",
        "orderId": "ord123",
        "itemName": "二手微積分課本",
        "comment": "交易順利，賣家很親切！",
        "createdAt": "2026-04-10T14:32:00Z",
        "reviewerUser": {
          "id": "user111",
          "name": "林小美",
          "photoURL": "https://..."
        },
        "positiveItems": {
          "accurate":  1,
          "fast":      1,
          "polite":    1,
          "reliable":  0,
          "packaging": 1
        },
        "reportedIssues": []
      }
    ]
  }
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| `reviewerUser` | 評分者的資訊（頭像、姓名） |
| `itemName` | 該筆評價對應的商品名稱 |
| `positiveItems` | 只包含該角色有效的 key，不存在的不回傳 |
| `reportedIssues` | 只回傳**已審核通過**的負評，待審核中的不顯示 |

---

## 3. 查詢某訂單的雙方評論

**前端使用位置：**  
`person.html` 訂單詳情 → 訂單狀態為 `scored` 時，顯示「我對他的評論」和「他對我的評論」

```
GET /api/orders/:orderId/reviews
```

### Response

```json
{
  "success": true,
  "data": {
    "myReview": {
      "reviewId": "rev001",
      "comment": "賣家很配合，東西跟描述一樣",
      "positiveItems": {
        "accurate":  1,
        "fast":      0,
        "polite":    1,
        "reliable":  1,
        "packaging": 0
      },
      "reportedIssues": [],
      "createdAt": "2026-04-10T14:32:00Z"
    },
    "partnerReview": {
      "reviewId": "rev002",
      "comment": "買家準時，交易愉快！",
      "positiveItems": {
        "onTime":        1,
        "communication": 1,
        "reliability":   1
      },
      "reportedIssues": [],
      "createdAt": "2026-04-10T15:10:00Z"
    }
  }
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| `myReview` | 登入者對對方送出的評論；訂單狀態為 `completed` 但登入者尚未評分時為 `null` |
| `partnerReview` | 對方對登入者送出的評論；對方尚未評分時為 `null` |

---

## 4. 信用積分說明（供參考）

### 起始值與邊界

| 項目 | 數值 |
|------|------|
| 初始積分 | 100 |
| 上限 | 150 |
| 下限 | 0 |

### 扣分規則（需審核）

| 回報 key | 意義 | 扣分 |
|----------|------|------|
| `noShow` | 買家爽約 | −15 |
| `mismatch` | 商品不符 | −10 |
| `late` | 遲到 10 分鐘以上 | −5 |

### 停權門檻

| 積分範圍 | 狀態 | 限制 |
|----------|------|------|
| < 80 | 黃燈 | 上架上限降至 5 件 |
| < 50 | 紅燈 | 帳號停用 7 天 |
| = 0 | 停權 | 永久停權 |

### 上架額度對照

| 積分 | 每月上架上限 |
|------|-------------|
| 150 | 20 件 |
| 120 以上 | 15 件 |
| 100（預設） | 10 件 |
| 低於 80 | 5 件 |
