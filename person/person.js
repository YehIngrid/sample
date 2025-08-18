
// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
    var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
}
  const mProfileName = document.getElementById('mProfileName');
  const mProfileInfo = document.getElementById('mProfileInfo');
  const mProfileAvatar = document.getElementById('mProfileAvatar');
  mProfileName.textContent = localStorage.getItem("username") || "使用者名稱"; // 替換為實際使用者名稱
  mProfileInfo.textContent = localStorage.getItem("intro") || "使用者介紹"; // 替換為實際使用者介紹
  if (localStorage.getItem('avatar')) {
    mProfileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
  }
  else { 
    mProfileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
  }
  const profileName = document.getElementById('profileName');
  const profileInfo = document.getElementById('profileInfo');
  const profileAvatar = document.getElementById('profileAvatar');
  console.log("使用者名稱：", localStorage.getItem('username'));
  console.log("使用者介紹：", localStorage.getItem('intro'));
  // ?這邊預覽照片部分
  // if (localStorage.getItem('avatar')) {
  //   viewavatar.src = localStorage.getItem('avatar');
  // } else {
  //   viewavatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
  // }
  profileInfo.textContent = localStorage.getItem("intro") || "使用者介紹"; // 替換為實際使用者介紹
  profileName.textContent = localStorage.getItem("username") ||"使用者名稱"; // 替換為實際使用者名稱
  document.getElementById('update-profile').addEventListener('click', async () => {
    const displayName = document.getElementById('display-name').value.trim();
    const photoInput = document.getElementById('photo');
    const bio = document.getElementById('bio').value.trim();
    const loader1 = document.getElementById('loader1');

  
    const formData = new FormData();
    if(!displayName && !bio && photoInput.files.length === 0){
      console.log("沒有任何資料");
      Swal.fire({
        icon: "warning",
        title: "請填寫完整資料",
        text: "請檢查是否有空白欄位"
      });
      return;
    }
    if (displayName) formData.append('name', displayName);
    if (bio) formData.append('introduction', bio);
    if (photoInput.files.length > 0) formData.append('photo', photoInput.files[0]);
  
    try {
      // const user = firebase.auth().currentUser;
      // if (!user) {
      //   Swal.fire({
      //     icon: "warning",
      //     title: "尚未登入",
      //     text: "請先登入帳號"
      //   });
      //   return;
      // }
  // ✅ 顯示 loader
  loader1.style.display = 'block';
      let backendService = new BackendService();
      const response = await backendService.updateProfile(formData, (data) => {
        console.log("更新成功：", data);
        localStorage.setItem('username', data.data.name);
        localStorage.setItem('intro', data.data.introduction);
        console.log(data.data.introduction);
        if (data.data.avatar) {
          localStorage.setItem('avatar', data.data.avatar);
          profileAvatar.src = data.data.avatar; // 更新顯示的圖片
        }
        profileName.textContent = data.data.name; // 更新顯示的名稱
        profileInfo.textContent = localStorage.getItem('intro'); // 更新顯示的介紹
        Swal.fire({
          icon: "success",
          title: "更新成功",
          text: "個人資料已更新"
        }).then(() => {
          window.location.reload(); // 重新載入頁面以顯示最新資料
        });
      }, (errorMessage) => {
        console.error("更新失敗：", errorMessage);
        Swal.fire({
          icon: "error",
          title: "更新失敗",
          text: errorMessage
        });
      });
      loader1.style.display = 'none';
      console.log("更新回傳資料：", response);
      // 更新成功後，重新載入頁面以顯示最新資料
      profileName.textContent = localStorage.getItem('username') || "使用者名稱";
      profileInfo.textContent = localStorage.getItem('intro') || "使用者介紹";
      if (localStorage.getItem('avatar')) {
        profileAvatar.src = localStorage.getItem('avatar'); // 更新顯示的圖片
      } else {
        profileAvatar.src = '../image/default-avatar.png'; // 替換為預設圖片的 URL
      }

    } catch (error) {
      console.error("更新失敗：", error);
      Swal.fire({
        icon: "error",
        title: "更新失敗",
        text: "請稍後再試"
      });
    }
  });
  
const mcollapsebtn = document.getElementById('mcollapsebtn');
mcollapsebtn.addEventListener('click', function () {
    const mainContentArea = document.getElementById('mainContentArea');
    mainContentArea.classList.toggle('d-none'); // 切換主內容的顯示狀態
    const target = document.getElementById('collapseContent');
    target.classList.toggle('show'); // 切換折疊內容的顯示狀態
    const backbtn7 = document.getElementById('back-btn7');
    if (target.classList.contains('show')) {
      backbtn7.style.display = 'block'; // 顯示返回按鈕
    } else {
      backbtn7.style.display = 'none'; // 隱藏返回按鈕
    }
  }
);

  document.getElementById('collapsebtn').addEventListener('click', function () {
    const mainContentArea = document.getElementById('mainContentArea');
    mainContentArea.classList.toggle('d-none'); // 切換主內容的顯示狀態
    const target = document.getElementById('collapseContent');
    target.classList.toggle('show'); // 切換折疊內容的顯示狀態
    const backbtn7 = document.getElementById('back-btn7');
    if (target.classList.contains('show')) {
      backbtn7.style.display = 'block'; // 顯示返回按鈕
    } else {
      backbtn7.style.display = 'none'; // 隱藏返回按鈕
    }
  });
  document.getElementById('back-btn7').addEventListener('click', function () {
    const mainContentArea = document.getElementById('mainContentArea');
    mainContentArea.classList.remove('d-none'); // 顯示主內容
    const target = document.getElementById('collapseContent');
    target.classList.remove('show'); // 隱藏折疊內容
    this.style.display = 'none'; // 隱藏返回按鈕
  });
const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', function() {
  Swal.fire({
    title: '確定要登出嗎？',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '登出',
    cancelButtonText: '取消'
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('uid');
      localStorage.removeItem('username');
      localStorage.removeItem('intro');
      localStorage.removeItem('avatar');
      Swal.fire({
        icon: 'success',
        title: '登出成功',
        text: '您已成功登出'
      }).then(() => {
        window.location.href = '../account/account.html'; // 登出後跳轉到首頁
      });
    }
  });
});