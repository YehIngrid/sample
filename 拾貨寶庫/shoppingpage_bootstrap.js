const content = document.getElementById('midcontent');
// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
  // 當頁面載入完畢後隱藏載入動畫，顯示內容
  var loader = document.getElementById('loader');

if (loader && content) {
  loader.style.setProperty('display', 'none', 'important');
  content.style.setProperty('display', 'block', 'important');
}
};
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

const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
  content.style.display = 'block';
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
    const conditionOptions = document.getElementsByName('neworold');
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
  text: "請確認好所有商品資訊，若後續需要更改或移除資料，請至個人檔案內查看。",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#3085d6",
  cancelButtonColor: "#d33",
  confirmButtonText: "是，我就要賣！"
}).then((result) => {
  if (result.isConfirmed) {
    const formData = new FormData(form);

    // ✅ 顯示 loading 遮罩
    loaderOverlay.classList.remove('d-none');

    auth.currentUser.getIdToken()
      .then((idToken) => {
        return fetch('https://store-backend-iota.vercel.app/api/commodity/create', {
          method: 'POST',
          headers: {
            'idtoken': idToken
          },
          body: formData
        });
      })
      .then(response => {
        if (response.ok) {
          Swal.fire({
            title: "商品上架成功！",
            text: "請確認首頁商品欄有無您上架的商品",
            icon: "success"
          }).then((result) => {
            if (result.isConfirmed) {
              // ✅ 使用者按下 OK 後跳轉
              window.location.href = "shoppingpage_bootstrap.html";
            }
          });
          form.reset();
        } else {
          return response.json().then(data => {
            Swal.fire({
              title: "Oops...發生錯誤，請稍後再試",
              text: data.message || 'Failed to create commodity.',
              icon: "error",
            })
          });
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      })
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

const wishpool = document.getElementById('wishpool');
const backbtn1 = document.getElementById('back-btn1');
const wishpoolbtn = document.getElementById('wishpoolbtn');
wishpoolbtn.addEventListener('click', function(e){
  wishpool.style.display = 'block';
  console.log('hello');
  content.style.display = 'none';
})
backbtn1.addEventListener('click', function(e){
  wishpool.style.display = 'none';
  console.log('hiii');
  content.style.display = 'block';
})
const member = document.getElementById('member');
const memberbtn = document.getElementById('memberbtn');
const backbtn2 = document.getElementById('back-btn2');
memberbtn.addEventListener('click', function(e){
  member.style.display = 'block';
  content.style.display = 'none';
})
backbtn2.addEventListener('click', function(e){
  member.style.display = 'none';
  content.style.display = 'block';
})
const mystery = document.getElementById('mystery');
const mysterybtn = document.getElementById('mysterybtn');
const backbtn3 = document.getElementById('back-btn3');
mysterybtn.addEventListener('click', function(e){
  mystery.style.display = 'block';
  content.style.display = 'none';
})
backbtn3.addEventListener('click', function(e){
  mystery.style.display = 'none';
  content.style.display = 'block';
})
const everyday = document.getElementById('everyday');
const everydaybtn = document.getElementById('everydaybtn');
const backbtn4 = document.getElementById('back-btn4');
everydaybtn.addEventListener('click', function(e){
  everyday.style.display = 'block';
  content.style.display = 'none';
})
backbtn4.addEventListener('click', function(e){
  everyday.style.display = 'none';
  content.style.display = 'block';
})
const donate = document.getElementById('donate');
const donatebtn = document.getElementById('donatebtn');
const backbtn5 = document.getElementById('back-btn5');
donatebtn.addEventListener('click', function(e){
  donate.style.display = 'block';
  content.style.display = 'none';
})
backbtn5.addEventListener('click', function(e){
  donate.style.display = 'none';
  content.style.display = 'block';
})
// ⏬ 載入全部商品並顯示在首頁卡片區
// fetch('https://store-backend-iota.vercel.app/api/commodity/list/all')
//   .then(res => res.json())
//   .then(result => {
//     const productList = result.data;
//     const container = document.querySelector('.container-card');
// console.log('productlist:',productList);
//     productList.forEach(product => {
//       const card = document.createElement('div');
//       card.className = 'card product-card';
//       card.dataset.id = product.id; // 用 ID 填入 data-id
//       card.style.width = '17rem';
//     // 檢查螢幕寬度是否為手機（小於 768px）
//     if (window.innerWidth < 768) {
//       document.querySelectorAll('.product-card').forEach(card => {
//         card.style.width = '16rem';
//         card.style.margin = '10px';
//       });
//     }

//       const imgUrl = product.mainImage?.startsWith('http') ? product.mainImage : `https://store-backend-iota.vercel.app${product.mainImage}`;

//       card.innerHTML = `
//         <img src="${imgUrl}" class="card-img-top" alt="${product.name}">
//         <div class="card-body">
//           <h5 class="card-title">${product.name || '未命名商品'}</h5>
//           <p class="card-text">＃${product.category || '未分類'}</p>
//           <p class="price">${product.price || 0}<span>NT$</span></p>
//           <a href="#" class="card-detail-btn">加入購物車</a>
//         </div>
//       `;
//       container.appendChild(card);
//     });
//     // 綁定點擊卡片的「詳細資訊」按鈕事件
//     document.querySelectorAll('.card').forEach(btn => {
//       btn.addEventListener('click', function (e) {
//         e.preventDefault();
//         //const id = this.closest('.product-card').dataset.id;
//         const id = e.target.closest('.product-card').dataset.id;
//         console.log('id', id);
//         if (id) {
//           window.location.href = `product.html?id=${id}`;
//         }
//       });
//     });
//   })
//   .catch(err => console.error('載入商品失敗：', err));

// const grid = document.getElementById('product-grid');
// const pagination = document.getElementById('pagination');

// let currentPage = 1;
// const itemsPerPage = 12;
// let allProducts = [];

// fetch('https://store-backend-iota.vercel.app/api/commodity/list/all')
//   .then(res => res.json())
//   .then(result => {
//     allProducts = result.data;
//     renderPage(currentPage);
//     renderPagination();
//     document.body.classList.add('grid-ready');
//   });

// function renderPage(page) {
//   grid.innerHTML = '';
//   const start = (page - 1) * itemsPerPage;
//   const end = start + itemsPerPage;
//   const pageItems = allProducts.slice(start, end);

//   pageItems.forEach(product => {
//     const card = document.createElement('div');
//     card.className = 'grid-item';
//     card.dataset.id = product.id;

//     const imgUrl = product.mainImage?.startsWith('http')
//       ? product.mainImage
//       : `https://store-backend-iota.vercel.app${product.mainImage}`;

//     card.innerHTML = `
//       <img src="${imgUrl}" alt="${product.name}">
//       <div class="card-body">
//         <h5>${product.name || '未命名商品'}</h5>
//         <p>＃${product.category || '未分類'}</p>
//         <p class="price">${product.price || 0}<span> NT$</span></p>
//         <p class="extra-info">1.1K 件</p>
//         <p class="tag">คูปอง ส่วนลด 6%</p>
//       </div>
//     `;

//     grid.appendChild(card);
//   });
// }

// function renderPagination() {
//   pagination.innerHTML = '';
//   const totalPages = Math.ceil(allProducts.length / itemsPerPage);

//   for (let i = 1; i <= totalPages; i++) {
//     const btn = document.createElement('button');
//     btn.innerText = i;
//     btn.style.margin = '0 4px';
//     btn.style.padding = '6px 12px';
//     btn.style.borderRadius = '6px';
//     btn.style.border = 'none';
//     btn.style.backgroundColor = i === currentPage ? '#004b97' : '#ccc';
//     btn.style.color = i === currentPage ? '#fff' : '#000';

//     btn.addEventListener('click', () => {
//       currentPage = i;
//       renderPage(currentPage);
//       renderPagination(); // 更新按鈕樣式
//       window.scrollTo({
//         top: document.getElementById('product-grid').offsetTop,
//         behavior: 'smooth'
//       });
//     });

//     pagination.appendChild(btn);
//   }
// }
const grid = document.getElementById('product-grid');
const pagination = document.getElementById('pagination');
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 12;

fetch('https://store-backend-iota.vercel.app/api/commodity/list/all')
  .then(res => res.json())
  .then(result => {
    allProducts = result.data;
    renderPage(currentPage);
    renderPagination();
    document.body.classList.add('grid-ready');
  });

function renderPage(page) {
  grid.innerHTML = '';
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = allProducts.slice(start, end);

  pageItems.forEach(product => {
    const card = document.createElement('div');
    card.className = 'grid-item';
    card.dataset.id = product.id;

    const imgUrl = product.mainImage?.startsWith('http')
      ? product.mainImage
      : `https://store-backend-iota.vercel.app${product.mainImage}`;
    //TODO:商品分類
    const categoryMap = {
      book: '書籍與學籍用品',
      life: '宿舍與生活用品',
      student: '學生專用器材',
      other: '其他',
      recyle: '環保生活用品',
      clean: '儲物與收納用品',
      // ...等等
    };
    const neworoldMap = {
      '-1': '全新',
      '2': '二手',
      used: '使用過',
    };
    let neworold = neworoldMap[product.neworold] || product.neworold;
    let category = categoryMap[product.category] || product.category;
    card.innerHTML = `
      <img src="${imgUrl}" alt="${product.name}">
      <div class="card-body">
        <h5>${product.name || '未命名商品'}</h5>
        <p>＃${category || '未分類'} ＃${neworold}</p>
        <p class="price">${product.price || 0}<span> NT$</span></p>
        <p class="tag">คูปอง ส่วนลด 6%</p>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${product.id}`;
    });

    grid.appendChild(card);
  });
}

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

// //TODO:商品店家標籤 
//   let badgeHtml = '';

//   if (product.isFirstProduct) {
//     badgeHtml += `<div class="card-badge badge-first">首次上架</div>`;
//   }
  
//   if (product.sellerReputation === 5) {
//     badgeHtml += `<div class="card-badge badge-trusted">優良賣家</div>`;
//   }
  
//   const cardHtml = `
//     <div class="card product-card">
//       ${badgeHtml}
//       <img src="${imgUrl}" class="card-img-top" alt="${product.name}">
//       <div class="card-body">
//         <h5 class="card-title">${product.name || '未命名商品'}</h5>
//         <p class="card-text">＃${product.category || '未分類'}</p>
//         <p class="price">${product.price || 0}<span>NT$</span></p>
//       </div>
//     </div>
//   `;


