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
const collapsibles = document.querySelectorAll('.collapsible');
collapsibles.forEach(btn => {
  btn.addEventListener('click', function () {
    const content = this.nextElementSibling;
    const icon = this.querySelector('.icon');

    content.classList.toggle('show');

    if (content.classList.contains('show')) {
      icon.classList.remove('fa-plus');
      icon.classList.add('fa-minus');
    } else {
      icon.classList.remove('fa-minus');
      icon.classList.add('fa-plus');
    }
  });
});

// ================== Hash 自動展開 ==================
function openFaqById(id) {
  const target = document.getElementById(id);
  if (!target) return;

  // id 可能在 <li> 上，也可能直接在 <button class="collapsible"> 上
  const btn = target.classList.contains('collapsible')
    ? target
    : target.querySelector('.collapsible');
  if (!btn) return;

  const content = btn.nextElementSibling;
  const icon = btn.querySelector('.icon');

  if (content && !content.classList.contains('show')) {
    content.classList.add('show');
    if (icon) {
      icon.classList.remove('fa-plus');
      icon.classList.add('fa-minus');
    }
  }

  // 稍微往上偏移，讓標題不被 navbar 遮住
  setTimeout(() => {
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 50);
}

// 頁面載入時根據 hash 展開（例如 questions.html#howtobuy）
const initHash = window.location.hash.slice(1);
if (initHash) {
  openFaqById(initHash);
}

// 在同一頁點擊側邊欄連結時也能展開
window.addEventListener('hashchange', () => {
  openFaqById(window.location.hash.slice(1));
});