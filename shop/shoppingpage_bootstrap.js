let backendService;
let loginService;

const midcontent = document.getElementById('midcontent');
//JavaScript: 控制左右按鈕捲動

  const scrollContainer = document.getElementById('scrollContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // 點擊「←」按鈕，向左捲動
  prevBtn.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: -200,       // 向左捲動 200px
      behavior: 'smooth'
    });
  });

  // 點擊「→」按鈕，向右捲動
  nextBtn.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: 200,        // 向右捲動 200px
      behavior: 'smooth'
    });
  });
// TODO seller
const seller = document.getElementById('seller');
const sellerbtn = document.getElementById('sellerbtn');
sellerbtn.addEventListener('click', function(e) {
  seller.style.display = 'block';
  midcontent.style.display = 'none';
})

const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
  midcontent.style.display = 'block';
  seller.style.display = 'none';
})
// 取得元素
const modal = document.getElementById('myModal');
const openBtn = document.getElementById('openModal');
const closeBtn = document.getElementById('closeModal');

// 點擊按鈕時打開模態視窗
openBtn.addEventListener('click', () => {
  modal.style.display = 'block';
});

// 點擊關閉按鈕時關閉模態視窗
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// 當點擊模態背景也關閉模態視窗
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});


document.addEventListener('DOMContentLoaded', function() {
  backendService = new BackendService();
  loginService = new LoginService(backendService);
  let page = 1;
  let limit = 6;
  const listEl = document.getElementById('hotItems');
  const prevHotBtn = document.getElementById("prevHotBtn");
  const nextHotBtn = document.getElementById("nextHotBtn");
  const pageInfo = document.getElementById("pageInfo");

  fetchPage(page);



  if (backendService.isLoggedIn()) {
    colnsole.log('使用者已登入');
    document.getElementById('loginornot').textContent = '登出';
    document.getElementById('username').textContent = localStorage.getItem('username') || "username";
  } else {
    Swal.fire({
      title: "請登入",
      text: "你尚未登入，請先登入以繼續。",
      icon: "warning",
      confirmButtonText: "去登入"
    }).then(() => {
      window.location.href = "../account/account.html"; // 導向登入頁面
    });
  }
function fetchPage(p){
  const pagingInfo = { page: p, limit: limit };
  backendService.getHotItems(pagingInfo, (response) => {
    const items = response?.data?.commodities ?? [];
    const pg = response?.data?.pagination ?? {};
    page = pg.currentPage ?? p;

    renderItems(items);
    updatePager(pg);
  });
}
function renderItems(items){
  listEl.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement("div");
      div.className = "hot-item";
      div.dataset.id = item.id;
      div.innerHTML = `
        <img src="${item.mainImage}" alt="${item.name}">
        <p class="hotItemPrice">${item.price}<span style="font-size: 1.4rem;">NT$</span></p>
      `;
    listEl.appendChild(div);
    div.addEventListener('click', function() {
      const pid = this.dataset.id;
      if (pid) location.href = `../product/product.html?id=${encodeURIComponent(pid)}`;
    })
  });
}
function updatePager(pg){
  prevHotBtn.disabled = !pg.hasPrevPage;
  nextHotBtn.disabled = !pg.hasNextPage;
  pageInfo.textContent = `第 ${pg.currentPage} / ${pg.totalPages} 頁`;
}

