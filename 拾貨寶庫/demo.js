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
        username.textContent = `${user.displayName} `;
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
  function callLogIn() {
    const floatingInput = document.getElementById('floatingInput');
    const floatingPassword = document.getElementById('floatingPassword');
    const loader = document.getElementById('loader-wrapper1');
  
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
  
    // ✅ 顯示 loading
    loader.style.display = 'flex';
  
    let obj = {
      email: floatingInput.value,
      password: floatingPassword.value
    };
  
    auth.signInWithEmailAndPassword(obj.email, obj.password)
      .then((userCredential) => {
        var user = userCredential.user;
        loader.style.display = 'none';
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
  
        // ✅ 隱藏 loading
        loader.style.display = 'none';
  
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
      Swal.fire({
        title: "請填寫所有必填資訊",
        icon: "warning"
      });
      return;
    }
    //TODO:email's limit
    // if(!emailInput.value.endsWith('@mail.nchu.edu.tw')){
    //   Swal.fire({
    //     title:"帳號不符合註冊要求",
    //     icon:"warning", 
    //     text:"請使用 @mail.nchu.edu.tw 結尾的學校帳號註冊！"
    //   });
    //   return;
    // }
    const pwd = passwordInput1.value;
    const isValid = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(pwd);
  
    if (!isValid) {
      Swal.fire({
        title: "密碼不符合最低要求",
        icon: "warning",
        text: "密碼需至少6位，且同時包含英文字母與數字"
      });
      return;
    }
  
    // if(passwordInput1.value.length < 6 || /[a-zA-Z]/.test(passwordInput1.value)|| /[0-9]/.test(passwordInput1.value)){
    //   Swal.fire({
    //     title: "密碼不符合最低要求",
    //     icon: "warning",
    //     text: "請重新設定一組新密碼"
    //   });
    //   return;
    // }
    if (passwordInput1.value !== passwordInput2.value) {
      Swal.fire({
        title: "密碼輸入不一致",
        icon: "warning"
      });
      return;
    }
    
    let obj = {
      email: emailInput.value,
      password: passwordInput1.value,
      name: nameInput.value
    };
    console.log("註冊資訊：", obj);
    
    
    // 顯示 loader
    document.getElementById('loader-wrapper').style.display = 'flex';
  
    let backendService = new BackendService();
    backendService.signup(obj, 
      () => {
        document.getElementById('loader-wrapper').style.display = 'none';
        console.log("回傳資料：", response.data);
        Swal.fire({
          icon: "success",
          title: "帳號註冊成功",
          showConfirmButton: false,
          footer: "即將返回登入頁面",
          timer: 1800
        });
        setTimeout(() => {
          window.location.href = "account.html";
        }, 2000);
    }, (errorMessage) => {
      document.getElementById('loader-wrapper').style.display = 'none';
      console.log("回傳資料：", response.data);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage
      });
    });

    axios.post('https://store-backend-iota.vercel.app/api/account/signup', obj)
      .then(function (response) {
        // 隱藏 loader
        document.getElementById('loader-wrapper').style.display = 'none';
  
        console.log("回傳資料：", response.data);
        if(response.data.message == "User created successfully"){
          Swal.fire({
            icon: "success",
            title: "帳號註冊成功",
            showConfirmButton: false,
            footer: "即將返回登入頁面",
            timer: 1800
          });
          setTimeout(() => {
            window.location.href = "account.html";
          }, 2000);
        } 
      })
      .catch(function (error) {
        // 隱藏 loader
        document.getElementById('loader-wrapper').style.display = 'none';
  
        console.error("註冊錯誤：", error);
        if(error.response?.data?.message === "Email already exists"){
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "此帳號已被註冊"
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text:"系統發生錯誤，請稍後再試"
          });
        }
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
  // TODO:點擊聊天icon後，進入聊天界面
  const talkInterface = document.querySelector('#talkInterface');
  const chatHome = document.querySelector('#chatHome');
  talkInterface.addEventListener('click', function(e){
    if(!auth.currentUser){
      Swal.fire({
        title: "您必須先登入才能進入聊天室！",
        text: "請前往登入頁",
        icon: "info"
      });
    } else {
      //content.style.display ="none";
      chatHome.style.display = "block";
    }
  })
  // TODO:選擇聊天人物之後
  // 點選聊天對象時，切換顯示聊天視窗
  document.querySelectorAll('.person').forEach(person => {
  person.addEventListener('click', () => {
    const name = person.querySelector('h3').textContent;

    // 隱藏聊天對象清單，顯示對話區塊
    document.getElementById('chatHome').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'block';

    // 更新聊天室上方對象名稱
    document.getElementById('chatTargetName').textContent = name;

    // TODO: 根據 data-uid 載入對應聊天記錄（可用 AJAX 或 localStorage 模擬）
  });
});

// 返回按鈕：切回聊天對象清單
document.getElementById('backToHome').addEventListener('click', () => {
  document.getElementById('chatWindow').style.display = 'none';
  document.getElementById('chatHome').style.display = 'block';
});
// 聊天室功能
  const sendbtn = document.querySelector('#sendbtn');
  sendbtn.addEventListener('click', function(e){
    e.preventDefault();
    sendMessage();
  });
  const input = document.getElementById('messageInput');
