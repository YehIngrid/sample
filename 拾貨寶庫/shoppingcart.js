//TODO 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
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

//TODO 手機版：點擊黑色搜尋圖示時，隱藏該圖示並顯示搜尋表單（新行出現）
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
document.addEventListener('DOMContentLoaded', function() {
    // 1. 左側側邊欄選單切換
    const navItems = document.querySelectorAll('.nav-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
  
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // 移除其他項目的 active
        navItems.forEach(i => i.classList.remove('active'));
        // 給自己加上 active
        item.classList.add('active');
  
        // 隱藏所有 tab-content
        tabContents.forEach(tab => {
          tab.classList.remove('active');
        });
  
        // 顯示對應的 tab-content
        const tabId = item.getAttribute('data-tab'); // 讀取 data-tab 屬性
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
          targetTab.classList.add('active');
        }
      });
    });
  
    // 2. 購物車內的子標籤切換
    const cartTabButtons = document.querySelectorAll('.cart-tab-button');
    const cartTabContents = document.querySelectorAll('.cart-tab-content');
  
    cartTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // 移除其他按鈕的 active
        cartTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
  
        // 隱藏所有 cart-tab-content
        cartTabContents.forEach(ctc => ctc.classList.remove('active'));
  
        // 顯示對應的 cart-tab-content
        const cartTabId = btn.getAttribute('data-cart-tab');
        const targetContent = document.getElementById(cartTabId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  });
  