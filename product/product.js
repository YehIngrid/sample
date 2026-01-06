// 全域變數（不要再用 const/let 重新宣告它）
let backendService = null;
let chatService = null;
let chatRoom = null;
const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})
let itemId = new URLSearchParams(location.search).get('id');
document.addEventListener('DOMContentLoaded', () => {
  const backendService = new BackendService();

  // 取得 URL ?id=xxx
  console.log('id:', itemId);
  if (!itemId) {
    console.warn('缺少商品 id');
    return;
  }

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
    const sizeMap = {
      0: '小',
      1: '中',
      2: '大'
    };
    const size = sizeMap?.[product.size] ?? product.size ?? '未標示';
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
  const wrap = document.getElementById('product-category');
  if (!wrap) return;

  const ageText =
    String(product?.age) === '-1' || product?.age == null ? '未知' : `${product.age}年`;

  const fields = [
    ['商品大小',  size ?? '-'],
    ['商品年齡',  ageText],
    ['新舊程度',  newOrOld ?? '未知'],
    ['分類',      category ?? '未分類'],
    ['上架時間',  createdTime ?? '-'],
    ['更新時間',  updatedTime ?? '-'],
  ];

  wrap.innerHTML = fields.map(([k, v]) => `
    <div class="row g-2 align-items-center mb-1 meta-row">
      <div class="col-4 col-md-3 text-muted">${k}</div>
      <div class="col-8 col-md-9">${v}</div>
    </div>
  `).join('');
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
        const sellerId            = u.accountId;

        // 組成 renderSellerInfo 需要的結構
        const data = {
          id: sellerId,
          name: sellerName,
          intro: sellerIntroduction,
          score: sellerRate,   // 注意：數字
          photoUrl: photo
        };

        renderSellerInfo(data);
        showSellerCommodities(sellerId); // 顯示賣家其他商品
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
  if (chatBtn)   chatBtn.onclick   = () => openChatWithSeller(itemId);
  if (rateBtn)   rateBtn.onclick   = () => openSellerReviews(data.id);
  if (reportBtn) reportBtn.onclick = () => reportSeller(data.id);
}

// === 事件處理：依你的實作調整 ===
function openChatWithSeller(itemId) {
  if (!itemId) {
    Swal.fire({ icon: 'warning', title: '無法與賣家聊天', text: '缺少商品編號' });
    return;
  } else {
    openCloseChatInterface();
    chatService = new ChatBackendService();
    chatService.createRoom(itemId)
      .then((data) => {
        const roomId = data?.roomId;
        if (roomId) {
          // TODO: 顯示聊天室介面（依你的路由調整）
          openCloseChatInterface();
        } else {
          Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
        }
      })
      .catch((err) => {
        console.error('建立聊天室失敗：', err);
        Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
      });
  }
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
    backendService.getItemsInfo(itemId, onSuccess, onError);
  } catch (e) {
    console.warn('GetItemsInfo(id, ...) 呼叫失敗，嘗試舊簽名：', e);
    backendService.getItemsInfo(onSuccess);
  }
});


document.addEventListener('DOMContentLoaded', () => {
  // 建立 service（注意：這裡不要再寫 const/let）
  backendService = new BackendService();

  // 綁定加入購物車按鈕
  document.querySelectorAll('.shopcart').forEach(btn => {
    btn.addEventListener('click', onAddToCart);
  });
});

