let backendService;
const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})

document.addEventListener('DOMContentLoaded', () => {
  const backendService = new BackendService();

  // 取得 URL ?id=xxx
  const id = new URLSearchParams(location.search).get('id');
  console.log('id:', id);
  if (!id) {
    console.warn('缺少商品 id');
    return;
  }

//???
document.querySelectorAll('.shopcart').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!id) {
        console.warn('尚未寫入 data-id（可能商品還沒載完）');
        return;
      }
      try {
        await backendService.addItemsToCart(id);
        Swal.fire({
          title: '已加入購物車！',
          text: `商品編號 ${id} 已加入購物車`,
          iconHtml: '<i class="fa-solid fa-cart-plus" style="color: #a5dc86 font-size: 3.6rem"></i>',
          customClass: { icon: 'successgreen' },
          timer: 1500
        });
      } catch (err) {
        Swal.fire({
          title: '加入失敗',
          text: err?.message || '請稍後再試',
          icon: 'error',
          confirmButtonText: '知道了'
        });
      }
    })
  })

//??


  const formatPrice = (v) => `${Number(v ?? 0).toLocaleString('zh-TW')}<span>NT$</span>`;
  const toArray = (v) => Array.isArray(v) ? v : (v ? [v] : []);
  const toFullURL = (u) => (!u ? '' : (/^https?:\/\//.test(u) ? u : u)); // 如需前綴可在此加

  const onSuccess = (response) => {
    const product = response?.data ?? {};
    console.log('product:', product);

    // === 基本資訊 ===
    const nameEl = document.getElementById('product-name');
    if (nameEl) nameEl.textContent = product.name || '未命名';

    const priceEl = document.getElementById('product-price');
    if (priceEl) priceEl.innerHTML = formatPrice(product.price);

    const descEl = document.getElementById('product-description');
    if (descEl) descEl.textContent = product.description || '無描述';

    // === 分類 / 新舊 ===
    const categoryMap = {
      book: '書籍與學籍用品',
      life: '宿舍與生活用品',
      student: '學生專用器材',
      recycle: '環保生活用品',
      clean: '儲物與收納用品',
      other: '其他',
    };
    const newOrOldMap = {
      1 : '全新', 
      2 : '幾乎全新', 
      3 : '半新',
      4 : '適中', 
      5 : '稍舊', 
      6 : '全舊', 
    };
    const newOrOld = newOrOldMap?.[product.newOrOld] ?? product.newOrOld ?? '未標示';
    const category = categoryMap?.[product.category] ?? product.category ?? '未分類';
    const size = product.size;
    let updatedAt = product.updatedAt;
    const taiwanUpdateTime = new Date(updatedAt);
    // 格式化（只保留時:分）
    const updatedTime = taiwanUpdateTime.toLocaleString("zh-TW", { 
      timeZone: "Asia/Taipei",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    let createdAt = product.createdAt;
    const taiwanCreatedTime = new Date(createdAt);
    const createdTime = taiwanCreatedTime.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    // ==== 若專案還沒有工具函式，這裡給最小可用版 ====
const toArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);
const toFullURL = (u) => {
  if (!u) return '';
  try {
    // 已是絕對網址
    new URL(u);
    return u;
  } catch {
    // 不是絕對網址就當作相對路徑（依你專案調整 base）
    return u.startsWith('/') ? u : `/` + u;
  }
};

/* ---------- 工具：安全轉數字 + 金額格式 ---------- */
const num = (v, d = 0) => Number.isFinite(+v) ? +v : d;
const fmt = (v) => new Intl.NumberFormat('zh-Hant-TW').format(num(v, 0));

/* ---------- 1) 標題／價格／庫存／數量加減 ---------- */
(function renderBasics(){
  // 名稱
  const nameEl = document.getElementById('product-name');
  if (nameEl) nameEl.textContent = product?.name ?? '';

  // 價格（只放數字；右邊的 NT$ 已在 HTML）
  const priceEl = document.getElementById('price');
  if (priceEl) priceEl.textContent = fmt(product?.price);

  // 庫存
  const stockEl = document.getElementById('stock');
  const stock = num(product?.stock, 0);
  if (stockEl) stockEl.textContent = stock;

  // 數量加減（1 ~ 庫存（若庫存<=0 則固定為 0/不可購買，可依需求擋按鈕））
  const qtyInput = document.getElementById('qty');
  const plusBtn  = document.getElementById('plus');
  const minusBtn = document.getElementById('minus');

  function clampQty(v){
    v = Number(String(v).replace(/[^\d]/g,'')) || 1;
    if (stock > 0){
      if (v < 1) v = 1;
      if (v > stock) v = stock;
    }else{
      v = 0;
    }
    return v;
  }
  if (qtyInput){
    qtyInput.value = clampQty(qtyInput.value);
    qtyInput.addEventListener('input', () => qtyInput.value = clampQty(qtyInput.value));
  }
  plusBtn?.addEventListener('click', () => { qtyInput.value = clampQty(num(qtyInput.value) + 1); });
  minusBtn?.addEventListener('click', () => { qtyInput.value = clampQty(num(qtyInput.value) - 1); });
})();

/* ---------- 2) 規格／屬性（使用 <dl>） ---------- */
(function renderMeta() {
  const categoryList = document.getElementById('product-category');
  if (!categoryList) return;

  const ageText = (String(product?.age) === '-1' || product?.age == null)
    ? '未知' : `${product.age}年`;

  categoryList.innerHTML = `
    <dt class="col-sm-4 col-md-3">商品大小</dt><dd class="col-sm-8 col-md-9">${size ?? '-'}</dd>
    <dt class="col-sm-4 col-md-3">商品年齡</dt><dd class="col-sm-8 col-md-9">${ageText}</dd>
    <dt class="col-sm-4 col-md-3">新舊程度</dt><dd class="col-sm-8 col-md-9">${newOrOld ?? '未知'}</dd>
    <dt class="col-sm-4 col-md-3">分類</dt><dd class="col-sm-8 col-md-9">${category ?? '未分類'}</dd>
    <dt class="col-sm-4 col-md-3">上架時間</dt><dd class="col-sm-8 col-md-9">${createdTime ?? '-'}</dd>
    <dt class="col-sm-4 col-md-3">更新時間</dt><dd class="col-sm-8 col-md-9">${updatedTime ?? '-'}</dd>
  `;
})();

/* ---------- 3) 圖片（主圖＋縮圖，含錯誤 fallback） ---------- */
(function renderImages() {
  const mainImg   = document.querySelector('.tryimg');         // 主圖 <img>
  const thumbList = document.querySelector('.thumbnail-list'); // 縮圖容器

  // 3.1 建立清單：先 mainImage，再 imageUrl；排除空值
  const looksLikeUrl = (u) => !!u && (/^https?:\/\//i.test(u) || u.startsWith('/'));
  let list = toArray(product?.imageUrl).map(toFullURL).filter(Boolean);

  if (product?.mainImage && looksLikeUrl(product.mainImage)) {
    const main = toFullURL(product.mainImage);
    if (main && !list.some(u => toFullURL(u) === main)) list.unshift(main);
  }
  if (!list.length) list = ['https://picsum.photos/900/900?grayscale'];

  // 3.2 主圖切換 + 錯誤 fallback
  let currentIdx = 0;
  function setMainByIndex(idx){
    if (!mainImg) return;
    currentIdx = idx;
    mainImg.src = list[idx];
    mainImg.alt = product?.name ?? '';
    mainImg.loading = 'lazy';

    // active 標示
    thumbList?.querySelectorAll('.thumb-img').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });
  }

  if (mainImg){
    mainImg.onerror = () => {
      // 換下一張，直到可用或全部嘗試完
      const next = currentIdx + 1;
      if (next < list.length) setMainByIndex(next);
    };
  }

  // 3.3 產生縮圖
  if (thumbList){
    thumbList.innerHTML = '';
    list.forEach((src, idx) => {
      const imgEl = document.createElement('img');
      imgEl.src = src;
      imgEl.alt = `縮圖 ${idx + 1}`;
      imgEl.loading = 'lazy';
      imgEl.className = 'thumb-img' + (idx === 0 ? ' active' : '');
      imgEl.addEventListener('click', () => setMainByIndex(idx));
      thumbList.appendChild(imgEl);
    });
  }

  // 初始化主圖
  setMainByIndex(0);
})();

  
    // === 賣家資訊（保留；若有 API 就渲染） ===
    if (product?.owner) {
        const u = product.owner;

        // 先取出你原本的欄位（給預設值）
        const photo               = u.photoURL || '../image/default-avatar.png';
        const sellerName          = u.name || '賣家名稱';
        const sellerIntroduction  = u.introduction || '賣家簡介';
        // 這裡確保是數字；u.rate 可能是字串
        const sellerRate          = Number.isFinite(+u.rate) ? +u.rate : 0;
        const sellerId            = u.id ?? u.uid ?? u._id ?? '';

        // 組成 renderSellerInfo 需要的結構
        const data = {
          id: sellerId,
          name: sellerName,
          intro: sellerIntroduction,
          score: sellerRate,   // 注意：數字
          photoUrl: photo
        };

        renderSellerInfo(data);
    } else {
      // 沒有 owner：可隱藏整張卡
      document.getElementById('sellerInfo')?.classList.add('d-none');
      console.log('略過賣家資訊渲染');
    }
  };

// === 把資料渲染到 #sellerInfo ===
function renderSellerInfo(data) {
  const root = document.getElementById('sellerInfo');
  if (!root) return;

  const img       = document.getElementById('sellerPhoto');
  const nameEl    = document.getElementById('sellerName');
  const introEl   = document.getElementById('sellerIntro');
  const scoreEl   = document.getElementById('sellerRate');
  const chatBtn   = document.getElementById('sellerChat'); // 與賣家聊聊
  const rateBtn   = root.querySelector('#sellerRatebtn');               // 查看賣家評價
  const reportBtn = root.querySelector('sellerBad');            // 檢舉賣家

  // 灌資料（含預設值）
  if (img) {
    img.src = data.photoUrl || '../webP/default-avatar.webp';  // 和你的專案一致
    img.alt = data.name ? `${data.name} 的頭像` : '賣家頭像';
  }
  if (nameEl)  nameEl.textContent  = data.name  ?? '用戶名';
  if (introEl) introEl.textContent = data.intro ?? '這裡是我的自我介紹';
  if (scoreEl) scoreEl.textContent = Number.isFinite(+data.score) ? +data.score : 0;

  // 綁事件（依你的路由調整）
  if (chatBtn)   chatBtn.onclick   = () => openChatWithSeller(data.id);
  if (rateBtn)   rateBtn.onclick   = () => openSellerReviews(data.id);
  if (reportBtn) reportBtn.onclick = () => reportSeller(data.id);
}

// === 事件處理：依你的實作調整 ===
function openChatWithSeller(sellerId) {
  if (!sellerId) return;
  location.href = `../chat/?to=${encodeURIComponent(sellerId)}`;
}
function openSellerReviews(sellerId) {
  if (!sellerId) return;
  location.href = `../seller/reviews.html?seller=${encodeURIComponent(sellerId)}`;
}
function reportSeller(sellerId) {
  if (!sellerId) return;
  Swal.fire({
    title: '檢舉賣家',
    input: 'textarea',
    inputPlaceholder: '請描述檢舉事由（必要）',
    inputValidator: v => !v?.trim() ? '請填寫檢舉事由' : undefined,
    showCancelButton: true,
    confirmButtonText: '送出'
  }).then((res) => {
    if (!res.isConfirmed) return;
    backendService?.reportSeller?.(
      sellerId,
      { reason: res.value },
      () => Swal.fire({ icon: 'success', title: '已送出' }),
      (err) => Swal.fire({ icon: 'error', title: '送出失敗', text: String(err || '請稍後再試') })
    );
  });
}

//?<p class="userinfo">${sellerIntroduction}</p>
  const onError = (err) => {
    console.error('GetItemsInfo 失敗：', err);
  };

  // 呼叫 API（新版帶 id；若舊簽名不帶 id 則 fallback）
  try {
    backendService.getItemsInfo(id, onSuccess, onError);
  } catch (e) {
    console.warn('GetItemsInfo(id, ...) 呼叫失敗，嘗試舊簽名：', e);
    backendService.getItemsInfo(onSuccess);
  }
});
