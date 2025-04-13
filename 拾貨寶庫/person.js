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
  document.getElementById('update-profile').addEventListener('click', async () => {
    const displayName = document.getElementById('display-name').value.trim();
    const photoInput = document.getElementById('photo');
    const bio = document.getElementById('bio').value.trim();
    const loader1 = document.getElementById('loader1');

  
    const formData = new FormData();
    if (displayName) formData.append('displayName', displayName);
    if (bio) formData.append('bio', bio);
    if (photoInput.files.length > 0) formData.append('photo', photoInput.files[0]);
  
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        Swal.fire({
          icon: "warning",
          title: "尚未登入",
          text: "請先登入帳號"
        });
        return;
      }
  // ✅ 顯示 loader
  loader1.style.display = 'block';
      const idToken = await user.getIdToken();
      const response = await fetch('https://store-backend-iota.vercel.app/api/account/update', {
        method: 'PUT',
        headers: {
          'idtoken': idToken,
        },
        body: formData
      });
  
      const text = await response.text();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "更新成功",
          text: "個人資料已更新"
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "更新失敗",
        });
      }
  
    } catch (err) {
      console.error("更新錯誤：", err);
      Swal.fire({
        icon: "error",
        title: "發生錯誤",
        text: "請稍後再試"
      });
    }finally {
      // ✅ 不管成功或失敗都隱藏 loader
      loader1.style.display = 'none';
    }
  });