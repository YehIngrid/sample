// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
  // 當頁面載入完畢後隱藏載入動畫，顯示內容
  var loader = document.getElementById('loader');
var content = document.getElementById('whatcontent');
if (loader && content) {
  loader.style.setProperty('display', 'none', 'important');
  content.style.setProperty('display', 'block', 'important');
}
};
// 當頁面載入完成後，先預加載所有圖片
window.addEventListener('load', () => {
  const imageUrls = [
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    
  ];
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });

  // 以下為原本的輪播程式碼

  const carousel = document.querySelector('.carousel');
  const track = document.querySelector('.carousel-track');
  let containerWidth = carousel.offsetWidth;
  let slideWidth = 600; // 桌面版預設幻燈片寬度
  // 初始設定：第一個真實幻燈片在 index 1
  let currentIndex = 1;
  
  // 更新輪播位置，根據容器寬度調整計算
  function updateCarousel() {
    containerWidth = carousel.offsetWidth;
    let offset;
    if (containerWidth < 800) {
      // 手機版：幻燈片全寬
      slideWidth = containerWidth;
      // currentIndex 從 1 代表第一個真實幻燈片，因此 offset = (currentIndex - 1) * slideWidth
      offset = (currentIndex - 1) * slideWidth;
    } else {
      // 桌面版：幻燈片固定 600px
      slideWidth = 600;
      // offset = currentIndex * 600 + slideWidth/2 - (containerWidth / 2)
      offset = currentIndex * slideWidth + slideWidth / 2 - containerWidth / 2;
    }
    track.style.transform = `translateX(-${offset}px)`;
  }
  updateCarousel();
  
  // 前進到下一張
  function moveToNext() {
    track.style.transition = "transform 0.5s ease";
    currentIndex++;
    updateCarousel();
  }
  
  // 往回上一張
  function moveToPrev() {
    track.style.transition = "transform 0.5s ease";
    currentIndex--;
    updateCarousel();
  }
  
  // 無縫循環處理：監聽 transitionend 事件
  track.addEventListener('transitionend', () => {
    const slides = document.querySelectorAll('.slide');
    // 如果移動到複製的第一張（最後一張），則重置到第一個真實幻燈片
    if (currentIndex === slides.length - 1) {
      track.style.transition = "none";
      currentIndex = 1;
      updateCarousel();
      void track.offsetWidth;
      track.style.transition = "transform 0.5s ease";
    }
    // 如果移動到複製的最後一張（index = 0），則重置到最後一個真實幻燈片
    else if (currentIndex === 0) {
      track.style.transition = "none";
      currentIndex = slides.length - 2;
      updateCarousel();
      void track.offsetWidth;
      track.style.transition = "transform 0.5s ease";
    }
  });
  
  // 自動輪播，每 3 秒前進一次
  let autoSlide = setInterval(moveToNext, 3000);
  
  // 箭頭點擊事件
  const arrowLeft = document.querySelector('.arrow-left');
  const arrowRight = document.querySelector('.arrow-right');
  arrowLeft.addEventListener('click', () => {
    clearInterval(autoSlide); // 手動操作時暫停自動輪播
    moveToPrev();
    autoSlide = setInterval(moveToNext, 2000);
  });
  arrowRight.addEventListener('click', () => {
    clearInterval(autoSlide);
    moveToNext();
    autoSlide = setInterval(moveToNext, 2000);
  });
  
  // 畫面尺寸變化時更新輪播位置
  window.addEventListener('resize', updateCarousel);
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // 當頁籤變回可見時，強制更新狀態
      updateCarousel();
    }
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const mobileSearchIcon = document.getElementById('mobileSearchIcon');
  const searchForm = document.getElementById('searchForm');
  
  // 手機版：點擊黑色搜尋圖示時，隱藏該圖示並顯示搜尋表單（新行出現）
  mobileSearchIcon.addEventListener('click', function() {
    mobileSearchIcon.style.display = 'none';
    searchForm.style.display = 'flex';
    
    // 自動將游標焦點移至搜尋輸入框
    const input = searchForm.querySelector('input');
    if (input) {
      input.focus();
    }
  });
});
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
//TODO Firebase 設定
// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyCtC488RFTmMSoe7lPj6c-rOVVuKOseTAk",
  authDomain: "store-backend-75fea.firebaseapp.com",
  projectId: "store-backend-75fea",
  storageBucket: "store-backend-75fea.firebasestorage.app",
  messagingSenderId: "585571611965",
  appId: "1:585571611965:web:65b013617b7877e2904154"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// 可設定持久性，確保 Firebase 在刷新時保留登入狀態
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// 頁面載入時，先根據 localStorage 設定按鈕初始狀態
$(document).ready(function(){
  console.log("文件已加載完成！");
  const send = document.getElementById('send');
  const authButton = document.getElementById('authButton');
  const storedStatus = localStorage.getItem("isLoggedIn");
  if (storedStatus === "true") {
    authButton.textContent = "登出";
    authButton.onclick = function(e) {
      e.preventDefault();
      callLogout();
    };
  } else {
    authButton.textContent = "登入";
    authButton.onclick = function(e) {
      $(location).attr('href', 'https://yehingrid.github.io/sample/%E6%8B%BE%E8%B2%A8%E5%AF%B6%E5%BA%AB/account.html');
    };
  }
  
  // 綁定 #send 按鈕提交事件，觸發登入
  $('#send').on('click', function(e){
    e.preventDefault(); // 攔截表單預設提交
    console.log("表單已提交！");
    callLogIn();
  });
  
  // 綁定 #logoutButton 按鈕提交事件，觸發登出
  $('#logoutButton').on('click', function(e){
    e.preventDefault();
    callLogout();
  });
});
auth.onAuthStateChanged(function(user) {
  const loginForm = document.getElementById('loginForm');
  const logoutButton = document.getElementById('logoutButton');
  const authButton = document.getElementById('authButton');
  const username = document.getElementById('username');

  if (user) {
    console.log("使用者已登入：", user);
    console.log("username: ", user.displayName);
    localStorage.setItem("isLoggedIn", "true");
    if (loginForm) loginForm.style.display = "none";
    if (logoutButton) logoutButton.style.display = "block";
    if (username) {
      username.textContent = `${user.displayName}, 你好！`;
      // username.style.display = "block";
    }
    if (authButton) {
      authButton.textContent = "登出";
      authButton.onclick = function(e) {
        e.preventDefault();
        Swal.fire({
          title: "確定登出？",
          text: "登出後無法購物與上架商品",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "我要登出"
        }).then((result) => {
          if (result.isConfirmed) {
            callLogout();
          }
      })};
    }
  } else {
    console.log("目前無使用者登入");
    localStorage.removeItem("isLoggedIn");
    if (loginForm) loginForm.style.display = "block";
    if (logoutButton) logoutButton.style.display = "none";
    if (authButton) {
      authButton.textContent = "登入";
    }
    send.onclick = function(e) {
      e.preventDefault();
      callLogIn();
    };
  }
});

