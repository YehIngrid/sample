document.querySelectorAll('a[data-spa]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); // 阻止跳頁
      location.hash = link.getAttribute('href');
    });
    const pages = document.querySelectorAll('.page');
    const links = document.querySelectorAll('.nav-link');
  
    function showPage(hash) {
      pages.forEach(p => p.classList.remove('active'));
      links.forEach(l => l.classList.remove('active'));
  
      const target = document.querySelector(hash);
      const link = document.querySelector(`a[href="${hash}"]`);
  
      if (target) target.classList.add('active');
      if (link) link.classList.add('active');
    }
  
    // 點擊切換
    window.addEventListener('hashchange', () => {
      showPage(location.hash);
    });
  
    // 第一次載入
    showPage(location.hash || '#wishpool');
  });