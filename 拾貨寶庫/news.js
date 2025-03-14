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
  let data = [
    {
        from:"店鋪公告",
        n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
        time:"2025-02-08",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站登入頁面更新啦",
        time:"2025-02-07",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站最新消息頁面更新啦",
        time:"2025-02-06",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"店鋪公告",
        n_name:"許願池功能開啟啦，趕快去看看吧！",
        time:"2025-02-05",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"店鋪公告",
        n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
        time:"2025-02-04",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站登入頁面更新啦",
        time:"2025-02-03",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站最新消息頁面更新啦",
        time:"2025-02-02",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"店鋪公告",
        n_name:"許願池功能開啟啦，趕快去看看吧！",
        time:"2025-02-01",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"店鋪公告",
        n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
        time:"2025-01-31",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站登入頁面更新啦",
        time:"2025-01-30",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站最新消息頁面更新啦",
        time:"2025-01-29",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"店鋪公告",
        n_name:"許願池功能開啟啦，趕快去看看吧！",
        time:"2025-01-28",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站以後會固定在星期三晚上7:00-9:00進行更新",
        time:"2025-01-27",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"系統公告",
        n_name:"網站會在2025-01-26進行更新",
        time:"2025-01-25",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
    {
        from:"店鋪公告",
        n_name:"店鋪即將開張！趕快來看看新上架的商品吧！",
        time:"2025-01-24",
        detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
    },
];
let filteredData = data;  // 預設為全部資料
    let itemsPerPage = 5;
    let currentPage = 1;

    // 計算總頁數
    function getTotalPages() {
      return Math.ceil(filteredData.length / itemsPerPage);
    }

    // 顯示新聞列表
    function renderNews(page) {
      currentPage = page;
      const totalPages = getTotalPages();
      const start = (page - 1) * itemsPerPage;
      const end = page * itemsPerPage;
      const currentItems = filteredData.slice(start, end);

      let html = "";
      currentItems.forEach((item, index) => {
        // 這裡的 index 是當前頁面的局部索引，若要取全域索引需調整計算
        // 但我們可以直接在 showNewsDetail() 裡用 (start + index)
        html += `
          <tr>
            <td class="announce" style="padding-left: 2vw;">${item.from}</td>
            <td>
              <a href="#" 
                 onclick="showNewsDetail(${start + index})"
                  class="name">
                ${item.n_name}
              </a>
            </td>
            <td class="time">${item.time}</td>
          </tr>
        `;
      });
      document.querySelector(".news tbody").innerHTML = html;
      renderPagination();
    }

    // 產生分頁導覽
    function renderPagination() {
      const totalPages = getTotalPages();
      let paginationHTML = "";

      // 上一頁按鈕
      if (currentPage > 1) {
        paginationHTML += `<button onclick="renderNews(${currentPage - 1})">上一頁</button>`;
      } else {
        paginationHTML += `<button disabled>上一頁</button>`;
      }

      // 頁碼連結
      for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
          paginationHTML += `<span class="active" style="margin:0 5px;">${i}</span>`;
        } else {
          paginationHTML += `<a href="#" style="margin:0 5px;" onclick="renderNews(${i})">${i}</a>`;
        }
      }

      // 下一頁按鈕
      if (currentPage < totalPages) {
        paginationHTML += `<button onclick="renderNews(${currentPage + 1})">下一頁</button>`;
      } else {
        paginationHTML += `<button disabled>下一頁</button>`;
      }

      document.getElementById("pagination").innerHTML = paginationHTML;
    }

    // 過濾新聞（依據分類），並從第一頁開始顯示
    function filterNews(category) {
      if (category === "全部公告") {
        filteredData = data;
      } else {
        filteredData = data.filter(item => item.from === category);
      }
      renderNews(1);
    }

    // 顯示新聞詳細內容
    function showNewsDetail(index) {
      // 1. 根據 index 從 filteredData 取得對應新聞
      const item = filteredData[index];

      // 2. 將新聞詳細內容塞到 detail 區域
      document.getElementById("detailTitle").textContent = item.n_name;
      document.getElementById("detailFrom").textContent = item.from;
      document.getElementById("detailTime").textContent = item.time;
      document.getElementById("detailContent").textContent = item.detail;

      // 3. 顯示 detail 區塊，隱藏列表
      document.getElementById("newsListPage").style.display = "none";
      document.getElementById("newsDetailPage").style.display = "block";
    }

    // 返回新聞列表
    function showNewsList() {
      // 隱藏 detail 區塊，顯示列表
      document.getElementById("newsDetailPage").style.display = "none";
      document.getElementById("newsListPage").style.display = "block";
    }

    // 假設你的標籤連結（tab-link）可能是這樣：
    // <a class="tab-link" href="#">全部公告</a>
    // <a class="tab-link" href="#">系統公告</a>
    // <a class="tab-link" href="#">店鋪公告</a>
    const tabs = document.querySelectorAll('.tab-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        filterNews(e.target.textContent.trim());
      });
    });

    // 預設載入「全部公告」
    filterNews("全部公告");

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
      //e.preventDefault();
      callLogIn();
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