// 登入函式：取得表單欄位並呼叫 Firebase 登入 API
function callLogIn(){
  const floatingInput = document.getElementById('floatingInput');
  const floatingPassword = document.getElementById('floatingPassword');

  if (!floatingInput || !floatingPassword) {
    console.error("無法取得登入欄位，請確認元素 id 是否正確");
    return;
  }
  
  if (!floatingInput.value || !floatingPassword.value) {
    Swal.fire({
      title: "請填寫所有必填資訊",
      icon: "warning"
    });
    return;
  }
  
  let obj = {
    email: floatingInput.value,
    password: floatingPassword.value
  };
  console.log("登入資訊：", obj);
  
  auth.signInWithEmailAndPassword(obj.email, obj.password)
    .then((userCredential) => {
      var user = userCredential.user;
      Swal.fire({
        icon: "success",
        title: "登入成功",
        text: "歡迎回來！",
        showConfirmButton: false,
        footer: "即將跳轉購物頁面",
        timer: 1500
      });
      return user.getIdToken();
    })
    .then((token) => {
      console.log("使用者 Token：", token);
      setTimeout(() => {
        window.location.href = "shoppingpage_bootstrap.html";
      }, 2000);
    })
    .catch(function (error) {
      console.error("登入錯誤：", error);
      Swal.fire({
        icon: "error",
        title: "登入失敗",
        text: "請確認帳號密碼是否正確，或註冊新帳號"
      });
    });
}

// 登出函式：使用 Firebase 的 signOut 方法
function callLogout() {
  auth.signOut()
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "登出成功",
        text: "歡迎再度光臨",
        showConfirmButton: false,
        footer: "即將返回登入頁面",
        timer: 1800
      });
      // 登出後從 localStorage 移除登入狀態
      localStorage.removeItem("isLoggedIn");
      setTimeout(() => {
        window.location.href = "account.html";
      }, 2000);
    })
    .catch(function(error) {
      console.error("登出錯誤：", error);
      Swal.fire({
        icon: "error",
        title: "Oops...登出失敗",
        text: "系統暫時發生錯誤，請稍後再試"
      });
    });
}