prevHotBtn.addEventListener("click", () => {
  if (page > 1) fetchPage(page - 1);
});
nextHotBtn.addEventListener("click", () => {
  fetchPage(page + 1);
});
  // 確保所有 DOM 元素都已經載入
  const openModalBtn = document.getElementById('create');
  console.log('openModal 按鈕:', openModalBtn);
  
  // 將 submit 事件綁定到 form 上
  openModalBtn.addEventListener('click', function(e) {
    e.preventDefault(); // 防止表單預設送出
    createCommodity();
  });

 
  async function createCommodity() {
  // 1. 商品名稱
  const nameEl = document.getElementById('name');
  if (!nameEl.value.trim()) {
    Swal.fire({ title: "請輸入商品名稱", icon: "warning" });
    return;
  }

  // 2. 商品描述
  const desc = document.getElementById('description').value.trim();
  if (!desc) {
    Swal.fire({ title: "請輸入商品描述", icon: "warning" });
    return;
  } else if (desc.length < 10) {
    Swal.fire({ title: "字數太少", text: "商品狀態描述至少需要 10 字以上，請再補充內容。", icon: "warning" });
    return;
  }

  // 3. 售價（數字檢查）
  const priceStr = document.getElementById('price').value.trim();
  const price = Number(priceStr);
  if (priceStr === '' || Number.isNaN(price) || price < 0) {
    Swal.fire({ title: "請輸入商品售價", text: "請確認金額為非負數", icon: "warning" });
    return;
  }

  // 4. 尺寸
  if (![...document.getElementsByName('size')].some(x => x.checked)) {
    Swal.fire({ title: "請選擇商品尺寸", icon: "warning" });
    return;
  }

  // 5. 新舊程度
  if (![...document.getElementsByName('new_or_old')].some(x => x.checked)) {
    Swal.fire({ title: "請選擇商品的新舊程度", icon: "warning" });
    return;
  }

  // 6. 分類
  const category = document.getElementById('category').value;
  if (!category || category === 'notselyet') {
    Swal.fire({ title: "請選擇商品分類", icon: "warning" });
    return;
  }

  // 7. 主要照片
  if (document.getElementById('mainImage').files.length === 0) {
    Swal.fire({ title: "請上傳主要照片", icon: "warning" });
    return;
  }
  // 8. 其他照片
  if (document.getElementById('image').files.length === 0) {
    Swal.fire({ title: "請至少上傳一張其他照片", icon: "warning" });
    return;
  }

  // 9. 庫存（數字檢查）
  const stockStr = document.getElementById('stock').value.trim();
  const stock = Number(stockStr);
  if (stockStr === '' || Number.isNaN(stock) || stock < 0) {
    Swal.fire({ title: "請填入庫存數量", icon: "warning" });
    return;
  }

  // 10. 年齡（允許 -1 表示不詳）
  const ageStr = document.getElementById('age').value.trim();
  const age = Number(ageStr);
  if (ageStr === '' || Number.isNaN(age) || age < -1) {
    Swal.fire({ title: "請選擇商品年齡", icon: "warning" });
    return;
  }

  // 二次確認
  const confirmRes = await Swal.fire({
    title: "確定要販賣此商品?",
    text: "請確認所有商品資訊與照片皆符合規定。",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "是，我就要賣！"
  });
  if (!confirmRes.isConfirmed) return;

  const loaderOverlay = document.getElementById('loadingOverlay');
  loaderOverlay?.classList.remove('d-none');

  const formEl = document.getElementById('createCommodityForm');
  const sellData = new FormData(formEl);
  // 保險起見，把數字欄位用 set 覆蓋成數字字串
  sellData.set('price', String(price));
  sellData.set('stock', String(stock));
  sellData.set('age', String(age));

  const backendService = new BackendService();

  try {
    await backendService.create(sellData);
    await Swal.fire({
      title: "商品上架成功!",
      text: "請至首頁確認是否顯示您的商品",
      icon: "success"
    });
    formEl.reset();
    window.location.href = "shoppingpage_bootstrap.html";
  } catch (e) {
    Swal.fire({
      title: "Oops...發生錯誤，請稍後再試",
      text: e?.message || 'Failed to create commodity.',
      icon: "error"
    });
  } finally {
    loaderOverlay?.classList.add('d-none');
  }
}
})
document.getElementById('mainImage').addEventListener('change', function (e) {
  const preview = document.getElementById('mainImagePreview');
  preview.innerHTML = ''; // 清除舊圖

  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 500000) {
    Swal.fire({
      icon: 'warning',
      title: '照片太大',
      text: '單張照片不能超過 500KB，請壓縮後再上傳。'
    });
  }
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = document.createElement('img');
    img.src = event.target.result;
    img.style.width = '150px';
    img.style.borderRadius = '8px';
    img.style.border = '1px solid #ccc';
    img.style.boxShadow = '0 0 6px rgba(0,0,0,0.1)';
    preview.appendChild(img);
  };
  reader.readAsDataURL(file);
});

