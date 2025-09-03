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
    if(mobileSearchIcon != null) {
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
    }
  });

  