async function onAddToCart(e) {
  const btn = e.currentTarget;

  // 防呆：service 是否就緒 & 方法存在
  if (!backendService || typeof backendService.addItemsToCart !== 'function') {
    console.error('backendService 尚未就緒或不存在 addItemsToCart：', backendService);
    Swal.fire({ icon: 'error', title: '系統尚未就緒', text: '請重新整理後再試' });
    return;
  }

  // 取商品 id（優先 data-id，退而求其次用 URL ?id）
  const id = btn.dataset.id || new URLSearchParams(location.search).get('id');
  if (!id) {
    Swal.fire({ icon: 'warning', title: '找不到商品編號' });
    return;
  }

  // 取數量：找同區塊的 .qty-input，找不到就用 1
  const qtyEl = btn.closest('.card, .product, body').querySelector?.('.qty-input');
  const quantity = Number(qtyEl ? qtyEl.value : 1) || 1;

  btn.disabled = true;
  try {
    await backendService.addItemsToCart(id, quantity);
    await Swal.fire({
      title: '已加入購物車！',
      icon: 'success', 
      showConfirmButton: false,
      timer: 1600,
    });
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || '請稍後再試';
    if (String(msg).toLowerCase().includes('stock')) {
      Swal.fire({ icon: 'warning', title: '庫存不足', text: msg });
    } else if (String(msg).toLowerCase().includes('No JWT token provided')) {
      Swal.fire({ icon: 'warning', title: '請先登入才可將商品加入購物車', text: msg });
    } else {
      Swal.fire({ icon: 'error', title: '加入失敗', text: msg });
    }
  } finally {
    btn.disabled = false;
  }
}
// Promise 版
async function showSellerCommodities(id) {
  const sellerCommodities = document.querySelector('#otherProducts');
  console.log('sellerCommodities:', sellerCommodities);
  if (!sellerCommodities) return;

  const formatPrice = (v) => `${Number(v ?? 0).toLocaleString('zh-TW')}<span>NT$</span>`;
  const toFullURL = (u) => (!u ? '' : (/^https?:\/\//.test(u) ? u : u));

  try {
    const response = await backendService.getUserCommodities(id); // ← 這裡假設回傳 Promise
    const products = response?.data?.data.commodities ?? [];
    console.log('賣家商品：', products);
    if (!Array.isArray(products) || products.length === 0) {
      sellerCommodities.style.display = 'none';
      return;
    }

    sellerCommodities.style.display = ''; // 確保顯示
    sellerCommodities.innerHTML = '';

    const frag = document.createDocumentFragment();

    products.forEach((product) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4 mb-3'; // 手機1排、平板2排、電腦4排
    
      const card = document.createElement('div');
      card.className = 'card h-100';
    
      const row = document.createElement('div');
      row.className = 'row g-5'; // 去掉間距，讓圖片與內容貼齊
    
      // 左邊圖片
      const imgCol = document.createElement('div');
      imgCol.className = 'col-4'; // 圖片占左側寬度
    
      const img = document.createElement('img');
      img.src = toFullURL(product.mainImage) || 'https://picsum.photos/300/300?grayscale';
      img.className = 'rounded-start otherimg object-fit-cover'; // 確保圖片不變形
      img.alt = product.name || '商品圖片';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => { img.src = 'https://picsum.photos/300/300?grayscale'; };
      imgCol.appendChild(img);
    
      // 右邊文字區塊
      const bodyCol = document.createElement('div');
      bodyCol.className = 'col-8 d-flex flex-column'; // 右側資訊區
    
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body d-flex flex-column';
    
      const title = document.createElement('h5');
      title.className = 'card-title ellipsis-text';
      title.textContent = product.name || '未命名';
    
      const price = document.createElement('p');
      price.className = 'card-text mt-auto mb-2';
      price.innerHTML = formatPrice(product.price);
    
      const link = document.createElement('a');
      const pid = product.id ?? product._id ?? product.commodityId ?? '';
      link.href = `./product.html?id=${encodeURIComponent(pid)}`;
      link.className = 'btn btn-primary w-100 mt-auto';
      link.textContent = '查看商品';
    
      cardBody.appendChild(title);
      cardBody.appendChild(price);
      cardBody.appendChild(link);
      bodyCol.appendChild(cardBody);
    
      // 組合結構
      row.appendChild(imgCol);
      row.appendChild(bodyCol);
      card.appendChild(row);
      col.appendChild(card);
      frag.appendChild(col);
    });
    
    sellerCommodities.appendChild(frag);
    
  } catch (err) {
    console.error('取得賣家商品失敗：', err);
    sellerCommodities.style.display = 'none';
  }
}
async function orderNow(productId) {
  try {
    const response = await backendService.addItemsToCart({
      productId: productId,
      quantity: 1
    });

    if (response.status === 200) {
      // 加入購物車成功，跳轉到購物車頁
      window.location.href = "../shoppingcart/shoppingcart.html";
    } else {
      alert("訂單頁面跳轉失敗，請稍後再試");
    }
  } catch (err) {
    console.error(err);
    alert("發生錯誤，請稍後再試");
  }
}
// 聊天室介面顯示與隱藏
const chatopen = document.getElementById('chaticon');
const chatclose = document.getElementById('closechat');
const talkInterface = document.getElementById('talkInterface');
chatopen.addEventListener('click', function(e){
    openCloseChatInterface();
})
function openCloseChatInterface(){
  if(!backendService.whoami()){
    Swal.fire({
      title: '請先登入會員',
      icon: 'warning',
      confirmButtonText: '確定'
    });
    return;
  }
  if (talkInterface.style.display === 'none' || talkInterface.style.display === '') {
    talkInterface.style.display = 'block'; // 顯示
    chatService = new ChatBackendService();
    const itemName = document.getElementById('product-name').textContent || '商品';
    const userId = backendService.whoami().id || backendService.whoami().accountId;
    const sellerId = null;
    chatService.createRoom(itemName, String(userId), String(sellerId))
      .then((data) => {
        const roomId = data?.roomId;
        if (roomId) {
          chatRoom = new ChatRoom(chatService, roomId, talkInterface);
          chatRoom.init();
        } else {
          Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
        }
      })
      .catch((err) => {
        console.error('建立聊天室失敗：', err);
        Swal.fire({ icon: 'error', title: '無法建立聊天室', text: '請稍後再試' });
      });
  } else {
    talkInterface.style.display = 'none'; // 隱藏
  }
  console.log('chat open');
}