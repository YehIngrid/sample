let backendService;
const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})
// document.addEventListener('DOMContentLoaded', function () {
//     backendService = new BackendService();
//     const params = new URLSearchParams(window.location.search);
//     const id = params.get('id'); // ✅ 必須先宣告，才能使用！
//     console.log("id", id);
//     if (id) {
//       backendService.GetItemsInfo((response) => {
//         const product = response.data;
//   console.log('product:', product);
//           document.getElementById('product-name').textContent = product.name || '未命名';
//           document.getElementById('product-price').innerHTML = `${product.price || 0}<span>NT$</span>`;
//   //TODO:商品分類
//   const categoryMap = {
//     book: '書籍與學籍用品',
//     life: '宿舍與生活用品',
//     student: '學生專用器材',
//     other: '其他',
//     recycle: '環保生活用品',
//     clean: '儲物與收納用品',
//     // ...等等
//   };
//   const newOrOldMap = {
//     '-1': '全新',
//     '2': '二手',
//     used: '使用過',
//   };
//   let newOrOld = newOrOldMap[product.newOrOld] || product.newOrOld;
//   let category = categoryMap[product.category] || product.category;
//           const categoryList = document.getElementById('product-category');
//           categoryList.innerHTML = `
//             <li>分類：${category || '未分類'}</li>
//             <li>新舊：${neworold}</li>
//             <li>物品年齡：${product.age === '-1' ? '未知':product.age+'年'}</li>
//             <li>庫存：${product.stock || '無資料'}</li>
//           `;
  
//           document.getElementById('product-description').textContent = product.description || '無描述';
  
//           const mainImg = document.querySelector('.tryimg');
// const thumbList = document.querySelector('.thumbnail-list');
// let imageList = product.imageURL || [];


// if (product.mainImage) {
//   const mainImgFullPath = product.mainImage.startsWith('http') || product.mainImage;

//   // 如果 imageList 中尚未包含主圖才加入
//   if (!imageList.includes(product.mainImage)) {
//     imageList.unshift(product.mainImage); // 把主圖加到第一個
//   }
// }

// // 顯示主圖
// if (mainImg && imageList.length > 0) {
//   const mainSrc = imageList[0].startsWith('http') || imageList[0] ;
//   mainImg.src = mainSrc;
// }

// // 產生縮圖（包含主圖）
// thumbList.innerHTML = '';
// imageList.forEach((imgUrl, index) => {
//   const src = imgUrl.startsWith('http') || imgUrl;
//   const imgEl = document.createElement('img');
//   imgEl.src = src;
//   imgEl.classList.add('thumb-img');
//   if (index === 0) imgEl.classList.add('active');

//   imgEl.addEventListener('click', () => {
//     mainImg.src = src;
//     document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
//     imgEl.classList.add('active');
//   });

//   thumbList.appendChild(imgEl);
// });


  
//           console.log('owner:', product.owner);
          
//     // 加入賣家資訊到畫面上（範例）
//     document.getElementById('usernameinfo').innerHTML = `
//       <img src="${data.data.photoURL || '../image/default-avatar.png'}" alt="賣家頭像" class="sellerphoto">
//       <p class="sellername">${sellerName}</p>
      
//     `;
// //<p>信譽分數：${reputation}</p>
//     // ✅ 額外：你可以加標籤
//     // if (reputation >= 100) {
//     //   document.getElementById('userinfo').innerHTML += `
//     //     <div class="card-badge badge-trusted">優良賣家</div>
//     //   `;
//     // }
//   })
//   .catch(error => {
//     console.error("無法取得賣家資訊", error);
//   });
// })
    
document.addEventListener('DOMContentLoaded', () => {
  const backendService = new BackendService();

  // 取得 URL ?id=xxx
  const id = new URLSearchParams(location.search).get('id');
  console.log('id:', id);
  if (!id) {
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
    let updateAt = product.updataAt;
    const taiwanUpdateTime = new Date(updateAt);
    // 格式化（只保留時:分）
    const updateTime = taiwanUpdateTime.toLocaleString("zh-TW", { 
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

    const categoryList = document.getElementById('product-category');
    if (categoryList) {
      categoryList.innerHTML = `
        <li>分類：${category}</li>
        <li>商品狀態：${newOrOld}</li>
        <li>物品年齡：${String(product.age) === '-1' || product.age == null ? '未知' : product.age + '年'}</li>
        <li>庫存：${product.stock ?? '無資料'}</li>
        <li>商品上架時間: ${createdTime}</li>
        <li>賣家更新時間: ${updateTime}</li>
      `;
    }

    // === 圖片（主圖 + 縮圖；維持比例） ===
    const mainImg = document.querySelector('.tryimg');            // 請在 HTML 主圖 <img> 使用 class="tryimg"
    const thumbList = document.querySelector('.thumbnail-list');  // 縮圖容器 <div class="thumbnail-list"></div>

    let imageList = toArray(product.imageUrl);
    if (product.mainImage) {
      const main = toFullURL(product.mainImage);
      if (!imageList.some(u => toFullURL(u) === main)) imageList.unshift(product.mainImage);
    }
    imageList = imageList.map(toFullURL).filter(Boolean);

    if (mainImg && imageList.length) {
      mainImg.src = imageList[0];
      mainImg.alt = product.name ?? '';
      mainImg.loading = 'lazy';
    }

    if (thumbList) {
      thumbList.innerHTML = '';
      imageList.forEach((src, idx) => {
        const imgEl = document.createElement('img');
        imgEl.src = src;
        imgEl.alt = `縮圖 ${idx + 1}`;
        imgEl.loading = 'lazy';
        imgEl.className = 'thumb-img' + (idx === 0 ? ' active' : '');
        imgEl.addEventListener('click', () => {
          if (mainImg) mainImg.src = src;
          thumbList.querySelectorAll('.thumb-img').forEach(i => i.classList.remove('active'));
          imgEl.classList.add('active');
        });
        thumbList.appendChild(imgEl);
      });
    }

    // === 賣家資訊（保留；若有 API 就渲染） ===
    if (product.owner) {
        const u = product.owner;
        const photo = u.photoURL || '../image/default-avatar.png';
        const sellerName = u.name || '賣家名稱';
        const sellerIntroduction = u.introduction || '賣家簡介';
        const sellerRate = u.rate || '信譽積分:';
        const box = document.getElementById('sellerInfo');
        if (box) {
          box.innerHTML = `
            <img src="${photo}" alt="賣家頭像" class="sellerphoto">
            <h2>${sellerName}</h2>
            <h6>信譽積分: ${sellerRate}</h6>
            <button>與賣家聊聊</button>
            <button>查看賣家資訊</button>
          `;
        }
    } else {
      console.log('略過賣家資訊渲染');
    }
  };
//?<p class="userinfo">${sellerIntroduction}</p>
  const onError = (err) => {
    console.error('GetItemsInfo 失敗：', err);
  };

  // 呼叫 API（新版帶 id；若舊簽名不帶 id 則 fallback）
  try {
    backendService.GetItemsInfo(id, onSuccess, onError);
  } catch (e) {
    console.warn('GetItemsInfo(id, ...) 呼叫失敗，嘗試舊簽名：', e);
    backendService.GetItemsInfo(onSuccess);
  }
});
