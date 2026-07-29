# 廣告彈跳視窗（Ad Popup Modal）

紀錄目前平台採用過的廣告/問卷彈窗樣式，之後要重新上廣告時可以直接照這個 pattern 加回去，不用重新設計。

## 目前狀態

`src/shop/shop.html` 的「填寫問卷 + 導IG」彈窗已於 2026-07-30 移除（含 HTML、CSS、JS）。素材圖 `src/svg/ad_form.svg` 保留在專案裡沒有刪，之後要重用可以直接指到同一個檔案，或替換成新的宣傳圖。

## 使用情境

進入 `shop.html`（購物首頁）時，如果使用者沒有勾選「以後都不要顯示」，會跳出一個置中的彈跳視窗，圖片由設計師另外出（一張長圖，把標題、活動說明、CTA 文案都畫在圖片裡），下方接兩顆固定的行動按鈕（前往表單 / 前往 IG）與一個「不再顯示」checkbox。

## HTML 結構

```html
<!-- 廣告表單彈跳視窗 -->
<div id="adFormModal" class="ad-form-modal-backdrop" style="display:none;">
  <div class="ad-form-modal">
    <button type="button" class="ad-form-modal-close" id="adFormModalClose">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      <span class="visually-hidden">關閉</span>
    </button>
    <img class="ad-form-modal-img" src="../svg/ad_form.svg" alt="意見調查表單">
    <div class="ad-form-modal-actions">
      <a class="ad-form-modal-btn primary" href="表單連結" target="_blank" rel="noopener">前往填寫表單 →</a>
      <a class="ad-form-modal-btn ghost" href="IG連結" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i> 前往官方 IG</a>
    </div>
    <label class="ad-form-modal-hide">
      <input type="checkbox" id="adFormModalHideCheck">
      以後都不要顯示
    </label>
  </div>
</div>
```

- 整張圖放在 `.ad-form-modal-img`，內容（標題、活動說明、CTA 文案）都畫在圖片裡，不是 HTML 文字——換活動時只要換圖，不用改版面。
- 下方固定兩顆按鈕：`primary`（導去表單/活動頁）+ `ghost`（導去 IG），可依需求增減，但維持「一個主要 CTA + 一個次要 CTA」的比例。
- 一定要有「以後都不要顯示」的 checkbox，尊重使用者選擇。

## CSS（放在對應頁面的 .css，例如 shop.css）

```css
.ad-form-modal-backdrop {
  position: fixed; inset: 0; z-index: 10600;
  background: rgba(15,39,69,0.55);
  align-items: center; justify-content: center;
  padding: 20px;
}
.ad-form-modal {
  position: relative;
  width: min(380px, 100%);
  background: #fff;
  border-radius: 20px;
  padding: 20px 20px 24px;
  box-shadow: 0 24px 60px -20px rgba(0,0,0,0.35);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.ad-form-modal-close {
  position: absolute; top: 12px; right: 12px;
  width: 32px; height: 32px; border-radius: 50%;
  border: none; background: #f0f2f4; color: #6f87a0; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease;
}
.ad-form-modal-close:hover { background: #004b97; color: #fff; }
.ad-form-modal-img { width: 100%; border-radius: 14px; display: block; }
.ad-form-modal-actions { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.ad-form-modal-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 11px 18px; border-radius: 999px;
  font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
  text-decoration: none; transition: all 0.22s ease; box-sizing: border-box;
}
.ad-form-modal-btn.primary { background: #004b97; color: #fff; }
.ad-form-modal-btn.primary:hover { background: rgb(36,182,133); }
.ad-form-modal-btn.ghost { background: #fff; border: 1.5px solid #d6e2ec; color: #0f2745; }
.ad-form-modal-btn.ghost:hover { border-color: #004b97; color: #004b97; }
.ad-form-modal-hide {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; color: #6f87a0; letter-spacing: 0.02em;
  cursor: pointer; user-select: none;
}
.ad-form-modal-hide input { width: 15px; height: 15px; accent-color: #004b97; cursor: pointer; }
```

配色沿用設計系統的 `--navy`(#004b97)、hover 綠 `rgb(36,182,133)`、`--line`(#d6e2ec) 等 token。

## JS（放在頁面最後）

```html
<script>
document.addEventListener('DOMContentLoaded', () => {
  const AD_FORM_HIDE_KEY = 'th_shop_ad_form_hide'; // 每個廣告換一個 key，避免跟舊活動的「不再顯示」紀錄打架
  const modal = document.getElementById('adFormModal');
  if (!modal) return;
  const closeBtn = document.getElementById('adFormModalClose');
  const hideCheck = document.getElementById('adFormModalHideCheck');

  function closeModal() {
    if (hideCheck?.checked) localStorage.setItem(AD_FORM_HIDE_KEY, '1');
    modal.style.display = 'none';
  }

  if (localStorage.getItem(AD_FORM_HIDE_KEY) !== '1') {
    modal.style.display = 'flex';
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(); // 點背景也能關閉
  });
});
</script>
```

**重點：`AD_FORM_HIDE_KEY` 這個 localStorage key 每次換新活動都要改名字**（例如 `th_shop_ad_form_hide_2026q3`），不然使用者上次勾過「不再顯示」，新廣告就永遠不會跳出來。

## 重新啟用時的 checklist

1. 設計新的活動圖，取代 `src/svg/ad_form.svg`（或換新檔名）。
2. 把上面的 HTML 區塊貼回目標頁面（原本在 `</footer>` 之後、`#loadingOverlay` 之前）。
3. CSS 貼回對應頁面的 `.css` 檔尾端。
4. JS 貼回 `</body>` 前，記得改 `AD_FORM_HIDE_KEY`。
5. 確認 z-index（10600）不會被其他 modal／offcanvas 蓋住。
