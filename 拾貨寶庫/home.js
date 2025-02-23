function animateNumber(target, start, end, duration) {
    let obj = { value: start };
    gsap.to(obj, {
        value: end,
        duration: duration,
        roundProps: "value",
        ease: "power2.out",
        onUpdate: function () {
            document.querySelector(target).textContent = Math.round(obj.value);
        }
    });
}

// 建立 Intersection Observer
let observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            startAllAnimations();
        }
    });
}, { threshold: 0.5 });

function startAllAnimations() {
    animateNumber("#trees", 0, 4, 2);
    animateNumber("#bags", 0, 100, 2.5);
    animateNumber("#co2", 0, 4, 3);
}
const slideInElement = document.querySelector('.slide-in');

    // 設定 IntersectionObserver，當目標至少有50%可見時觸發
    const observer1 = new IntersectionObserver(entries => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            slideInElement.classList.add('active');
        } else {
            slideInElement.classList.remove('active');
        }
        });
    }, { threshold: 0.1 });

    observer1.observe(slideInElement);

    // const fadeInElement = document.querySelector('.fade-in');

    // // 設定 IntersectionObserver，當目標至少有50%可見時觸發
    // const observer2 = new IntersectionObserver(entries => {
    //     entries.forEach(entry => {
    //     if (entry.isIntersecting) {
    //         fadeInElement.classList.add('active');
    //     } else {
    //         fadeInElement.classList.remove('active');
    //     }
    //     });
    // }, { threshold: 0.2 });

    // observer2.observe(fadeInElement);

    const target = document.querySelector('.slide-text');

    // 設定 IntersectionObserver，當元素至少50%可見時觸發
    const observer3 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          target.classList.add('active');
        } else {
          target.classList.remove('active');
        }
      });
    }, { threshold: 0.9 });

    observer3.observe(target);

// 檢查頁面載入時 `#trees` 是否已經在視窗內
document.addEventListener("DOMContentLoaded", () => {
    let target = document.querySelector("#trees");

    if (!target) return; // 確保元素存在

    let rect = target.getBoundingClientRect();
    let isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
        startAllAnimations(); // 直接執行動畫
    } else {
        observer.observe(target); // 滑動進入時才執行動畫
    }
});
function scrollToContent() {
    // 滾動到下一個視窗高度
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  }

  const jitterElement = document.querySelector('.jitter-text');

  // 使用 IntersectionObserver 監控目標元素是否進入 viewport
  const observer4 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 當元素至少有50%進入視窗時，加入抖動效果
        jitterElement.classList.add('jitter-active');
      } else {
        // 離開時移除抖動效果
        jitterElement.classList.remove('jitter-active');
      }
    });
  }, { threshold: 0.5 });

  observer4.observe(jitterElement);

  const scalefunc = document.querySelector('.scale-up');

  // 使用 IntersectionObserver 監控目標元素是否進入 viewport
  const observer5 = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        
        scalefunc.classList.add('active');
      } else {
        
        scalefunc.classList.remove('active');
      }
    });
  }, { threshold: 0.5 });

  observer5.observe(jitterElement);
  