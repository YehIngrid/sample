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
// 當頁面載入完成後，先預加載所有圖片
window.addEventListener('load', () => {
  const imageUrls = [
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    'https://github.com/YehIngrid/sample/blob/main/%E5%BB%A3%E5%91%8A%E8%A8%AD%E8%A8%88%E9%A0%81%E6%AD%A3%E5%BC%8F%E7%89%88.jpg?raw=true',
    
  ];
  imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
  });

  // 以下為原本的輪播程式碼

  const carousel = document.querySelector('.carousel');
  const track = document.querySelector('.carousel-track');
  let containerWidth = carousel.offsetWidth;
  let slideWidth = 600; // 桌面版預設幻燈片寬度
  // 初始設定：第一個真實幻燈片在 index 1
  let currentIndex = 1;
  
  // 更新輪播位置，根據容器寬度調整計算
  function updateCarousel() {
    containerWidth = carousel.offsetWidth;
    let offset;
    if (containerWidth < 800) {
      // 手機版：幻燈片全寬
      slideWidth = containerWidth;
      // currentIndex 從 1 代表第一個真實幻燈片，因此 offset = (currentIndex - 1) * slideWidth
      offset = (currentIndex - 1) * slideWidth;
    } else {
      // 桌面版：幻燈片固定 600px
      slideWidth = 600;
      // offset = currentIndex * 600 + slideWidth/2 - (containerWidth / 2)
      offset = currentIndex * slideWidth + slideWidth / 2 - containerWidth / 2;
    }
    track.style.transform = `translateX(-${offset}px)`;
  }
  updateCarousel();
  
  // 前進到下一張
  function moveToNext() {
    track.style.transition = "transform 0.5s ease";
    currentIndex++;
    updateCarousel();
  }
  
  // 往回上一張
  function moveToPrev() {
    track.style.transition = "transform 0.5s ease";
    currentIndex--;
    updateCarousel();
  }
  
  // 無縫循環處理：監聽 transitionend 事件
  track.addEventListener('transitionend', () => {
    const slides = document.querySelectorAll('.slide');
    // 如果移動到複製的第一張（最後一張），則重置到第一個真實幻燈片
    if (currentIndex === slides.length - 1) {
      track.style.transition = "none";
      currentIndex = 1;
      updateCarousel();
      void track.offsetWidth;
      track.style.transition = "transform 0.5s ease";
    }
    // 如果移動到複製的最後一張（index = 0），則重置到最後一個真實幻燈片
    else if (currentIndex === 0) {
      track.style.transition = "none";
      currentIndex = slides.length - 2;
      updateCarousel();
      void track.offsetWidth;
      track.style.transition = "transform 0.5s ease";
    }
  });
  
  // 自動輪播，每 3 秒前進一次
  let autoSlide = setInterval(moveToNext, 3000);
  
  // 箭頭點擊事件
  const arrowLeft = document.querySelector('.arrow-left');
  const arrowRight = document.querySelector('.arrow-right');
  arrowLeft.addEventListener('click', () => {
    clearInterval(autoSlide); // 手動操作時暫停自動輪播
    moveToPrev();
    autoSlide = setInterval(moveToNext, 2000);
  });
  arrowRight.addEventListener('click', () => {
    clearInterval(autoSlide);
    moveToNext();
    autoSlide = setInterval(moveToNext, 2000);
  });
  
  // 畫面尺寸變化時更新輪播位置
  window.addEventListener('resize', updateCarousel);
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // 當頁籤變回可見時，強制更新狀態
      updateCarousel();
    }
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const mobileSearchIcon = document.getElementById('mobileSearchIcon');
  const searchForm = document.getElementById('searchForm');
  
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
});
//JavaScript: 控制左右按鈕捲動

  const scrollContainer = document.getElementById('scrollContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // 點擊「←」按鈕，向左捲動
  prevBtn.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: -200,       // 向左捲動 200px
      behavior: 'smooth'
    });
  });

  // 點擊「→」按鈕，向右捲動
  nextBtn.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: 200,        // 向右捲動 200px
      behavior: 'smooth'
    });
  });