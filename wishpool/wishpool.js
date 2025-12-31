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
  const tags = document.querySelectorAll('.tag');
  const items = document.querySelectorAll('.item');
  
  function filterItems() {
    // 目前被選取的 tags
    const activeTags = Array.from(tags)
      .filter(tag => tag.classList.contains('active'))
      .map(tag => tag.dataset.tag);
  
    items.forEach(item => {
      const itemTags = item.dataset.tags.split(' ');
  
      // 沒選任何 tag → 全顯示
      if (activeTags.length === 0) {
        item.style.display = 'block';
        return;
      }
  
      // 只要符合「任一個」被選 tag 就顯示（OR）
      const match = activeTags.every(tag =>
        itemTags.includes(tag)
      );
  
      item.style.display = match ? 'block' : 'none';
    });
  }
  
  tags.forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active'); // 重點！
      filterItems();
    });
  });