
const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})
document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // ✅ 必須先宣告，才能使用！
  console.log("id", id);
    if (id) {
      fetch(`https://store-backend-iota.vercel.app/api/commodity/item/${id}`)
        .then(res => res.json())
        .then(data => {
          const product = data.data;
  console.log('product:', product);
          document.getElementById('product-name').textContent = product.name || '未命名';
          document.getElementById('product-price').innerHTML = `${product.price || 0}<span>NT$</span>`;
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
          const categoryList = document.getElementById('product-category');
          categoryList.innerHTML = `
            <li>分類：${category || '未分類'}</li>
            <li>新舊：${neworold}</li>
            <li>物品年齡：${product.age === '-1' ? '未知':product.age+'年'}</li>
            <li>庫存：${product.stock || '無資料'}</li>
          `;
  
          document.getElementById('product-description').textContent = product.description || '無描述';
  
          const mainImg = document.querySelector('.tryimg');
const thumbList = document.querySelector('.thumbnail-list');
let imageList = product.imageURL || [];


if (product.mainImage) {
  const mainImgFullPath = product.mainImage.startsWith('http')
    ? product.mainImage
    : `https://store-backend-iota.vercel.app${product.mainImage}`;

  // 如果 imageList 中尚未包含主圖才加入
  if (!imageList.includes(product.mainImage)) {
    imageList.unshift(product.mainImage); // 把主圖加到第一個
  }
}

// 顯示主圖
if (mainImg && imageList.length > 0) {
  const mainSrc = imageList[0].startsWith('http') ? imageList[0] : `https://store-backend-iota.vercel.app${imageList[0]}`;
  mainImg.src = mainSrc;
}

// 產生縮圖（包含主圖）
thumbList.innerHTML = '';
imageList.forEach((imgUrl, index) => {
  const src = imgUrl.startsWith('http') ? imgUrl : `https://store-backend-iota.vercel.app${imgUrl}`;
  const imgEl = document.createElement('img');
  imgEl.src = src;
  imgEl.classList.add('thumb-img');
  if (index === 0) imgEl.classList.add('active');

  imgEl.addEventListener('click', () => {
    mainImg.src = src;
    document.querySelectorAll('.thumb-img').forEach(img => img.classList.remove('active'));
    imgEl.classList.add('active');
  });

  thumbList.appendChild(imgEl);
});


  
          console.log('owner:', product.owner);
          fetch(`https://store-backend-iota.vercel.app/api/account/${product.owner}`)
  .then(res => {
    if (!res.ok) {
      throw new Error("查詢失敗");
    }
    console.log(res.ok);
    return res.json();
  })
  .then(data => {
    const sellerName = data.data.displayName || '匿名賣家';
    console.log('sellerName:', data.data.displayName);
    const reputation = data.reputation || 0;

    // 加入賣家資訊到畫面上（範例）
    document.getElementById('usernameinfo').innerHTML = `
      <img src="${data.data.photoURL || '../image/default-avatar.png'}" alt="賣家頭像" class="sellerphoto">
      <p class="sellername">${sellerName}</p>
      
    `;
//<p>信譽分數：${reputation}</p>
    // ✅ 額外：你可以加標籤
    // if (reputation >= 100) {
    //   document.getElementById('userinfo').innerHTML += `
    //     <div class="card-badge badge-trusted">優良賣家</div>
    //   `;
    // }
  })
  .catch(err => {
    console.error("無法取得賣家資訊", err);
  });

        })
        .catch(err => {
          console.error('讀取商品資料失敗：', err);
        });
    }
  });
  