// // 取得元素
// const modal = document.getElementById("loginModal");
// const openModalBtn = document.getElementById("openModal");
// const closeModalBtn = document.querySelector(".close");
// const loginForm = document.getElementById("loginForm");

// // 點擊「登入」按鈕時顯示 Modal
// openModal.addEventListener("click", function(e) {
//     modal.style.display = "flex";
// });

// // 點擊「×」按鈕時關閉 Modal
// closeModalBtn.addEventListener("click", function(e) {
//     modal.style.display = "none";
// });

// // 點擊 Modal 以外的地方關閉視窗
// window.addEventListener("click", function(event) {
//     if (event.target === modal) {
//         modal.style.display = "none";
//     }
// });
// // 監聽登入表單提交事件
// loginForm.addEventListener("submit", function(event) {
//     event.preventDefault(); // 防止表單提交刷新頁面

//     // 獲取輸入值
//     const username = document.getElementById("username").value;
//     const password = document.getElementById("password").value;

//     // 模擬登入（實際應該連接後端）
//     if (username === "user" && password === "1234") {
//         alert("登入成功！");
//         modal.style.display = "none"; // 登入成功後關閉 Modal
//     } else if(username===""||password===""){
//         alert('帳號或密碼尚未輸入！');
//     } else {
//         alert("帳號或密碼錯誤！");
//     }
        
    
// });

// loginForm.addEventListener("submit", function(event) {
//     event.preventDefault();

//     const username = document.getElementById("username").value;
//     const password = document.getElementById("password").value;
    
        
    
//     fetch("https://你的後端/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password })
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             alert("登入成功！");
//             modal.style.display = "none"; // 關閉 Modal
//         } else {
//             alert("登入失敗：" + data.message);
//         }
//     })
//     .catch(error => console.error("錯誤:", error));
// });
// 當頁面載入完畢後隱藏 loader，顯示內容
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
};

// DOMContentLoaded 事件：設定手機版搜尋功能
document.addEventListener('DOMContentLoaded', function() {
  const mobileSearchIcon = document.getElementById('mobileSearchIcon');
  const searchForm = document.getElementById('searchForm');
  
  if (mobileSearchIcon && searchForm) {
    mobileSearchIcon.addEventListener('click', function() {
      mobileSearchIcon.style.display = 'none';
      searchForm.style.display = 'flex';
      
      // 將游標自動移至搜尋輸入框
      const input = searchForm.querySelector('input');
      if (input) {
        input.focus();
      }
    });
  }
});
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

// 使用 jQuery 進行文件就緒處理與事件綁定
$(document).ready(function(){
  console.log("文件已加載完成！");
  
  // 綁定註冊表單提交事件
  $('#send').on('click', function(e){
    e.preventDefault(); // 攔截表單預設提交
    console.log("表單已提交！");
    callLogIn();
  });
});
// const emailInput = document.getElementById('floatingInput');
// const passwordInput = document.getElementById('floatingPassword');
// const send = document.getElementById('send');

// send.addEventListener('click', function(e){ 
//    e.preventDefault();
//    callLogIn();
//   })


function callLogIn(){
  // 取得登入表單欄位
  
  // 基本驗證：檢查必填欄位
  if (!floatingInput.value || !floatingPassword.value) {
      alert("請填寫所有必填資訊");
      return;
  }
  
  let obj = {
      email: floatingInput.value,
      password: floatingPassword.value
  };
  console.log(obj);
  
  // 發送 POST 請求（請確認 axios 庫是否有正確引入）
  firebase.auth().signInWithEmailAndPassword(obj.email, obj.password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      alert('Login successful');
      console.log(user.getIdToken());
  })
    .catch(function (error) {
      console.log(error);
    });
}
// 修改後的註冊函式，使用正確的欄位 id 與基本驗證
function callSignUp(){
    // 取得註冊表單欄位（依照你的 HTML，這裡使用 email、password1、password2 與 name）
    const emailInput = document.getElementById('email');
    const passwordInput1 = document.getElementById('password1');
    const passwordInput2 = document.getElementById('password2');
    const nameInput = document.getElementById('name');
    
    // 基本驗證：檢查必填欄位
    if (!emailInput.value || !passwordInput1.value || !passwordInput2.value || !nameInput.value) {
        alert("請填寫所有必填資訊");
        return;
    }
    // 驗證密碼是否一致
    if (passwordInput1.value !== passwordInput2.value) {
        alert("密碼輸入不一致");
        return;
    }
    
    let obj = {
        email: emailInput.value,
        password: passwordInput1.value,
        name: nameInput.value
    };
    console.log(obj);
    
    // 發送 POST 請求（請確認 axios 庫是否有正確引入）
    axios.post('http://localhost:3000', obj)
      .then(function (response) {
        if(response.data.message === "帳號註冊成功"){
            alert("恭喜帳號註冊成功");
        } else {
            alert("此帳號已被註冊");
        }
      })
      .catch(function (error) {
        console.log(error);
      });
}
$("#checkEye").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#floatingPassword").attr('type', 'text');
  }else{
     $("#floatingPassword").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
}); 