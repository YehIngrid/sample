// ── Token 驗證（私密 URL）──
window.isTokenValid = true;
(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const VALID_TOKEN = 'treasurehub2024';

  if (token !== VALID_TOKEN) {
    window.isTokenValid = false;
  }
})();

// ── Save / bookmark button on every article card ──
var bmOutline = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 H18 A1 1 0 0 1 19 4 V21 L12 16 L5 21 V4 A1 1 0 0 1 6 3 Z"/></svg>';
var bmFilled = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3 H18 A1 1 0 0 1 19 4 V21 L12 16 L5 21 V4 A1 1 0 0 1 6 3 Z"/></svg>';

var STORE_KEY = 'th_cg_saved';
var saved = {};
try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { saved = {}; }

function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) {}
}

function attachSaveButtons() {
  document.querySelectorAll('.article').forEach(function (card, i) {
    var stats = card.querySelector('.read-stats');
    if (!stats) return;

    // 防止重複添加
    if (stats.querySelector('.save-btn')) return;

    var id = 'a' + i;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'save-btn' + (saved[id] ? ' saved' : '');
    btn.innerHTML = (saved[id] ? bmFilled : bmOutline) + '<span>' + (saved[id] ? '已儲存' : '儲存') + '</span>';
    btn.setAttribute('aria-pressed', saved[id] ? 'true' : 'false');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var on = !btn.classList.contains('saved');
      btn.classList.toggle('saved', on);
      btn.innerHTML = (on ? bmFilled : bmOutline) + '<span>' + (on ? '已儲存' : '儲存') + '</span>';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) { saved[id] = true; } else { delete saved[id]; }
      persist();
    });
    stats.appendChild(btn);
  });
}

// ── Navbar login / logout toggle ──
(function () {
  var loginBtn = document.getElementById('loginBtn');
  var userChip = document.getElementById('userChip');
  if (loginBtn && userChip) {
    var AUTH_KEY = 'th_cg_auth';
    function applyAuth(loggedIn) {
      loginBtn.style.display = loggedIn ? 'none' : '';
      userChip.style.display = loggedIn ? '' : 'none';
    }
    var isAuthed = false;
    try { isAuthed = localStorage.getItem(AUTH_KEY) === '1'; } catch (e) {}
    applyAuth(isAuthed);
    loginBtn.addEventListener('click', function () {
      applyAuth(true);
      try { localStorage.setItem(AUTH_KEY, '1'); } catch (e) {}
    });
    userChip.addEventListener('click', function () {
      applyAuth(false);
      try { localStorage.setItem(AUTH_KEY, '0'); } catch (e) {}
    });
  }
})();

// ── Admin button for 校園攻略站 ──
(function () {
  const schoolAdminBtn = document.getElementById('schoolAdminBtn');
  if (schoolAdminBtn) {
    const role = localStorage.getItem('role');
    if (['MODERATOR', 'ADMIN'].includes(role)) {
      schoolAdminBtn.style.display = 'block';
    }
  }
})();

// ── Render featured article ──
(function () {
  const featuredWrap = document.getElementById('featuredWrap');
  if (!featuredWrap) return;

  // Sample featured data - replace with actual API data
  const featured = {
    id: 1,
    title: '中興推台清交：我的備審「修改前後對比」＋面試當天教授提問真題還原',
    excerpt: '逐頁拆解備審改版前後差在哪、自傳每一段教授想看什麼，附三場面試的提問逐字稿與我的回答思路。傳承的不是知識，是踩過的雷。',
    category: '研究所推甄',
    date: '2026 / 05 / 22',
    year: '115 學年',
    author: '創產系 大四 范同學',
    verified: true,
    tags: ['*台大碩士*', '*書卷獎*'],
    reads: '2,184 次閱讀',
    price: '$129',
    currency: 'NT$',
    preview: '前 20%'
  };

  const html = `
    <span class="badge">本週精選</span>
    <div class="cover" style="display:none;"></div>
    <div class="copy">
      <div class="meta-top">
        <span class="cat-pill">${featured.category}</span>
        <span>${featured.date}</span>
        <span>·</span>
        <span>適用 ${featured.year}</span>
      </div>
      <h2>${featured.title}</h2>
      <p class="excerpt">${featured.excerpt}</p>
      <div class="author-row">
        <div class="av"></div>
        <div class="author-info">
          <div class="author-name">${featured.author} <span class="verified">✓ 已認證</span></div>
          <div class="author-tags">
            ${featured.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="read-meta">
          <span><img src="../svg/read.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:4px;" alt="閱讀"> ${featured.reads}</span>
        </div>
      </div>
      <div class="price-box">
        <div class="price">${featured.price} <span class="unit">${featured.currency}</span></div>
        <div class="preview-tag"><strong>${featured.preview}</strong> 內容可免費預覽</div>
        <a class="btn-read" href="school-post.html?id=${featured.id}">立即閱讀 →</a>
      </div>
    </div>
  `;

  featuredWrap.innerHTML = html;
})();

