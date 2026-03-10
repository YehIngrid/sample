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
// ── i18n ──
const i18n = {
  zh: {
    'loading':'拾貨寶庫加載中...',
    'nav.home':'首頁','nav.shop':'購物首頁','nav.market':'購物商場',
    'nav.wishpool':'許願專區','nav.news':'最新資訊',
    'nav.faq.link':'常見問題','nav.contact':'客服諮詢',
    'hero.tag':'專為大學生設計',
    'hero.title':'拾貨寶庫',
    'hero.subtitle':'一個專為學生設計的校園共享經濟平台',
    'hero.btn.shop':'立即開始購物','hero.btn.browse':'逛逛其他分頁',
    'hero.bubble1':'免費刊登二手商品','hero.bubble2':'校園安全交易','hero.bubble3':'環保循環利用',
    'p1.title':'二手交易｜資源循環，從你我開始',
    'p1.hook':'不想花大錢買新書？搬宿舍家具沒地方放？',
    'p1.intro':'在這裡，你可以：',
    'p1.li1':'快速上架二手書、生活用品、家具、電器',
    'p1.li2':'限校交易，面交更方便、安全又放心',
    'p1.li3':'免抽成，免費上架，資源再利用、生活更省錢',
    'p1.close':'從同學手中接力一份實用，也讓自己的東西找到下一個需要的人！',
    'p2.title':'校園商機｜學生商機無限，讓品牌走進校園生活',
    'p2.hook':'想拓展學生市場？不知道怎麼接觸在校生？',
    'p2.intro':'在這裡，你可以：',
    'p2.li1':'直接上架產品與優惠，觸及對口學生族群',
    'p2.li2':'限校曝光，精準行銷，創造在地熟悉感與信任感',
    'p2.close':'讓學生在滑平台時看到你的品牌，<br>也讓你的產品成為他們生活的一部分！',
    'reason.title':'為什麼選擇拾貨寶庫？',
    'reason.safe.title':'安全交易','reason.safe.desc':'校內身份認證，保障買賣雙方權益。',
    'reason.eco.title':'環保永續','reason.eco.desc':'推動資源循環，為地球盡一份力。',
    'reason.campus.title':'校園專屬','reason.campus.desc':'精準社群定位，讓交易與資訊更即時貼近。',
    'reason.exp.title':'經驗變現','reason.exp.desc':'經驗有價，一篇懶人包也能幫你賺零用錢。',
    'trade.title':'您的每一項二手交易',
    'trade.trees.unit':'棵','trade.trees.desc':'相當於種了四棵樹。',
    'trade.bags.unit':'個','trade.bags.desc':'相當於減了100個塑膠袋。',
    'trade.co2.unit':'公斤','trade.co2.desc':'相當於吸收了4公斤的二氧化碳。',
    'service.title':'我們的服務',
    'service.c2c.title':'C2C二手交易',
    'service.c2c.desc':'拾貨寶庫提供專為學生設計的 C2C（個人對個人）二手交易平台，透過學生身份認證，確保買賣雙方的安全與便利，並支援校內面交，讓交易更順暢。',
    'service.wish.title':'許願池',
    'service.wish.desc':'買家可在許願池提交自己想要的商品或需要的資訊，當有賣家上架相符商品時，系統會自動通知，提高購買成功率，也讓賣家能夠更精準地提供市場需求商品。',
    'faq.title':'常見問題','faq.q':'問',
    'faq.q1.q':'使用該應用程式需要付費嗎？','faq.q1.a':'本平台提供免費與付費功能，基本使用為免費。',
    'faq.q2.q':'下班後有什麼安排嗎？','faq.q2.a':'我們會定期舉辦交流活動與社群聚會。',
    'faq.q3.q':'是否有年齡限制？','faq.q3.a':'需年滿18歲才能使用本平台服務。',
    'faq.more':'看其他問題 →',
    'about.h3':'關於我們','about.team.title':'團隊介紹',
    'about.goal':'一手資源，一手經驗，全在拾貨寶庫！',
    'about.desc1':'拾貨寶庫是一個專為大學生打造的校園二手與資訊交易平台。',
    'about.desc2':'結合二手商品、學習經驗、環保理念與學生社群。',
    'about.desc3':'讓物品有去處，知識有價值，交流更有趣！',
    'about.members.title':'團隊成員',
    'about.members.desc':'我們是一支充滿創新與多元背景的團隊，來自不同領域的年輕創業者，致力於打造可持續發展的二手買賣、資訊交易、校園商機平台 「拾貨寶庫」。',
    'about.role1':'企劃策略','about.role2':'營運部門','about.role3':'行銷企劃',
    'about.role4':'技術部門 後端開發','about.role5':'技術部門 前端設計',
    'about.school1':'國立中興大學 創新產業經營系',
    'about.school2':'私立崇仁醫護管理專科學校 護理系',
    'about.school3':'國立高雄科技大學 運籌管理系',
    'about.school4':'國立中興大學 資訊工程學系',
    'about.school5':'國立中興大學 資訊工程學系',
    'about.history.title':'團隊經歷',
    'about.history.desc1':'我們的團隊成員擁有豐富的競賽經驗，並在多項創新創業比賽中獲得佳績。',
    'about.history.desc2':'我們相信，結合資訊科技、產業經營、行銷管理與行政專業的跨領域優勢，能為社會帶來更具影響力的創新解決方案，推動綠色消費、循環經濟與資訊交易的發展！',
    'footer.contact':'聯絡我們','footer.email.label':'電子郵件：',
    'footer.about':'關於我們',
    'footer.about.desc':'一個專為大學生打造的二手商場、校園商機、資訊交易整合平台',
    'footer.social':'社交媒體',
    'footer.copyright':'Copyright© 2025拾貨寶庫｜All Rights Reserved.',
    'footer.faq':'常見問題','footer.contact.link':'客服諮詢',
    'footer.policy':'隱私政策','footer.terms':'使用條款','footer.refund':'退換貨政策',
  },
  en: {
    'loading':'TreasureHub Loading...',
    'nav.home':'Home','nav.shop':'Shop','nav.market':'Market',
    'nav.wishpool':'Wish Pool','nav.news':'News',
    'nav.faq.link':'FAQ','nav.contact':'Contact',
    'hero.tag':'Designed for University Students',
    'hero.title':'Treasure Hub',
    'hero.subtitle':'A campus sharing economy platform designed for students',
    'hero.btn.shop':'Start Shopping','hero.btn.browse':'Browse More',
    'hero.bubble1':'Free Listing Secondhand Items','hero.bubble2':'Safe Campus Trade','hero.bubble3':'Eco-Friendly',
    'p1.title':'Secondhand Trade | Circular Economy, Starting with Us',
    'p1.hook':"Don't want to spend big on textbooks? No room for dorm furniture?",
    'p1.intro':'Here, you can:',
    'p1.li1':'Quickly list secondhand books, daily goods, furniture & electronics',
    'p1.li2':'Campus-only trades — in-person exchange, safe & convenient',
    'p1.li3':'Zero commission, free listing — reuse resources, save more',
    'p1.close':'Pass on something useful from a classmate, and help your own items find the next person who needs them!',
    'p2.title':'Campus Business | Unlimited Opportunities, Bring Your Brand to Campus',
    'p2.hook':'Looking to reach the student market? Not sure how to connect with students?',
    'p2.intro':'Here, you can:',
    'p2.li1':'List products and deals directly to reach your target student audience',
    'p2.li2':'Campus-targeted exposure for precise marketing and local brand trust',
    'p2.close':"Let students discover your brand while browsing,<br>and make your products part of their daily lives!",
    'reason.title':'Why Choose Treasure Hub?',
    'reason.safe.title':'Safe Trading','reason.safe.desc':'Campus identity verification protects both buyers and sellers.',
    'reason.eco.title':'Eco-Friendly','reason.eco.desc':'Promoting resource circulation, doing our part for the planet.',
    'reason.campus.title':'Campus Exclusive','reason.campus.desc':'Precise community targeting for real-time, relevant trades and info.',
    'reason.exp.title':'Monetize Experience','reason.exp.desc':'Experience has value — one guide can earn you pocket money.',
    'trade.title':'Every Secondhand Trade You Make',
    'trade.trees.unit':'trees','trade.trees.desc':'Equivalent to planting four trees.',
    'trade.bags.unit':'bags','trade.bags.desc':'Equivalent to eliminating 100 plastic bags.',
    'trade.co2.unit':'kg','trade.co2.desc':'Equivalent to absorbing 4 kg of CO₂.',
    'service.title':'Our Services',
    'service.c2c.title':'C2C Secondhand Trade',
    'service.c2c.desc':'Treasure Hub offers a C2C (consumer-to-consumer) secondhand platform designed for students. Campus identity verification ensures safe and convenient trading, with in-person campus exchanges for smoother transactions.',
    'service.wish.title':'Wish Pool',
    'service.wish.desc':"Buyers can submit wishlists for items they need. When a seller lists a matching item, the system automatically notifies them — boosting purchase success and helping sellers meet real market demand.",
    'faq.title':'FAQ','faq.q':'Q',
    'faq.q1.q':'Is there a fee to use this platform?','faq.q1.a':'The platform offers both free and premium features. Basic usage is free.',
    'faq.q2.q':'What activities are available after hours?','faq.q2.a':'We regularly host community events and social gatherings.',
    'faq.q3.q':'Is there an age requirement?','faq.q3.a':'Users must be at least 18 years old to use this platform.',
    'faq.more':'More Questions →',
    'about.h3':'About Us','about.team.title':'Team Introduction',
    'about.goal':'Resources in one hand, experience in the other — all at Treasure Hub!',
    'about.desc1':'Treasure Hub is a campus secondhand and information trading platform built for university students.',
    'about.desc2':'Combining secondhand goods, learning experiences, eco values, and the student community.',
    'about.desc3':'Giving items a new home, making knowledge valuable, and making connections more fun!',
    'about.members.title':'Team Members',
    'about.members.desc':'We are an innovative team from diverse backgrounds — young entrepreneurs dedicated to building a sustainable platform for secondhand trading, information exchange, and campus business.',
    'about.role1':'Strategy & Planning','about.role2':'Operations','about.role3':'Marketing',
    'about.role4':'Tech – Backend Dev','about.role5':'Tech – Frontend Design',
    'about.school1':'NCHU – Innovation & Entrepreneurship',
    'about.school2':'Chung Jen College – Nursing',
    'about.school3':'NKUST – Logistics Management',
    'about.school4':'NCHU – Computer Science',
    'about.school5':'NCHU – Computer Science',
    'about.history.title':'Team Achievements',
    'about.history.desc1':'Our team members have rich competition experience and have won awards in multiple innovation and entrepreneurship competitions.',
    'about.history.desc2':'We believe that combining IT, business management, marketing, and administrative expertise can bring more impactful solutions to society — driving green consumption, circular economy, and information trading.',
    'footer.contact':'Contact Us','footer.email.label':'Email: ',
    'footer.about':'About Us',
    'footer.about.desc':'An integrated platform for secondhand shopping, campus business, and information trading for university students.',
    'footer.social':'Social Media',
    'footer.copyright':'Copyright© 2025 Treasure Hub｜All Rights Reserved.',
    'footer.faq':'FAQ','footer.contact.link':'Customer Service',
    'footer.policy':'Privacy Policy','footer.terms':'Terms of Use','footer.refund':'Return Policy',
  }
};

let currentLang = localStorage.getItem('nhLang') || 'zh';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('nhLang', lang);
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-TW' : 'en');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang]?.[key] !== undefined) el.textContent = i18n[lang][key];
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (i18n[lang]?.[key] !== undefined) el.innerHTML = i18n[lang][key];
  });

  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中文';
}

function toggleLang() {
  applyLang(currentLang === 'zh' ? 'en' : 'zh');
}

// Apply saved / non-default language on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('langToggle');
  if (currentLang !== 'zh') {
    applyLang(currentLang);
  } else if (btn) {
    btn.textContent = 'EN';
  }
});

// ── AOS init ──
document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic', offset: 60 });
  }
});

// ── Scroll progress bar ──
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  const bar = document.getElementById('scroll-progress');
  if (bar) bar.style.width = pct + '%';
});

const questions = document.querySelectorAll(".faq-question");

questions.forEach(q => {
  q.addEventListener("click", () => {

    const answer = q.nextElementSibling;

    if(answer.style.display === "block"){
      answer.style.display = "none";
    }else{
      answer.style.display = "block";
    }

  });
});