document.getElementById('image').addEventListener('change', function (e) {
  const preview = document.getElementById('previewArea');
  preview.innerHTML = ''; // 清空舊的

  const files = e.target.files;
  console.log("共選了", files.length, "張圖片");

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.style.width = '100px';
      img.style.margin = '5px';
      img.style.objectFit = 'cover';
      img.style.border = '1px solid #ccc';
      img.style.borderRadius = '8px';
      preview.appendChild(img);
    };
    if (file.size > 500000) {
      Swal.fire({
        icon: 'warning',
        title: '照片太大',
        text: '單張照片不能超過 500KB，請壓縮後再上傳。'
      });
    }
    reader.readAsDataURL(file);
  });
});
// TODO wishpool
const wishpool = document.getElementById('wishpool');
const backbtn1 = document.getElementById('back-btn1');
const wishpoolbtn = document.getElementById('wishpoolbtn');
// const talkInterface = document.getElementById('talkInterface');
wishpoolbtn.addEventListener('click', function(e){
  wishpool.style.display = 'block';
  console.log('hello');
  midcontent.style.display = 'none';
  talkInterface.style.display = 'none';
})
backbtn1.addEventListener('click', function(e){
  wishpool.style.display = 'none';
  console.log('hiii');
  midcontent.style.display = 'block';
  talkInterface.style.display = 'block';
})
// TODO member
const member = document.getElementById('member');
const memberbtn = document.getElementById('memberbtn');
const backbtn2 = document.getElementById('back-btn2');
memberbtn.addEventListener('click', function(e){
  member.style.display = 'block';
  midcontent.style.display = 'none';
  talkInterface.style.display = 'none';
})
backbtn2.addEventListener('click', function(e){
  member.style.display = 'none';
  talkInterface.style.display = 'block';
  midcontent.style.display = 'block';
})
// TODO mystery
// const mystery = document.getElementById('mystery');
// const mysterybtn = document.getElementById('mysterybtn');
// const backbtn3 = document.getElementById('back-btn3');
// mysterybtn.addEventListener('click', function(e){
//   mystery.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn3.addEventListener('click', function(e){
//   mystery.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// })
// TODO everyday
// const everyday = document.getElementById('everyday');
// const everydaybtn = document.getElementById('everydaybtn');
// const backbtn4 = document.getElementById('back-btn4');
// everydaybtn.addEventListener('click', function(e){
//   everyday.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn4.addEventListener('click', function(e){
//   everyday.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// })
// TODO donate
// const donate = document.getElementById('donate');
// const donatebtn = document.getElementById('donatebtn');
// const backbtn5 = document.getElementById('back-btn5');
// donatebtn.addEventListener('click', function(e){
//   donate.style.display = 'block';
//   midcontent.style.display = 'none';
//   talkInterface.style.display = 'none';
// })
// backbtn5.addEventListener('click', function(e){
//   donate.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// })
// TODO 校園攻略站
// const campus = document.getElementById('campus');
// const campusbtn = document.getElementById('campusbtn');
// const backbtn6 = document.getElementById('back-btn6');
// campusbtn.addEventListener('click', function(e){
//   // window.location.href = '../school/school.html';
//   // campus.style.display = 'block';
//   // midcontent.style.display = 'none';
//   // talkInterface.style.display = 'none';
// });
// backbtn6.addEventListener('click', function(e){
//   campus.style.display = 'none';
//   midcontent.style.display = 'block';
//   talkInterface.style.display = 'block';
// });

// TODO 陳列商品