// ── Sample article data and rendering ──
(function () {
  const ARTICLES = [
    {
      id: 2, title: '【中興資工】微積分 王教授通關筆記 ＋ 考古題手寫詳解',
      excerpt: '期中期末必考題型整理、給分習慣、最容易被當的章節，附我自己手寫的考古題逐題詳解。',
      category: '學分攻略', gradient: 'g1', tag: '同校生限定', year: '115 學年',
      author: '資工系 大二 李同學', verified: true, badge: '*書卷獎*', time: '2 天前', price: 'NT$ 99',
      views: '1,182', likes: '96', comments: '31'
    },
    {
      id: 3, title: '拿到台積電實習的英文履歷怎麼寫 ＋ 三輪面試心態與提問心法',
      excerpt: '附 STAR 法則範例與我面試的提問清單，從投遞到拿到 offer 的整個流程與每一關的準備。',
      category: '實習與面試', gradient: 'g2', year: '115 學年',
      author: '電機系 大四 王同學', verified: true, badge: '*台積電實習*', time: '5 天前', price: 'NT$ 149',
      views: '1,604', likes: '128', comments: '44'
    },
    {
      id: 4, title: '多益一個月 500 → 850：我的刷題進度表與聽力閱讀破題技巧',
      excerpt: '低成本速過畢業門檻指南。完整公開我一個月內的每日進度表...',
      category: '證照檢定', nocover: true, year: '長期適用',
      author: '外文系 大三 黃同學', verified: true, badge: '*多益 935*', time: '1 週前', price: 'NT$ 89',
      views: '968', likes: '74', comments: '20'
    },
    {
      id: 5, title: '交換生讀書計畫與自傳怎麼寫 ＋ 姊妹校性價比分析',
      excerpt: '如何向學校評審推銷自己，哪間姊妹校補助多、學分好抵免，附我的申請文件範本。',
      category: '交換學生', gradient: 'g4', year: '115 學年',
      author: '日文系 大四 林同學', verified: true, badge: '*JLPT N1*', time: '1 週前', price: 'NT$ 149',
      views: '932', likes: '64', comments: '22'
    },
    {
      id: 6, title: '某通識「如何拿到 A+」報告範本 ＋ 分組避雷名單與隱藏加分',
      excerpt: '想刷高 GPA 推甄、申獎學金必看。期末報告架構、潛規則與哪些組員千萬別碰。',
      category: '學分攻略', gradient: 'g5', tag: '免費', year: '115 學年',
      author: '創產系 大三 范同學', verified: true, time: '2 週前', price: '免費閱讀',
      views: '1,456', likes: '112', comments: '38'
    },
    {
      id: 7, title: 'ATCC / 梅竹黑客松 得獎企劃書範本 ＋ 跨領域組隊分工框架',
      excerpt: '商管＋技術怎麼組隊、評審看什麼、企劃書架構與簡報節奏，附我們的得獎作品拆解。',
      category: '專題研究', gradient: 'g6', year: '長期適用',
      author: '資管系 大四 陳同學', verified: true, badge: '*ATCC 全國前八強*', time: '3 週前', price: 'NT$ 119',
      views: '742', likes: '58', comments: '16'
    },
    {
      id: 8, title: 'CPE 程式能力檢定：兩題／三題通關常用程式碼樣板整理',
      excerpt: '考前一週救急用，把最常考的題型與可直接套用的 C++ 樣板都整理進來了。',
      category: '證照檢定', gradient: 'g3', year: '長期適用',
      author: '資工系 大三 吳同學', verified: true, badge: '*CPE 5 題*', time: '3 週前', price: 'NT$ 79',
      views: '624', likes: '47', comments: '11'
    },
    {
      id: 9, title: '轉系面試＋轉學考：經濟學與微積分準備時程表與錯題本',
      excerpt: '大一不滿意想翻身必看。獨家準備時程、專業科目錯題本與面試常被問的問題。',
      category: '轉學 / 轉系', gradient: 'g1', stale: true, year: '114 學年 · 已降價',
      author: '財金系 大二 張同學', verified: true, time: '1 個月前', price: 'NT$ 69',
      views: '538', likes: '33', comments: '14'
    },
    {
      id: 10, title: '中興周邊高 CP 值美食 30 家 ＋ 聚餐口袋名單與隱藏學生優惠',
      excerpt: '從平日獨食到系上聚餐分級整理，附各店招牌、預算帶與出示學生證的獨家折扣清單。',
      category: '美食地圖', gradient: 'g6', year: '長期適用',
      author: '食科系 大三 周同學', verified: true, badge: '*在地老饕*', time: '4 天前', price: '免費閱讀',
      views: '2,038', likes: '174', comments: '52'
    }
  ];

  function renderArticles() {
    const container = document.getElementById('articleList');
    if (!container) return;

    container.innerHTML = ARTICLES.map((art, idx) => {
      if (art.nocover) {
        return `
          <article class="article nocover">
            <div class="body">
              <span class="cat-pill-inline">${art.category}</span>
              <span class="valid-tag ${art.stale ? 'stale' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/></svg>
                ${art.year}
              </span>
              <h2>${art.title}</h2>
              <p class="excerpt">${art.excerpt}</p>
              <div class="author-row">
                <div class="av-sm"></div>
                <div class="author-meta">
                  <div class="name">${art.author} ${art.verified ? '<span class="verified">✓</span>' : ''}</div>
                  <div class="sub">${art.badge ? '*' + art.badge + '*' : ''} ${art.badge ? '·' : ''} ${art.time}</div>
                </div>
                <div class="price">${art.price}</div>
              </div>
              <div class="read-stats">
                <span><img src="../svg/read.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:4px;" alt="閱讀"> ${art.views}</span>
                <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;display:inline-block;color:#c97f5a;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> ${art.likes}</span>
                <span><img src="../svg/comment_school.svg" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;" alt="評論"> ${art.comments}</span>
              </div>
            </div>
          </article>
        `;
      }

      return `
        <article class="article">
          <div class="cover ${art.gradient || 'g1'}">
            <span class="cat-pill-cover">${art.category}</span>
            ${art.tag ? `<span class="${art.tag === '免費' ? 'free-tag' : 'biz-tag'}">${art.tag}</span>` : ''}
          </div>
          <div class="body">
            <span class="valid-tag ${art.stale ? 'stale' : ''}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15 14"/></svg>
              ${art.year}
            </span>
            <h2>${art.title}</h2>
            <p class="excerpt">${art.excerpt}</p>
            <div class="author-row">
              <div class="av-sm"></div>
              <div class="author-meta">
                <div class="name">${art.author} ${art.verified ? '<span class="verified">✓</span>' : ''}</div>
                <div class="sub">${art.badge ? '*' + art.badge + '*' : ''} ${art.badge ? '·' : ''} ${art.time}</div>
              </div>
              <div class="price ${art.price === '免費閱讀' ? 'free' : ''}">${art.price}</div>
            </div>
            <div class="read-stats">
              <span><img src="../svg/read.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:4px;" alt="閱讀"> ${art.views}</span>
              <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;display:inline-block;color:#c97f5a;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> ${art.likes}</span>
              <span><img src="../svg/comment_school.svg" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;" alt="評論"> ${art.comments}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // 在渲染完成後附加儲存按鈕
    attachSaveButtons();
  }

  document.addEventListener('DOMContentLoaded', renderArticles);
})();

// ── Glass card scroll animation ──
(function () {
  const glassCards = document.querySelectorAll('.glass-card');
  if (glassCards.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  glassCards.forEach(card => observer.observe(card));
})();

// ── Navbar login with avatar dropdown ──
(function () {
  const loginBtn = document.getElementById('loginBtn');
  const userChip = document.getElementById('userChip');

  if (!loginBtn || !userChip) return;

  const AUTH_KEY = 'th_cg_auth';
  const AVATAR_KEY = 'th_cg_avatar';
  const USERNAME_KEY = 'th_cg_username';

  // 創建下拉選單
  const dropdown = document.createElement('div');
  dropdown.className = 'user-dropdown';
  dropdown.innerHTML = `
    <a href="#" class="user-dropdown-item">我的資訊</a>
    <a href="#" class="user-dropdown-item" id="logoutLink">登出</a>
  `;
  dropdown.style.cssText = `
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border: 1px solid #d6e2ec;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    min-width: 140px;
    display: none;
    z-index: 100;
    margin-top: 8px;
  `;

  userChip.style.position = 'relative';
  userChip.appendChild(dropdown);

  // 設定樣式
  const style = document.createElement('style');
  style.textContent = `
    .user-dropdown-item {
      display: block;
      padding: 10px 16px;
      color: #0f2745;
      text-decoration: none;
      font-size: 13px;
      transition: background 0.2s;
    }
    .user-dropdown-item:hover {
      background: #f0f5f9;
    }
    .user-dropdown-item:first-child {
      border-bottom: 1px solid #d6e2ec;
    }
  `;
  document.head.appendChild(style);

  function applyAuth(loggedIn) {
    loginBtn.style.display = loggedIn ? 'none' : '';
    userChip.style.display = loggedIn ? 'block' : 'none';
    dropdown.style.display = 'none';
  }

  const isAuthed = localStorage.getItem(AUTH_KEY) === '1';
  const avatar = localStorage.getItem(AVATAR_KEY) || '👤';
  const username = localStorage.getItem(USERNAME_KEY) || '王同學';

  applyAuth(isAuthed);

  if (isAuthed) {
    const avatarSpan = userChip.querySelector('.avatar');
    if (avatarSpan) avatarSpan.textContent = avatar;
  }

  loginBtn.addEventListener('click', function () {
    // 模擬登入，設置頭像和用戶名
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(AVATAR_KEY, '👤');
    localStorage.setItem(USERNAME_KEY, '王同學');
    applyAuth(true);
    location.reload();
  });

  userChip.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('logoutLink').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.setItem(AUTH_KEY, '0');
    localStorage.removeItem(AVATAR_KEY);
    localStorage.removeItem(USERNAME_KEY);
    applyAuth(false);
    dropdown.style.display = 'none';
    location.reload();
  });

  document.addEventListener('click', function (e) {
    if (!userChip.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
})();

// ── Wishpool with real data (commented out) ──
// (function () {
//   function initWishpool() {
//     const container = document.querySelector('.wp-stage-school');
//     if (!container) return;
//
//     let wishes = [];
//     if (window.backendService && typeof window.backendService.getWishlist === 'function') {
//       window.backendService.getWishlist().then(response => {
//         wishes = (response.data || []).slice(0, 20);
//         renderWishpool(wishes);
//       }).catch(e => {
//         console.warn('Failed to load wishpool:', e);
//         renderWishpool([]);
//       });
//     } else {
//       renderWishpool([]);
//     }
//
//     function renderWishpool(wishes) {
//       const SLOGANS = [
//         { _isSlogan: true, id: 's1', _sloganText: '快來許願！', _sloganBg: '#004b97', _sloganColor: '#fff' },
//         { _isSlogan: true, id: 's2', _sloganText: '賣家等你', _sloganBg: '#f3e3b5', _sloganColor: '#004b97' },
//         { _isSlogan: true, id: 's3', _sloganText: '說出你的需求', _sloganBg: '#4a85c4', _sloganColor: '#fff' },
//         { _isSlogan: true, id: 's4', _sloganText: '找到好物', _sloganBg: '#abdad5', _sloganColor: '#004b97' },
//         { _isSlogan: true, id: 's5', _sloganText: '許個願吧', _sloganBg: '#7eb8d8', _sloganColor: '#fff' },
//       ].map(s => ({ ...s, _size: Math.floor(Math.random() * 25) + 65, _marginTop: Math.floor(Math.random() * 160) - 80 }));
//
//       const displayWishes = wishes.length <= 3
//         ? SLOGANS.flatMap((s, i) => [s, ...(wishes[i % wishes.length] ? [wishes[i % wishes.length]] : [])])
//         : wishes;
//
//       const track = container.querySelector('.track-school');
//       if (!track) return;
//
//       track.innerHTML = '';
//       [...displayWishes, ...displayWishes, ...displayWishes, ...displayWishes].forEach((wish) => {
//         const b = document.createElement('div');
//         b.className = 'bub-school';
//         b.style.setProperty('--y', wish._marginTop + 'px');
//         b.style.animationDelay = (Math.random() * -5).toFixed(2) + 's';
//         b.style.animationDuration = (4.4 + Math.random() * 1.6).toFixed(2) + 's';
//
//         if (wish._isSlogan) {
//           const disc = document.createElement('div');
//           disc.className = 'disc-school msg';
//           disc.style.setProperty('--d', wish._size + 'px');
//           disc.style.background = wish._sloganBg;
//           disc.style.color = wish._sloganColor;
//           disc.style.fontSize = (wish._size >= 92 ? 15 : 13) + 'px';
//           disc.textContent = wish._sloganText;
//           b.appendChild(disc);
//         } else {
//           const disc = document.createElement('div');
//           disc.className = 'disc-school icon';
//           disc.style.setProperty('--d', wish._size + 'px');
//           const img = document.createElement('img');
//           img.src = wish.photoURL || '../svg/bigwish.svg';
//           img.alt = wish.itemName || '許願';
//           img.style.width = wish._size + 'px';
//           img.style.height = wish._size + 'px';
//           img.onerror = function() { this.src = '../svg/bigwish.svg'; };
//           disc.appendChild(img);
//           b.appendChild(disc);
//
//           const cap = document.createElement('span');
//           cap.className = 'cap-school';
//           cap.textContent = wish.itemName || '新許願';
//           b.appendChild(cap);
//         }
//
//         b.addEventListener('click', () => {
//           if (!wish._isSlogan && wish.id) {
//             sessionStorage.setItem('focusWishId', String(wish.id));
//           }
//           location.href = '../wishpool/wishpool.html#wishpool';
//         });
//
//         track.appendChild(b);
//       });
//     }
//   }
//
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initWishpool);
//   } else {
//     initWishpool();
//   }
// })();

// ── Advertisement Carousel ──
(function () {
  const carousel = document.querySelector('.ad-carousel');
  if (!carousel) return;

  const items = carousel.querySelectorAll('.carousel-item');
  const indicators = carousel.querySelectorAll('.carousel-indicators .indicator');
  let currentSlide = 0;
  let autoplayTimer = null;

  function goToSlide(n) {
    if (n >= items.length) currentSlide = 0;
    if (n < 0) currentSlide = items.length - 1;

    items.forEach(item => item.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));

    items[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
  }

  function nextSlide() {
    currentSlide++;
    goToSlide(currentSlide);
  }

  function prevSlide() {
    currentSlide--;
    goToSlide(currentSlide);
  }

  function startAutoplay() {
    autoplayTimer = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  indicators.forEach(indicator => {
    indicator.addEventListener('click', function () {
      currentSlide = parseInt(this.dataset.slide);
      goToSlide(currentSlide);
      stopAutoplay();
      startAutoplay();
    });
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
})();
