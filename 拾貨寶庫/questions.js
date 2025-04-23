
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

