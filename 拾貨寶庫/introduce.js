window.onload = function() {
    const loader = document.getElementById('loader');
    const thiscontent = document.getElementById('whatcontent');
    if (loader && thiscontent) {
      loader.style.display = 'none';
      thiscontent.style.display = 'block';

      // ✅ 等畫面顯示後再初始化 AOS
      AOS.init({
        disable: false,
        duration: 800,
        once: false,
        offset: 0
      });

      // ✅ 若動畫元素是後來才顯示出來，也可以強制刷新
      AOS.refresh();
    }
  };