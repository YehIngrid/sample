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
          // offset = currentIndex * 600 + 300 - (containerWidth / 2)
          offset = currentIndex * slideWidth + slideWidth/2 - containerWidth/2;
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
        autoSlide = setInterval(moveToNext, 3000);
      });
      arrowRight.addEventListener('click', () => {
        clearInterval(autoSlide);
        moveToNext();
        autoSlide = setInterval(moveToNext, 3000);
      });
      
      // 畫面尺寸變化時更新輪播位置
      window.addEventListener('resize', updateCarousel);
      
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // 當頁籤變回可見時，強制更新狀態
          updateCarousel();
        }
      });
      