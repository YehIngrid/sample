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
window.onload = function() {
// 當頁面載入完畢後隱藏載入動畫，顯示內容
var loader = document.getElementById('loader');
var content = document.getElementById('contentofnewhome');
if (loader && content) {
  loader.style.setProperty('display', 'none', 'important');
  content.style.setProperty('display', 'block', 'important');
  AOS.init({
        disable: false,     // ✅ 手機也開啟動畫     // ✅ 動畫時間
        once: false,        // ✅ 是否只播放一次
        offset: 0           // ✅ 滑到一進畫面就觸發
      });

      // 3. 刷新 AOS 確保載入後的內容有動畫
      AOS.refresh();
}
};
function scrollCards(direction) {
const container = document.getElementById('cardContainer');
const cardWidth = container.querySelector('.cardofscroll').offsetWidth + 16; // 卡片寬＋間距
container.scrollBy({
    left: direction * cardWidth,
    behavior: 'smooth'
});
}
function scrollToNext() {
    const nextSection = document.getElementById('next-section');
    nextSection.scrollIntoView({ behavior: 'smooth' });
}


function initFH() {
    new FinisherHeader({
        parent: document.getElementById('hero'),
  "count": 34,
  "size": {
    "min": 1,
    "max": 20,
    "pulse": 0
  },
  "speed": {
    "x": {
      "min": 0,
      "max": 0.4
    },
    "y": {
      "min": 0,
      "max": 0.1
    }
  },
  "colors": {
    "background": "#004b97",
    "particles": [
      "#ffffff",
      "#87ddfe",
      "#acaaff",
      "#1bffc2",
      "#f88aff"
    ]
  },
  "blending": "screen",
  "opacity": {
    "center": 0,
    "edge": 0.4
  },
  "skew": -2,
  "shapes": [
    "c",
    "s",
    "t"
  ]
});

}

// 等整個頁面載完再跑，避免高度=0
window.addEventListener('load', initFH);
// 視窗大小改變就重建一次
window.addEventListener('resize', initFH);