// 監聽 Firebase 認證狀態變化，並同步更新 localStorage 與介面狀態
auth.onAuthStateChanged(function(user) {
  const loginForm = document.getElementById('loginForm');
  const logoutButton = document.getElementById('logoutButton');
  const authButton = document.getElementById('authButton');

  if (user) {
    console.log("使用者已登入：", user);
    localStorage.setItem("isLoggedIn", "true");
    if (loginForm) loginForm.style.display = "none";
    if (logoutButton) logoutButton.style.display = "block";
    if (authButton) {
      authButton.textContent = "登出";
      authButton.onclick = function(e) {
        e.preventDefault();
        callLogout();
      };
    }
  } else {
    console.log("目前無使用者登入");
    localStorage.removeItem("isLoggedIn");
    if (loginForm) loginForm.style.display = "block";
    if (logoutButton) logoutButton.style.display = "none";
    if (authButton) {
      authButton.textContent = "登入";
      authButton.onclick = function(e) {
        e.preventDefault();
        callLogIn();
      };
    }
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
// let filteredData = data;  // 預設為全部資料
// let itemsPerPage = 5;
// let currentPage = 1;

// // 計算總頁數
// function getTotalPages() {
//   return Math.ceil(filteredData.length / itemsPerPage);
// }

// // 根據當前頁碼取出要顯示的新聞，並產生表格內容
// function renderNews(page) {
//   currentPage = page;
//   const totalPages = getTotalPages();
//   const start = (page - 1) * itemsPerPage;
//   const end = page * itemsPerPage;
//   const currentItems = filteredData.slice(start, end);
  
//   let html = "";
//   // 產生兩列：一列為新聞基本資料，下一列為隱藏的詳細內容
//   currentItems.forEach(item => {
//     html += `<tr class="news-row">
//                <td class="announce" style="padding-left: 2vw;">${item.from}</td>
//                <td class="name"><a href="#" class="news-title">${item.n_name}</a></td>
//                <td class="time">${item.time}</td>
//              </tr>
//              <tr class="detail-row" style="display:none;">
//                <td colspan="3">${item.detail}</td>
//              </tr>`;
//   });
//   document.querySelector(".news tbody").innerHTML = html;
//   renderPagination();
  
//   // 為每個新聞標題綁定點擊事件，切換顯示/隱藏其詳細內容
//   document.querySelectorAll(".news-title").forEach(title => {
//     title.addEventListener("click", function(e) {
//       e.preventDefault();
//       const currentRow = this.closest("tr");  // 找到當前新聞列
//       const detailRow = currentRow.nextElementSibling;  // 下一列為詳細內容列
//       if (detailRow && detailRow.classList.contains("detail-row")) {
//         detailRow.style.display = (detailRow.style.display === "table-row") ? "none" : "table-row";
//       }
//     });
//   });
// }

// // 產生分頁導覽
// function renderPagination() {
//   const totalPages = getTotalPages();
//   let paginationHTML = "";
  
//   // 上一頁按鈕
//   if (currentPage > 1) {
//     paginationHTML += `<button onclick="renderNews(${currentPage - 1})">上一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>上一頁</button>`;
//   }
  
//   // 頁碼連結
//   for (let i = 1; i <= totalPages; i++) {
//     if (i === currentPage) {
//       paginationHTML += `<span class="active">${i}</span>`;
//     } else {
//       paginationHTML += `<a href="#" onclick="renderNews(${i})">${i}</a>`;
//     }
//   }
  
//   // 下一頁按鈕
//   if (currentPage < totalPages) {
//     paginationHTML += `<button onclick="renderNews(${currentPage + 1})">下一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>下一頁</button>`;
//   }
  
//   document.getElementById("pagination").innerHTML = paginationHTML;
// }

// // 過濾新聞（依據分類），並從第一頁開始顯示
// function filterNews(category) {
//   if (category === "全部公告") {
//     filteredData = data;
//   } else {
//     filteredData = data.filter(item => item.from === category);
//   }
//   renderNews(1);
// }

// // 綁定標籤（頁籤）的點擊事件，點擊後會呼叫 filterNews() 過濾新聞
// const tabs = document.querySelectorAll('.tab-link');
// tabs.forEach(tab => {
//   tab.addEventListener('click', function(e) {
//     e.preventDefault();
//     tabs.forEach(t => t.classList.remove('active'));
//     e.target.classList.add('active');
//     filterNews(e.target.textContent.trim());
//   });
// });

// // 初始載入時，顯示「全部公告」
// filterNews("全部公告");

// let data = [
//     {
//         from:"店鋪公告",
//         n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
//         time:"2025-02-08",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站登入頁面更新啦",
//         time:"2025-02-07",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站最新消息頁面更新啦",
//         time:"2025-02-06",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"店鋪公告",
//         n_name:"許願池功能開啟啦，趕快去看看吧！",
//         time:"2025-02-05",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"店鋪公告",
//         n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
//         time:"2025-02-04",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站登入頁面更新啦",
//         time:"2025-02-03",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站最新消息頁面更新啦",
//         time:"2025-02-02",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"店鋪公告",
//         n_name:"許願池功能開啟啦，趕快去看看吧！",
//         time:"2025-02-01",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"店鋪公告",
//         n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
//         time:"2025-01-31",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站登入頁面更新啦",
//         time:"2025-01-30",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站最新消息頁面更新啦",
//         time:"2025-01-29",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"店鋪公告",
//         n_name:"許願池功能開啟啦，趕快去看看吧！",
//         time:"2025-01-28",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站以後會固定在星期三晚上7:00-9:00進行更新",
//         time:"2025-01-27",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"系統公告",
//         n_name:"網站會在2025-01-26進行更新",
//         time:"2025-01-25",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
//     {
//         from:"店鋪公告",
//         n_name:"店鋪即將開張！趕快來看看新上架的商品吧！",
//         time:"2025-01-24",
//         detail:"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore ab cumque minima voluptas excepturi delectus vitae ipsam repudiandae, saepe ad totam quos? Error dolorem consectetur harum cum modi esse iure at nemo, accusamus ad! Omnis veniam odio quasi commodi, ipsa vitae, dolorem culpa voluptatibus dolore obcaecati impedit expedita delectus quae ut. Mollitia, consequatur molestias cum laudantium libero, quos voluptatum at ipsa, saepe omnis deserunt. Illum corrupti eum, magnam porro repellat sequi repellendus aperiam cupiditate rem ullam quibusdam iste. Veritatis animi, consequatur est aut ratione minima! Odio magni ipsam dicta ullam enim, eum facere dignissimos non, accusantium sunt, laborum eveniet. Porro."
//     },
    
// ];
// // 用來存放目前要顯示的資料，預設為全部資料
// let filteredData = data;

// // 每頁顯示筆數及當前頁碼（全域變數）
// let itemsPerPage = 5;
// let currentPage = 1;

// // 根據 filteredData 長度計算總頁數
// function getTotalPages() {
//   return Math.ceil(filteredData.length / itemsPerPage);
// }

// // 根據當前頁碼，從 filteredData 中取出要顯示的資料
// function renderNews(page) {
//   currentPage = page;
//   const totalPages = getTotalPages();
//   const start = (page - 1) * itemsPerPage;
//   const end = page * itemsPerPage;
//   const currentItems = filteredData.slice(start, end);
  
//   let html = "";
//   currentItems.forEach(item => {
//     html += `<tr>
//                <td class="announce" style="padding-left: 2vw;">${item.from}</td>
//                <td class="name"><a>${item.n_name}</a></td>
//                <td class="time">${item.time}</td>
//              </tr>`;
//   });
//   document.querySelector(".news tbody").innerHTML = html;
//   renderPagination();
// }

// // 產生分頁導覽
// function renderPagination() {
//   const totalPages = getTotalPages();
//   let paginationHTML = "";
  
//   // 上一頁按鈕
//   if (currentPage > 1) {
//     paginationHTML += `<button onclick="renderNews(${currentPage - 1})">上一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>上一頁</button>`;
//   }
  
//   // 頁碼連結
//   for (let i = 1; i <= totalPages; i++) {
//     if (i === currentPage) {
//       paginationHTML += `<span class="active">${i}</span>`;
//     } else {
//       paginationHTML += `<a href="#" onclick="renderNews(${i})">${i}</a>`;
//     }
//   }
  
//   // 下一頁按鈕
//   if (currentPage < totalPages) {
//     paginationHTML += `<button onclick="renderNews(${currentPage + 1})">下一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>下一頁</button>`;
//   }
  
//   document.getElementById("pagination").innerHTML = paginationHTML;
// }

// // 過濾新聞，並重置分頁為第一頁
// function filterNews(category) {
//   if (category === "全部公告") {
//     filteredData = data;
//   } else {
//     filteredData = data.filter(item => item.from === category);
//   }
//   // 切換分類後從第一頁開始
//   renderNews(1);
// }

// // 綁定標籤（頁籤）的點擊事件
// const tabs = document.querySelectorAll('.tab-link');
// tabs.forEach(tab => {
//   tab.addEventListener('click', function(e) {
//     e.preventDefault();
//     // 移除所有標籤的 active
//     tabs.forEach(t => t.classList.remove('active'));
//     // 加上目前點擊的標籤 active
//     e.target.classList.add('active');
//     // 過濾新聞（用點擊標籤的文字作為分類依據）
//     filterNews(e.target.textContent.trim());
//   });
// });

// // 初始載入時，顯示「全部公告」
// filterNews("全部公告");
// function init() {
//     const news = document.querySelector(".news tbody");
//     let str = "";
//     data.forEach(function(news){
//     let content = `<tr><td class="annouce" style="padding-left: 2vw;">${news.from}</td><td class="name"><a>${news.n_name}</a></td><td class="time">${news.time}</td></tr>`;
//     str += `${content}`;
//     })
//     news.innerHTML = str;
//     const e = {
//         target: {
//           tagName: "A",
//           textContent: "全部公告"
//         }
//       };
//       filter(e);
// }
// init();

// function filter(e) {
//     if (e.target.tagName !== "A") return;

//     const selectedCategory = e.target.textContent.trim();
//     console.log("Filtering by:", selectedCategory);

//     let str = "";
//     data.forEach(function (item) {
//         if (selectedCategory === "全部公告" || item.from == selectedCategory) {
//             str += `<tr>
//                 <td class="announce" style="padding-left: 2vw;">${item.from}</td>
//                 <td class="name">${item.n_name}</td>
//                 <td class="time">${item.time}</td>
//             </tr>`;
//         }
//     });

//     const news = document.querySelector(".news tbody");
//     if (news) {
//         news.innerHTML = str;
//     }
// }


// const filterall = document.querySelector("#all");
// const filtersystem = document.querySelector("#system");
// const filterstore = document.querySelector("#store");

//     filterall.addEventListener("click", function (e) {
//         filter(e);
//     });
//     filtersystem.addEventListener("click", function (e) {
//         filter(e);
//     });
//     filterstore.addEventListener("click", function (e) {
//         filter(e);
// });

// // 1. 綁定監聽事件給所有頁籤
// const tabs = document.querySelectorAll('.nav-link');
// tabs.forEach((tab) => {
//   tab.addEventListener('click', function (e) {
//     e.preventDefault(); // 依情況是否需要阻止預設行為
    
//     // 2. 先移除所有頁籤的 active
//     tabs.forEach((t) => t.classList.remove('active'));
    
//     // 3. 再給目前被點擊的頁籤加上 active
//     e.target.classList.add('active');
    
//     // 4. 執行過濾公告的程式碼（如果你用的是 filter(e)）
//     filter(e);
//   });
// });
// // 用來存放目前要顯示的資料，預設全部
// let filteredData = data;

// // 每頁顯示筆數
// let itemsPerPage = 5;
// // 當前頁碼（全局變數）
// let currentPage = 1;

// // 重新計算總頁數
// function getTotalPages() {
//   return Math.ceil(filteredData.length / itemsPerPage);
// }

// // 渲染新聞資料
// function renderNews(page) {
//   currentPage = page;
//   let totalPages = getTotalPages();
//   const start = (page - 1) * itemsPerPage;
//   const end = page * itemsPerPage;
//   const currentItems = filteredData.slice(start, end);

//   let html = "";
//   currentItems.forEach(item => {
//     html += `<tr>
//       <td>${item.from}</td>
//       <td class="name"><a>${item.n_name}</a></td>
//       <td class="time">${item.time}</td>
//     </tr>`;
//   });
//   document.querySelector(".news tbody").innerHTML = html;

//   renderPagination();
// }

// // 產生分頁導覽
// function renderPagination() {
//   let totalPages = getTotalPages();
//   let paginationHTML = "";

//   // 上一頁
//   if (currentPage > 1) {
//     paginationHTML += `<button onclick="renderNews(${currentPage - 1})">上一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>上一頁</button>`;
//   }

//   // 頁碼
//   for (let i = 1; i <= totalPages; i++) {
//     if (i === currentPage) {
//       paginationHTML += `<span class="active">${i}</span>`;
//     } else {
//       paginationHTML += `<a href="#" onclick="renderNews(${i})">${i}</a>`;
//     }
//   }

//   // 下一頁
//   if (currentPage < totalPages) {
//     paginationHTML += `<button onclick="renderNews(${currentPage + 1})">下一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>下一頁</button>`;
//   }

//   document.getElementById("pagination").innerHTML = paginationHTML;
// }

// // 過濾新聞，並重置分頁為第一頁
// function filterNews(category) {
//   if (category === "全部公告") {
//     filteredData = data;
//   } else {
//     filteredData = data.filter(item => item.from === category);
//   }
//   // 每次切換分類後，重置頁碼為 1
//   renderNews(1);
// }

// // 初始載入時顯示全部新聞
// renderNews(1);
// const filter = document.querySelector(".sort");
// filter.addEventListener("click",function(e){
//     if (e.target.value == "undefined"){
//         return;
//     }
//     if (e.target.value == "全部公告"){
//         console.log(e);
//         init();
//         return;
//     }
//     let str = "";
//     data.forEach(function(item,index){
//         let content = `<td>${news.from}</td><td>${news.n_name}</td><td>${news.time}</td>`;
//         if(news.from == e.target.value) {
//             str += content;
//         }
//     })
// const news = document.querySelector(".tr");
// news.innerHTML = str;
// })



// const stationName = document.querySelector(".stationName");
// const stationCharge = document.querySelector(".stationCharge");
// const btn = document.querySelector(".btn");
// btn.addEventListener("click", function(e){
//     let obj = {};
//     obj.Charge = stationCharge.value;
//     obj.name = stationName.value;
//     data.unshift(obj);
//     init();
//     stationCharge.value = "";
//     stationName.value = "";
// })