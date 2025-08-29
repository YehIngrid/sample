let backendService;
let loginService;

// //當整個頁面載入完成後，隱藏 loader 並顯示主要內容
// window.onload = function() {
//   // 當頁面載入完畢後隱藏載入動畫，顯示內容
//   var loader = document.getElementById('loader');
//   var content = document.getElementById('whatcontent');
// if (loader && content) {
//   loader.style.setProperty('display', 'none', 'important');
//   content.style.setProperty('display', 'block', 'important');
// }
// };
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
  const dotsEl = document.getElementById('hotDots');
  fetchPage(page);
  // let pagingInfo = {page: page, limit: limit};
  // console.log("gethotitems:", response.data.commodities);
  
  // backendService.getHotItems(pagingInfo, (response) => {
    
  //   // const hotItems = response.data.commodities;
  //   // const container = document.getElementById("hotItems");
  //   // if(response.data.pagination.hasNextPage) {

  //   // }
  //   // hotItems.forEach(item => {
  //   //   const div = document.createElement("div");
  //   //   div.className = "hot-item";
  //   //   div.innerHTML = `
  //   //     <img src="${item.mainImage}" alt="${item.name}">
  //   //     <p class="hotItemPrice">${item.price}<span style="font-size: 1.4rem;">NT$</span></p>
  //   //   `;
  //   //   container.appendChild(div);
  //   //   // const pid = item.dataset.id;
  //   //   // if (pid) location.href = `../product/product.html?id=${encodeURIComponent(pid)}`;
  //   // });
  // }, (errorMessage) => {
  //   console.error("gethotitems:", errorMessage);
  // })

  if (loginService.isLogin()) {
    Swal.fire({
      title: "歡迎回來！",
      text: `你好! ${localStorage.getItem('uid')}`,
      icon: "success",
      confirmButtonText: "繼續" 
    }).then(() => {
      // 這裡可以添加用戶登入後的操作，例如載入用戶資料等
      // window.location.href = "shoppingpage_bootstrap.html"; // 導向購物頁面
      backendService.getUserData(
        (response) => {
          console.log("使用者資料哈哈：", response);
          document.getElementById('username').textContent = response.data.name || '使用者';
          console.log("使用者名稱：", response.data.name);
          console.log("使用者介紹：", response.data.introduction);
          console.log("使用者頭像：", response.data.avatar);
          console.log("使用者ID：", response.data.uid);
        }, 
        (errorMessage) => {
          console.error("無法取得使用者資料：", errorMessage);
        }
      );
    });
    document.getElementById('loginornot').textContent = '登出';
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
    renderDots(pg.totalPages, page);  // 直接用 totalPages 畫點
  });
}
function renderItems(items){
  listEl.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement("div");
      div.className = "hot-item";
      div.innerHTML = `
        <img src="${item.mainImage}" alt="${item.name}">
        <p class="hotItemPrice">${item.price}<span style="font-size: 1.4rem;">NT$</span></p>
      `;
    listEl.appendChild(card);
  });
}
function renderDots(totalPages, current){
  dotsEl.innerHTML = '';
  for(let i=1; i<=totalPages; i++){
    const btn = document.createElement('button');
    if(i === current) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (i !== page) fetchPage(i);
    });
    dotsEl.appendChild(btn);
  }
}
  // 確保所有 DOM 元素都已經載入
  const form = document.getElementById('createCommodityForm');
  const openModalBtn = document.getElementById('openModal');
  console.log('openModal 按鈕:', openModalBtn);
  
  // 將 submit 事件綁定到 form 上
  form.addEventListener('submit', function(e) {
    e.preventDefault(); // 防止表單預設送出
    createCommodity();
  });

  // 將 createCommodity 定義在全域或 DOMContentLoaded 區塊中皆可，
  // 但注意：如果 HTML 中使用了 inline onsubmit，就必須確保這個函式能在全域中存取
  function createCommodity() {
    // 1. 商品名稱檢查（注意：要檢查 value）
    const productName = document.getElementById('name');
    if (!productName.value.trim()) {
      Swal.fire({
        title: "請輸入商品名稱",
        icon: "warning"
      });
      return;
    }

    // 2. 商品描述檢查（不得為空，且至少20字以上）
    const productDesc = document.getElementById('description').value.trim();
    if (!productDesc) {
      Swal.fire({
        title: "請輸入商品描述",
        icon: "warning"
      });
      return;
    } else if (productDesc.length < 10) {
      Swal.fire({
        title: "字數太少",
        text:"商品狀態描述至少需要 10 字以上，請再補充內容。",
        icon: "warning"
      });
      return;
    }

    // 3. 售價檢查（不得為空且必須大於等於 0）
    const price = document.getElementById('price').value.trim();
    if (!price || price < 0) {
      Swal.fire({
        title: "請輸入商品售價",
        text: "請檢查是否填入商品售價或者確認金額為正數",
        icon: "warning"
      });
      return;
    }

    // 4. 商品尺寸檢查（至少要選一個）
    const sizeOptions = document.getElementsByName('size');
    let sizeSelected = false;
    for (let i = 0; i < sizeOptions.length; i++) {
      if (sizeOptions[i].checked) {
        sizeSelected = true;
        break;
      }
    }
    if (!sizeSelected) {
      Swal.fire({
        title: "請選擇商品尺寸",
        icon: "warning"
      });
      return;
    }

    // 5. 新舊程度檢查（至少要選一個）
    const conditionOptions = document.getElementsByName('new_or_old');
    let conditionSelected = false;
    for (let i = 0; i < conditionOptions.length; i++) {
      if (conditionOptions[i].checked) {
        conditionSelected = true;
        break;
      }
    }
    if (!conditionSelected) {
      Swal.fire({
        title: "請選擇商品的新舊程度",
        icon: "warning"
      });
      return;
    }

    // 6. 商品分類檢查（不可為預設值）
    const category = document.getElementById('category').value;
    if (!category || category === "notselyet") {
      Swal.fire({
        title: "請選擇商品分類",
        icon: "warning"
      });
      return;
    }

    // 7. 主要照片檢查（至少選一張）
    const mainPhoto = document.getElementById('mainImage').files;
    if (mainPhoto.length === 0) {
      Swal.fire({
        title: "請上傳主要照片",
        icon: "warning"
      });
      return;
    }
    // 8. 其他照片檢查（至少選一張）
    const otherPhoto = document.getElementById('image').files;
    if(otherPhoto.length === 0){
      Swal.fire({
        title: "請至少上傳一張其他照片",
        icon: "warning"
      });
      return;
    }
    // 9.庫存
    const stock = document.getElementById('stock').value.trim();
    if(!stock || stock < 0){
      Swal.fire({
        title:"請填入庫存數量", 
        icon:"warning"
      });
      return;
    }
    //10.物品年齡
    const age = document.getElementById('age').value.trim();
    if(!age || age < -1){
      Swal.fire({
        title:"請選擇商品年齡",
        icon:"warning"
      });
      return;
    }
    const loaderOverlay = document.getElementById('loadingOverlay');

Swal.fire({
  title: "確定要販賣此商品?",
  text: "請確認好所有商品資訊以及照片是否違反規定，若後續需要更改或移除資料，請至個人檔案內查看。",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#3085d6",
  cancelButtonColor: "#d33",
  confirmButtonText: "是，我就要賣！"
}).then((result) => {
  if (result.isConfirmed) {
    const sellData = new FormData(form);
    // ✅ 顯示 loading 遮罩
    loaderOverlay.classList.remove('d-none');
    for (let [key, value] of sellData.entries()) {
      console.log(key, value);
    }
    backendService.create(sellData, (
    response) => {
      Swal.fire({
                  title: response,
                  text: "請確認首頁商品欄有無您上架的商品",
                  icon: "success"
                })
    .then((result) => {
        if (result.isConfirmed) {
          // ✅ 使用者按下 OK 後跳轉
          window.location.href = "shoppingpage_bootstrap.html";
        }
      });
    form.reset();
    }, (errorMessage) => {
      Swal.fire({
              title: "Oops...發生錯誤，請稍後再試",
              text: errorMessage || 'Failed to create commodity.',
              icon: "error",
            })
    } )
      .finally(() => {
        // ✅ 隱藏 loading
        loaderOverlay.classList.add('d-none');
      });
  }
});

    
  }
});
document.getElementById('mainImage').addEventListener('change', function (e) {
  const preview = document.getElementById('mainImagePreview');
  preview.innerHTML = ''; // 清除舊圖

  const file = e.target.files[0];
  if (!file) return;

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
// document.addEventListener('DOMContentLoaded', () => {
//   backendService.GetNewItems((response) => {
//     const productList = response?.data?.commodities ?? [];
//     console.table(productList.map(p => ({ id: p.id, name: p.name, price: p.price })));

//     const container = document.getElementById('product-grid');
//     if (!container) {
//       console.warn('#product-grid 容器不存在');
//       return;
//     }

//     // 清空舊內容避免重複
//     container.innerHTML = '';

//     productList.forEach((product) => {
//       // Bootstrap column 外層
//       const col = document.createElement('div');
//       col.className = 'col';

//       // 卡片
//       const card = document.createElement('div');
//       card.className = 'card product-card h-100';
//       card.dataset.id = product.id;         // 保留你的 data-id
//       card.style.width = '100%';            // 交給格線排版

//       // 圖片 URL（直接用你回傳的 mainImage）
//       const imgUrl = product.mainImage || '/img/placeholder.png';

//       card.innerHTML = `
//         <img class="card-img-top" src="${imgUrl}" alt="${product.name ?? ''}" loading="lazy">
//         <div class="card-body d-flex flex-column">
//           <h5 class="card-title mb-1">${product.name ?? ''}</h5>
//           <p class="card-text text-muted mb-2">ID: ${product.id}</p>
//           <p class="card-text flex-grow-1">${product.description ?? ''}</p>
//           <div class="mt-auto">
//             <div class="d-flex justify-content-between align-items-center">
//               <span class="fw-bold">NT$ ${product.price ?? ''}</span>
//               <small class="text-muted">庫存 ${product.stock ?? 0}</small>
//             </div>
//           </div>
//         </div>
//       `;

//       // 點卡片導到詳情頁（可保留）
//       card.addEventListener('click', () => {
//         location.href = `../product/product.html?id=${encodeURIComponent(product.id)}`;
//       });

//       col.appendChild(card);
//       container.appendChild(col);
//     });
//   });
// });

//?, orders: [{prop:'price',asc: false}, {prop:'id', asc:true}]
document.addEventListener('DOMContentLoaded', () => {
  let page = 1;
  let limit = 12;
  let pagingInfo = {page: page, limit: limit};
  backendService.getNewItems(pagingInfo, (response) => {
    const productList = response?.data?.commodities ?? [];
    console.table(productList.map(p => ({ id: p.id, name: p.name, price: p.price })));

    const container = document.getElementById('product-grid');
    if (!container) {
      console.warn('#product-grid 容器不存在');
      return;
    }

    // 先把舊的 row-cols-* 清掉，避免與新設定衝突
    [...container.classList].forEach(cls => {
      if (cls.startsWith('row-cols-')) container.classList.remove(cls);
    });
    // 套用：手機2、平板3、桌機6（也保留間距與外觀）
    container.classList.add('row', 'row-cols-2', 'row-cols-md-3', 'row-cols-lg-6', 'g-3', 'mt-4', 'container-card');

    // 清空舊內容避免重複
    container.innerHTML = '';

    productList.forEach((product) => {
      // Bootstrap column 外層
      const col = document.createElement('div');
      col.className = 'col';

      // 卡片
      const card = document.createElement('div');
      card.className = 'card product-card position-relative h-100';
      card.dataset.id = product.id;         // 保留你的 data-id
      card.style.width = '100%';            // 交給格線排版

      // 圖片 URL（直接用你回傳的 mainImage）
      const imgUrl = product.mainImage || '/img/placeholder.png';
      const categoryMap = {
        book: '書籍與學籍用品',
        life: '宿舍與生活用品',
        student: '學生專用器材',
        other: '其他',
        recycle: '環保生活用品',
        clean: '儲物與收納用品',
      };
      let category = categoryMap[product.category];
      const newOrOldMap = {
        1 : '全新', 
        2 : '幾乎全新', 
        3 : '半新',
        4 : '適中', 
        5 : '稍舊', 
        6 : '全舊', 
      };
      let newOrOld = newOrOldMap[product.newOrOld];
      
      card.innerHTML = `
        <button class="favorite-btn" type="button" aria-label="加入收藏">
          <i class="fa-regular fa-star"></i>
        </button>
        <div class="product-thumb">
          <img src="${imgUrl}" alt="${product.name ?? ''}" loading="lazy">
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title mb-1">${product.name ?? ''}</h5>
          <p class="card-text text-muted mb-2"># ${category} # ${newOrOld}</p>
          <p class="card-text flex-grow-1">${product.description ?? ''}</p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold price">NT$ ${product.price ?? ''}</span>
              <small class="text-muted">庫存 ${product.stock ?? 0}</small>
            </div>
          </div>
        </div>
      `;
// 取得子元素參考
  const favBtn = card.querySelector('.favorite-btn');
  const favIcon = favBtn.querySelector('i');

  // 1) 收藏按鈕：只負責切換 + 阻止冒泡與預設
  favBtn.addEventListener('click', (e) => {
    const isNowFav = !favIcon.classList.contains('fa-solid'); 
  // ⬆️ 判斷目前是不是「空心」圖示，如果是，就要加入收藏；如果已經實心，就要取消收藏
if (isNowFav) {
      // await backend.addFavorite(pid);   // 呼叫新增 API
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
      // await backend.removeFavorite(pid); // 呼叫刪除 API
      Swal.fire({
        title: '已取消收藏',
        iconHtml: '<i class="fa-regular fa-star" style="color:#999;font-size:3.2rem"></i>',
        customClass: { icon: 'no-border' }
      });
    }
    e.preventDefault();
    e.stopPropagation(); // ⛔ 不讓事件跑到 card 造成導頁
    // favIcon.classList.toggle('fa-regular');
    // favIcon.classList.toggle('fa-solid');
    // Swal.fire({
    //   title: '已加入收藏！',
    //   text: '這個商品已經加到你的收藏清單',
    //   iconHtml: '<i class="fa-solid fa-star" style="color: gold; font-size: 3.2rem;"></i>',
    //   customClass: {
    //     icon: 'goldborder' // 移除內建背景
    //   }
    // });

    // TODO: 在這裡呼叫收藏/取消收藏 API（可用 card.dataset.id）
  });

  // 2) 卡片本身：其他區域才導頁（不需要 closest）
  card.addEventListener('click', () => {
    const pid = card.dataset.id;
    if (pid) location.href = `../product/product.html?id=${encodeURIComponent(pid)}`;
  });

  col.appendChild(card);
  container.appendChild(col);
});
  });
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


