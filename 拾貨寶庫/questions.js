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
// 取得所有內容區塊與側邊欄 li 項
const sections = document.querySelectorAll('main section');
const navItems = document.querySelectorAll('nav ul li');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 當區塊進入視窗時，取得它的 id
      const id = entry.target.getAttribute('id');
      // 移除所有 active 狀態
      navItems.forEach(item => item.classList.remove('active'));
      // 根據 id 找到對應的側邊欄連結並加上 active
      const activeLink = document.querySelector(`nav ul li a[href="#${id}"]`);
      if (activeLink && activeLink.parentElement) {
        activeLink.parentElement.classList.add('active');
      }
    }
  });
}, { threshold: 0.45 }); // 當 60% 的區塊可見時觸發

// 為每個內容區塊啟用觀察
sections.forEach(section => observer.observe(section));