// 註冊函式：取得註冊表單欄位並呼叫後端 API
function callSignUp(){
  const emailInput = document.getElementById('email');
  const passwordInput1 = document.getElementById('password1');
  const passwordInput2 = document.getElementById('password2');
  const nameInput = document.getElementById('name');
  
  if (!emailInput.value || !passwordInput1.value || !passwordInput2.value || !nameInput.value) {
    alert("請填寫所有必填資訊");
    return;
  }
  if (passwordInput1.value !== passwordInput2.value) {
    alert("密碼輸入不一致");
    return;
  }
  
  let obj = {
    email: emailInput.value,
    password: passwordInput1.value,
    name: nameInput.value
  };
  console.log("註冊資訊：", obj);
  
  axios.post('http://localhost:3000', obj)
    .then(function (response) {
      if(response.data.message === "帳號註冊成功"){
        alert("恭喜帳號註冊成功");
      } else {
        alert("此帳號已被註冊");
      }
    })
    .catch(function (error) {
      console.error("註冊錯誤：", error);
    });
}

// 切換密碼顯示/隱藏（點擊眼睛圖示）
$("#checkEye").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#floatingPassword").attr('type', 'text');
  } else {
     $("#floatingPassword").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});
const seller = document.querySelector('#seller');
const sellerbtn = document.querySelector('#sellerbtn');
const content = document.querySelector('#midcontent');
sellerbtn.addEventListener('click', function(e){
  if(!auth.currentUser){
    Swal.fire({
      title: "您必須先登入才能進入賣家專區！",
      text: "請前往登入頁",
      icon: "info"
    });
  } else {
    content.style.display ="none";
    seller.style.display = "block";
    Swal.fire({
      title: "販賣商品前請務必詳閱販賣資訊！",
      icon: "info"
    });
  }
  
})
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
fetch('https://store-backend-iota.vercel.app/api/commodity/list/all')
  .then(res => res.json())
  .then(result => {
    const productList = result.data;
    const container = document.querySelector('.container-card');
console.log('productlist:',productList);
    productList.forEach(product => {
      const card = document.createElement('div');
      card.className = 'card product-card';
      card.dataset.id = product.id; // 用 ID 填入 data-id
      card.style.width = '17rem';
    // 檢查螢幕寬度是否為手機（小於 768px）
    if (window.innerWidth < 768) {
      document.querySelectorAll('.product-card').forEach(card => {
        card.style.width = '16rem';
        card.style.margin = '10px';
      });
    }

      const imgUrl = product.mainImage?.startsWith('http') ? product.mainImage : `https://store-backend-iota.vercel.app${product.mainImage}`;

      card.innerHTML = `
        <img src="${imgUrl}" class="card-img-top" alt="${product.name}">
        <div class="card-body">
          <h5 class="card-title">${product.name || '未命名商品'}</h5>
          <p class="card-text">＃${product.category || '未分類'}</p>
          <p class="price">${product.price || 0}<span>NT$</span></p>
          <a href="#" class="card-detail-btn">加入購物車</a>
        </div>
      `;
      container.appendChild(card);
    });
    // 綁定點擊卡片的「詳細資訊」按鈕事件
    document.querySelectorAll('.card').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        //const id = this.closest('.product-card').dataset.id;
        const id = e.target.closest('.product-card').dataset.id;
        console.log('id', id);
        if (id) {
          window.location.href = `product.html?id=${id}`;
        }
      });
    });
  })
  .catch(err => console.error('載入商品失敗：', err));
//TODO:商品店家標籤 
  let badgeHtml = '';

  if (product.isFirstProduct) {
    badgeHtml += `<div class="card-badge badge-first">首次上架</div>`;
  }
  
  if (product.sellerReputation === 5) {
    badgeHtml += `<div class="card-badge badge-trusted">優良賣家</div>`;
  }
  
  const cardHtml = `
    <div class="card product-card">
      ${badgeHtml}
      <img src="${imgUrl}" class="card-img-top" alt="${product.name}">
      <div class="card-body">
        <h5 class="card-title">${product.name || '未命名商品'}</h5>
        <p class="card-text">＃${product.category || '未分類'}</p>
        <p class="price">${product.price || 0}<span>NT$</span></p>
        <a href="#" class="card-detail-btn">加入購物車</a>
      </div>
    </div>
  `;
  