//?, orders: [{prop:'price',asc: false}, {prop:'id', asc:true}]
document.addEventListener('DOMContentLoaded', () => {
  let page = 1;
  const limit = 12;

  const container = document.getElementById('product-grid');
  const prevBtn   = document.getElementById('newPrev');
  const nextBtn   = document.getElementById('newNext');
  const pageInfo  = document.getElementById('newInfo');

  if (!container) {
    console.warn('#product-grid 容器不存在');
    return;
  }

  // 初始化排版（只做一次）
  [...container.classList].forEach(cls => {
    if (cls.startsWith('row-cols-')) container.classList.remove(cls);
  });
  container.classList.add('row', 'row-cols-2', 'row-cols-md-3', 'row-cols-lg-6', 'g-3', 'mt-4', 'container-card');

  // 進入點
  fetchPage(page);

  // 事件
  prevBtn.addEventListener('click', () => { if (!prevBtn.disabled) fetchPage(page - 1); });
  nextBtn.addEventListener('click', () => { if (!nextBtn.disabled) fetchPage(page + 1); });

  // 主要流程
  function fetchPage(p){
    togglePager(true); // ← 打 API 前先讓按鈕都停用 + 顯示載入中

    const pagingInfo = { page: p, limit };
    backendService.getNewItems(pagingInfo, (response) => {
      const productList = response?.data?.commodities ?? [];
      const pg = response?.data?.pagination ?? { currentPage: p, totalPages: 1, hasPrevPage: p>1, hasNextPage: false };

      renderItems(productList);
      updatePager(pg); // ← API 回來後才決定按鈕狀態（enabled/disabled）
    });
  }

  function renderItems(productList){
    container.innerHTML = '';

    productList.forEach((product) => {
      // col
      const col = document.createElement('div');
      col.className = 'col';

      // card
      const card = document.createElement('div');
      card.className = 'card product-card position-relative h-100';
      card.dataset.id = product.id;
      card.style.width = '100%';

      const imgUrl = product.mainImage || '/img/placeholder.png';
      const categoryMap = {
        book: '書籍與學籍用品',
        life: '宿舍與生活用品',
        student: '學生專用器材',
        other: '其他',
        recycle: '環保生活用品',
        clean: '儲物與收納用品',
      };
      const newOrOldMap = {
        1:'全新',2:'幾乎全新',3:'半新',4:'適中',5:'稍舊',6:'全舊',
      };
      const category = categoryMap[product.category] ?? '其他';
      const newOrOld = newOrOldMap[product.newOrOld] ?? '';

      card.innerHTML = `
        <button class="favorite-btn" type="button" aria-label="加入收藏">
          <i class="fa-regular fa-star"></i>
        </button>
        <div class="product-thumb">
          <img src="${imgUrl}" alt="${product.name ?? ''}" loading="lazy">
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title ellipsis-text">${product.name ?? ''}</h5>
          <p class="card-text text-muted mb-2 ellipsis-text"># ${category} ${newOrOld ? `# ${newOrOld}` : ''}</p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold price">NT$ ${product.price ?? ''}</span>
              <small class="text-muted">庫存 ${product.stock ?? 0}</small>
            </div>
          </div>
        </div>
      `;

      // 收藏按鈕（保留你的互動）
      const favBtn  = card.querySelector('.favorite-btn');
      const favIcon = favBtn.querySelector('i');
      favBtn.addEventListener('click', (e) => {
        const isNowFav = !favIcon.classList.contains('fa-solid');
        if (isNowFav) {
          favIcon.classList.add('fa-solid');
          favIcon.classList.remove('fa-regular');
          Swal.fire({
            title: '已加入收藏！',
            text: '這個商品已經加到你的收藏清單',
            iconHtml: '<i class="fa-solid fa-star" style="color:gold;font-size:3.2rem"></i>',
            customClass: { icon: 'goldborder' }
          });
        } else {
          favIcon.classList.add('fa-regular');
          favIcon.classList.remove('fa-solid');
          Swal.fire({
            title: '已取消收藏',
            iconHtml: '<i class="fa-regular fa-star" style="color:#999;font-size:3.2rem"></i>',
            customClass: { icon: 'no-border' }
          });
        }
        e.preventDefault();
        e.stopPropagation();
        // TODO: 呼叫收藏/取消收藏 API，使用 card.dataset.id
      });

      // 卡片導頁
      card.addEventListener('click', () => {
        const pid = card.dataset.id;
        if (pid) location.href = `../product/product.html?id=${encodeURIComponent(pid)}`;
      });

      col.appendChild(card);
      container.appendChild(col);
    });
  }

  function updatePager(pg){
    page = pg.currentPage;
    pageInfo.textContent = `第 ${pg.currentPage} / ${pg.totalPages} 頁`;
    prevBtn.disabled = !pg.hasPrevPage;
    nextBtn.disabled = !pg.hasNextPage;
  }

  function togglePager(loading){
  if (loading) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '載入中…';
  }
  // ❌ 不要在這裡加 else 去改按鈕，否則會覆蓋 updatePager 的判斷
}

});


// 切換 icon 工具
function toggleIcon(iconEl, toFav) {
  if (toFav) {
    iconEl.classList.remove('fa-regular');
    iconEl.classList.add('fa-solid');
  } else {
    iconEl.classList.remove('fa-solid');
    iconEl.classList.add('fa-regular');
  }
}

// 建立收藏按鈕事件
favBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const pid = card.dataset.id;   // 商品 id
  const isNowFav = !favIcon.classList.contains('fa-solid'); 
  // ⬆️ 判斷目前是不是「空心」圖示，如果是，就要加入收藏；如果已經實心，就要取消收藏

  // 樂觀更新：先切 icon
  toggleIcon(favIcon, isNowFav);

  try {
    if (isNowFav) {
      await backend.addFavorite(pid);   // 呼叫新增 API
      Swal.fire({
        title: '已加入收藏！',
        iconHtml: '<i class="fa-solid fa-star" style="color:gold;font-size:2.5rem"></i>',
        customClass: { icon: 'no-border' }
      });
    } else {
      await backend.removeFavorite(pid); // 呼叫刪除 API
      Swal.fire({
        title: '已取消收藏',
        iconHtml: '<i class="fa-regular fa-star" style="color:#999;font-size:2.5rem"></i>',
        customClass: { icon: 'no-border' }
      });
    }
  } catch (err) {
    // API 失敗 → 還原 icon
    toggleIcon(favIcon, !isNowFav);
    Swal.fire({
      title: '操作失敗',
      text: '請稍後再試',
      icon: 'error'
    });
  }
});

// TODO 學力銀行

const grid = document.getElementById('product-grid');
const pagination = document.getElementById('pagination');
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 12;


function renderPagination() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.style.margin = '10px 4px';
    btn.style.padding = '6px 11px';
    btn.style.borderRadius = '50px';
    btn.style.border = 'none';
    btn.style.background = i === currentPage ? 'linear-gradient(to left bottom, rgba(36,182,133,0.4), #004b9750)' : '#fbfbfb';
    btn.style.color = i === currentPage ? '#fff' : '#000';

    btn.addEventListener('click', () => {
      currentPage = i;
      renderPage(currentPage);
      renderPagination();
      window.scrollTo({
        top: document.getElementById('product-grid').offsetTop,
        behavior: 'smooth'
      });
    });

    pagination.appendChild(btn);
  }
}