let isComposing = false;

// 注音輸入時的選字階段偵測
input.addEventListener('compositionstart', () => {
  isComposing = true;
});

input.addEventListener('compositionend', () => {
  isComposing = false;
});

input.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !isComposing) {
    event.preventDefault();
    sendMessage();
    input.value = ''; // 清空輸入框
  }
});
  let lastMessageDate = null;

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const currentDate = now.toISOString().slice(0, 10); // 例如：2025-06-18

  let timeString;
  if (lastMessageDate === currentDate) {
    timeString = `${hours}:${minutes}`; // 同一天只顯示時間
  } else {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    timeString = `${year}/${month}/${day} ${hours}:${minutes}`; // 不同天顯示完整
    lastMessageDate = currentDate; // 更新為這一筆的日期
  }

  return timeString;
}


  function sendMessage() {
    
    const text = input.value.trim();
    if (!text) return;

    const msg = document.createElement('div');
    msg.className = 'message sender';
    msg.innerText = text;

    const time = document.createElement('div');
    time.className = 'timestamp';
    time.innerText = getCurrentTime();

    const chat = document.getElementById('chat');
    chat.appendChild(msg);
    chat.appendChild(time);

    input.value = '';
    chat.scrollTop = chat.scrollHeight;
  }
const closeChat = document.querySelector('#closebtn');
closeChat.addEventListener('click', function(e){
  chatHome.style.display = "none";
  content.style.display = "block";
});
//todo手機螢幕切換聊天室大小
function adjustChatroomSize() {
  const chatHome = document.getElementById('chatHome');
  if (window.innerWidth <= 768) {
    chatHome.classList.add('fullscreen'); // 手機版，全螢幕
  } else {
    chatHome.classList.remove('fullscreen'); // 桌機版，固定大小
  }
}

// 頁面載入與視窗變化時都執行
window.addEventListener('load', adjustChatroomSize);
window.addEventListener('resize', adjustChatroomSize);

function flyToCart(button) {
  const cart = document.getElementById('cartIcon');
  const icon = document.createElement('div');
  icon.className = 'flying-icon';

  const startRect = button.getBoundingClientRect();
  const endRect = cart.getBoundingClientRect();

  icon.style.left = startRect.left + 'px';
  icon.style.top = startRect.top + 'px';
  document.body.appendChild(icon);

  setTimeout(() => {
    icon.style.transition = 'all 0.8s ease-in-out';
    icon.style.left = endRect.left + 'px';
    icon.style.top = endRect.top + 'px';
    icon.style.transform = 'scale(0.3)';
    icon.style.opacity = '0.2';
  }, 10);

  setTimeout(() => {
    document.body.removeChild(icon);
  }, 900);
}
function playUfoAnimation(button) {
  const cart = document.getElementById('cartIcon');
  const start = button.getBoundingClientRect();
  const end = cart.getBoundingClientRect();

  const ufo = document.createElement('img');
  ufo.src = '../svg/bigalien.svg';
  ufo.className = 'ufo';

  const gift = document.createElement('img');
  gift.src = '../svg/bigmystery.svg';
  gift.className = 'gift';


  ufo.style.left = start.left + 'px';
  ufo.style.top = (start.top - 100) + 'px';

  const beam = document.createElement('div');
  beam.className = 'beam';
  beam.style.left = (start.left - 10) + 'px';
  beam.style.top = (start.top - 10) + 'px';

  gift.style.left = start.left + 'px';
  gift.style.top = start.top + 'px';

  document.body.appendChild(ufo);
  document.body.appendChild(beam);
  document.body.appendChild(gift);

  setTimeout(() => {
    beam.style.opacity = 1;
  }, 200);

  setTimeout(() => {
    gift.style.top = (start.top - 60) + 'px';
    gift.style.transform = 'scale(0.6)';
  }, 500);

  setTimeout(() => {
    gift.style.transform = 'scale(0)';
  }, 1100);

  // ❌ 禮物消失後關閉光束
  setTimeout(() => {
    beam.style.opacity = 0;
  }, 1400);

  // ✅ 太空船在光束關閉後才移動
  setTimeout(() => {
    ufo.style.left = end.left + 'px';
    ufo.style.top = end.top + 'px';
  }, 1700);

  setTimeout(() => {
    document.body.removeChild(ufo);
    document.body.removeChild(beam);
    document.body.removeChild(gift);

    // ✅ 加入購物車數量 +1 並加動畫
    let count = parseInt(cartCount.textContent, 10);
    cartCount.textContent = count + 1;
    cartCount.classList.add('bump');

    // 移除動畫 class（結束縮放）
    setTimeout(() => {
      cartCount.classList.remove('bump');
    }, 300);
  }, 2400);
  setTimeout(() => {
    Swal.fire({
    title: "商品已加入購物車",
    icon: "success",
    showConfirmButton: false,
    timer: 1800
  });
}, 2700);

}