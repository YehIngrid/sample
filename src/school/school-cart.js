/* ===== 校園攻略站購物車 ===== */
/* 與二手商場購物車（shoppingcart.html）完全分開，只收「付費文章」。
   目前僅為純前端 UI 示範（假資料＋本機狀態），尚未串接金流與後端 API。
   動態注入到每一頁的 .nav .right（桌機）與 body（手機浮動鈕＋面板），
   做法比照 school-new.js 的通知鈴鐺，三頁共用本檔即可。 */
(function () {
  var STORAGE_KEY = 'th_school_cart_v1';

  var SEED = [
    { id: 'c1', author: 'yuki', name: '學霸筆記 Yuki', title: '轉學考完整時間線＋歷屆試題整理', category: '轉學考', meta: '9,600 字 · 更新於 10/08', price: 89, featured: true },
    { id: 'c2', author: 'yuki', name: '學霸筆記 Yuki', title: '高分讀書計畫範本：三週衝刺版', category: '轉學考', meta: '3,200 字 · 更新於 09/22', price: 59 },
    { id: 'c3', author: 'chen', name: '企業實習攻略 Chen', title: '外商暑期實習面試題庫與回答架構', category: '實習求職', meta: '7,100 字 · 更新於 10/15', price: 149, featured: true },
    { id: 'c4', author: 'mei', name: '社團經營筆記 Mei', title: '從零到百人社團：招新文案與活動企劃範本', category: '社團經營', meta: '5,400 字 · 更新於 10/01', price: 99 },
    { id: 'c5', author: 'mei', name: '社團經營筆記 Mei', title: '系學會財務申報全流程（含表單範本）', category: '社團經營', meta: '2,900 字 · 更新於 09/18', price: 69 },
  ];
  var PAY = [
    { k: 'card', label: '信用卡' },
    { k: 'line', label: 'LINE Pay' },
    { k: 'atm', label: 'ATM 轉帳' },
  ];

  function fmt(n) { return 'NT$ ' + n.toLocaleString('en-US'); }
  function seedCopy() { return SEED.map(function (i) { return Object.assign({}, i, { selected: true }); }); }

  function loadItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedCopy();
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return seedCopy();
      return parsed;
    } catch (e) { return seedCopy(); }
  }
  function saveItems(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
  }

  function initSchoolCart() {
    if (document.getElementById('schoolCartTab')) return;

    var state = {
      items: loadItems(),
      coupon: '',
      couponInput: '',
      couponMsg: '',
      couponOk: false,
      pay: 'card',
      placed: false,
    };

    /* ---------- 固定在畫面右側邊緣的購物車標籤（桌機、手機共用） ---------- */
    var tab = document.createElement('button');
    tab.className = 'scart-tab';
    tab.id = 'schoolCartTab';
    tab.type = 'button';
    tab.setAttribute('aria-label', '購物車');
    tab.innerHTML =
      '<svg class="scart-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1 h4 l2.68 13.39 a2 2 0 0 0 2 1.61 h9.72 a2 2 0 0 0 2-1.61 L23 6 H6"/></svg>' +
      '<svg class="scart-tab-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6 l-6 6 6 6"/></svg>' +
      '<span class="scart-badge d-none" id="schoolCartBadge">0</span>';
    document.body.appendChild(tab);

    /* ---------- 背景遮罩 + 面板骨架 ---------- */
    document.body.insertAdjacentHTML('beforeend',
      '<div class="scart-backdrop" id="schoolCartBackdrop"></div>' +
      '<div class="scart-panel" id="schoolCartPanel" role="dialog" aria-modal="true" aria-label="購物車">' +
        '<div class="scart-head">' +
          '<button class="scart-close" id="schoolCartClose" type="button" aria-label="關閉購物車">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
          '</button>' +
          '<div class="scart-head-title">' +
            '<span class="scart-eyebrow">Guide Cart · 購物車</span>' +
            '<span class="scart-h1">我的攻略購物車</span>' +
            '<span class="scart-sub">不同作者的付費攻略可以一次結帳，付款後立即解鎖閱讀。</span>' +
          '</div>' +
          '<div class="scart-steps" id="schoolCartSteps"></div>' +
        '</div>' +
        '<div class="scart-body">' +
          '<main class="scart-left" id="schoolCartLeft"></main>' +
          '<aside class="scart-right"><div class="scart-receipt" id="schoolCartReceipt"></div></aside>' +
        '</div>' +
      '</div>');

    var panel = document.getElementById('schoolCartPanel');
    var backdrop = document.getElementById('schoolCartBackdrop');
    var leftEl = document.getElementById('schoolCartLeft');
    var receiptEl = document.getElementById('schoolCartReceipt');
    var stepsEl = document.getElementById('schoolCartSteps');
    var badgeEl = document.getElementById('schoolCartBadge');

    function openPanel() { panel.classList.add('open'); backdrop.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closePanel() { panel.classList.remove('open'); backdrop.classList.remove('open'); document.body.style.overflow = ''; }

    tab.addEventListener('click', openPanel);
    document.getElementById('schoolCartClose').addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

    function persist() { saveItems(state.items); }

    function setItems(mapFn) {
      state.items = mapFn(state.items);
      state.placed = false;
      persist();
      render();
    }

    function groupByAuthor(items) {
      var order = [];
      var map = {};
      items.forEach(function (it) {
        if (!map[it.author]) { map[it.author] = { handle: it.author, name: it.name, list: [] }; order.push(it.author); }
        map[it.author].list.push(it);
      });
      return order.map(function (a) { return map[a]; });
    }

    function render() {
      var items = state.items;
      var groups = groupByAuthor(items);
      var selItems = items.filter(function (i) { return i.selected; });
      var allSelected = items.length > 0 && selItems.length === items.length;
      var subtotal = selItems.reduce(function (a, i) { return a + i.price; }, 0);
      var discount = state.couponOk ? Math.round(subtotal * 0.1) : 0;
      var total = subtotal - discount;

      // 徽章：購物車內文章總數
      if (items.length > 0) { badgeEl.textContent = items.length; badgeEl.classList.remove('d-none'); }
      else { badgeEl.classList.add('d-none'); }

      // 步驟指示
      stepsEl.innerHTML =
        '<span class="scart-step on"><span class="scart-step-dot">1</span><span>確認文章</span></span>' +
        '<span class="scart-step-sep"></span>' +
        '<span class="scart-step' + (state.placed ? ' on' : '') + '"><span class="scart-step-dot">2</span><span>付款</span></span>' +
        '<span class="scart-step-sep"></span>' +
        '<span class="scart-step"><span class="scart-step-dot">3</span><span>解鎖閱讀</span></span>';

      // 左側：依作者分組
      if (items.length === 0) {
        leftEl.innerHTML =
          '<div class="scart-empty">' +
            '<span class="scart-eyebrow">EMPTY · 0 ITEMS</span>' +
            '<h3>購物車空空的</h3>' +
            '<p>去看看大家寫的攻略，挑幾篇付費內容加進來吧。</p>' +
            '<button class="scart-restore" type="button" data-action="restore">還原示範內容</button>' +
          '</div>';
      } else {
        var barHtml =
          '<div class="scart-left-bar">' +
            '<button class="scart-selectall" type="button" data-action="toggle-all">' +
              '<span class="scart-check' + (allSelected ? ' on' : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
              '全選' +
            '</button>' +
            '<span class="scart-count-txt">' + groups.length + ' 位作者 · ' + items.length + ' 篇攻略</span>' +
          '</div>';
        var groupsHtml = groups.map(function (g) {
          var selCount = g.list.filter(function (i) { return i.selected; }).length;
          var groupAllOn = selCount === g.list.length;
          var groupSubtotal = g.list.filter(function (i) { return i.selected; }).reduce(function (a, i) { return a + i.price; }, 0);
          var itemsHtml = g.list.map(function (it) {
            return (
              '<div class="scart-item">' +
                '<button class="scart-check-btn" type="button" data-action="toggle-item" data-id="' + it.id + '" style="background:none;border:0;padding:0;cursor:pointer;display:flex;">' +
                  '<span class="scart-check' + (it.selected ? ' on' : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
                '</button>' +
                '<div class="scart-thumb">' + it.category.charAt(0) + '</div>' +
                '<div class="scart-item-body">' +
                  '<div class="scart-tags">' +
                    '<span class="scart-tag">' + it.category + '</span>' +
                    (it.featured ? '<span class="scart-tag scart-tag-featured">精選</span>' : '') +
                  '</div>' +
                  '<span class="scart-item-title">' + it.title + '</span>' +
                  '<span class="scart-item-meta">' + it.meta + '</span>' +
                '</div>' +
                '<div class="scart-item-side">' +
                  '<span class="scart-item-price">' + fmt(it.price) + '</span>' +
                  '<button class="scart-remove" type="button" data-action="remove" data-id="' + it.id + '">移除</button>' +
                '</div>' +
              '</div>'
            );
          }).join('');
          return (
            '<div class="scart-group">' +
              '<div class="scart-group-head">' +
                '<button class="scart-check-btn" type="button" data-action="toggle-group" data-author="' + g.handle + '" style="background:none;border:0;padding:0;cursor:pointer;display:flex;">' +
                  '<span class="scart-check' + (groupAllOn ? ' on' : '') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
                '</button>' +
                '<div class="scart-group-av"></div>' +
                '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;">' +
                  '<span class="scart-group-name">' + g.name + '</span>' +
                  '<span class="scart-group-handle">@' + g.handle + ' · ' + g.list.length + ' 篇</span>' +
                '</div>' +
                '<a class="scart-group-link" href="#">作者頁 →</a>' +
              '</div>' +
              itemsHtml +
              '<div class="scart-group-foot"><span>此作者已選 ' + selCount + ' 篇</span><span>小計 <b>' + fmt(groupSubtotal) + '</b></span></div>' +
            '</div>'
          );
        }).join('');
        leftEl.innerHTML = barHtml + groupsHtml;
      }

      // 右側：收據
      var lines = groups.map(function (g) {
        var sel = g.list.filter(function (i) { return i.selected; });
        if (!sel.length) return null;
        return {
          name: g.name,
          totalText: fmt(sel.reduce(function (a, i) { return a + i.price; }, 0)),
          items: sel,
        };
      }).filter(Boolean);

      var linesHtml = lines.length
        ? lines.map(function (l) {
            var subHtml = l.items.map(function (it) {
              return '<div class="scart-line-sub"><span>' + it.title + '</span><span>' + fmt(it.price) + '</span></div>';
            }).join('');
            return (
              '<div>' +
                '<div class="scart-line-head"><span class="scart-line-name">' + l.name + '</span><span class="scart-line-fill"></span><span class="scart-line-total">' + l.totalText + '</span></div>' +
                subHtml +
              '</div>'
            );
          }).join('')
        : '<div class="scart-nolines">尚未勾選任何文章</div>';

      var payHtml = PAY.map(function (p) {
        return '<button class="scart-pay-opt' + (state.pay === p.k ? ' on' : '') + '" type="button" data-action="pick-pay" data-k="' + p.k + '">' + p.label + '</button>';
      }).join('');

      var orderNo = 'TH-20261019-' + String(4000 + subtotal).padStart(4, '0');
      var payLabel = PAY.filter(function (p) { return p.k === state.pay; })[0].label;

      receiptEl.innerHTML =
        '<div class="scart-receipt-head">' +
          '<span class="scart-eyebrow">ORDER · RECEIPT</span>' +
          '<h2 style="margin:0;font-size:19px;font-weight:800;letter-spacing:0.05em;color:var(--ink);">結帳明細</h2>' +
          '<span class="scart-receipt-no">NO. ' + orderNo + '</span>' +
        '</div>' +
        '<div class="scart-receipt-divider"></div>' +
        '<div class="scart-lines">' + linesHtml + '</div>' +
        '<div class="scart-receipt-divider"></div>' +
        '<div class="scart-coupon-row">' +
          '<div class="scart-coupon-field"><label>優惠碼</label><input id="schoolCartCoupon" placeholder="試試 GUIDE10" value="' + state.couponInput.replace(/"/g, '&quot;') + '"></div>' +
          '<button class="scart-coupon-apply" type="button" data-action="apply-coupon">套用</button>' +
        '</div>' +
        (state.couponMsg ? '<div class="scart-coupon-msg ' + (state.couponOk ? 'ok' : 'bad') + '">' + state.couponMsg + '</div>' : '') +
        '<div>' +
          '<div class="scart-pay-label">付款方式</div>' +
          '<div class="scart-pay-grid">' + payHtml + '</div>' +
        '</div>' +
        '<div class="scart-totals">' +
          '<div class="scart-totals-row"><span>文章小計（' + selItems.length + ' 篇）</span><span>' + fmt(subtotal) + '</span></div>' +
          '<div class="scart-totals-row discount"><span>優惠折抵</span><span>' + (discount ? '− ' + fmt(discount) : 'NT$ 0') + '</span></div>' +
          '<div class="scart-totals-row"><span>手續費</span><span>NT$ 0</span></div>' +
        '</div>' +
        '<div class="scart-grand"><span class="scart-grand-label">應付總額</span><span class="scart-grand-val">' + fmt(total) + '</span></div>' +
        (state.placed
          ? '<div style="display:flex;flex-direction:column;gap:9px;">' +
              '<button class="scart-place-btn" type="button" data-action="noop">前往付款（' + payLabel + '）</button>' +
              '<button class="scart-unplace" type="button" data-action="unplace">返回修改訂單</button>' +
            '</div>'
          : '<button class="scart-place-btn" type="button" data-action="place" ' + (lines.length ? '' : 'disabled') + '>一次結帳 ' + lines.length + ' 位作者 →</button>') +
        '<div class="scart-stub"><div class="scart-stub-bar"></div><span class="scart-stub-no">' + orderNo + '</span></div>' +
        '<p class="scart-footnote">付款完成後文章立即解鎖，可在「已購攻略」隨時閱讀。<br>款項將依篇數分潤給各作者。</p>' +
        (state.placed
          ? '<div class="scart-stamp"><div class="scart-stamp-in"><span>ORDER</span><span>待付款</span><span>' + new Date().toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) + '</span></div></div>'
          : '');

      var couponInputEl = document.getElementById('schoolCartCoupon');
      if (couponInputEl) {
        couponInputEl.addEventListener('input', function (e) { state.couponInput = e.target.value; });
        couponInputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') applyCoupon(); });
      }
    }

    function applyCoupon() {
      var c = state.couponInput.trim().toUpperCase();
      if (c === 'GUIDE10') { state.coupon = c; state.couponOk = true; state.couponMsg = '已套用 GUIDE10：全單 9 折'; }
      else { state.coupon = ''; state.couponOk = false; state.couponMsg = c ? '這組優惠碼無法使用' : ''; }
      render();
    }

    /* ---------- 事件代理：左側清單 + 右側收據 ---------- */
    document.addEventListener('click', function (e) {
      var actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      var action = actionEl.dataset.action;

      if (action === 'toggle-item') {
        var id = actionEl.dataset.id;
        setItems(function (items) { return items.map(function (i) { return i.id === id ? Object.assign({}, i, { selected: !i.selected }) : i; }); });
      } else if (action === 'toggle-group') {
        var author = actionEl.dataset.author;
        var group = state.items.filter(function (i) { return i.author === author; });
        var allOn = group.every(function (i) { return i.selected; });
        setItems(function (items) { return items.map(function (i) { return i.author === author ? Object.assign({}, i, { selected: !allOn }) : i; }); });
      } else if (action === 'toggle-all') {
        var allSel = state.items.length > 0 && state.items.every(function (i) { return i.selected; });
        setItems(function (items) { return items.map(function (i) { return Object.assign({}, i, { selected: !allSel }); }); });
      } else if (action === 'remove') {
        var rid = actionEl.dataset.id;
        setItems(function (items) { return items.filter(function (i) { return i.id !== rid; }); });
      } else if (action === 'restore') {
        setItems(function () { return seedCopy(); });
      } else if (action === 'apply-coupon') {
        applyCoupon();
      } else if (action === 'pick-pay') {
        state.pay = actionEl.dataset.k;
        render();
      } else if (action === 'place') {
        var hasSel = state.items.some(function (i) { return i.selected; });
        if (hasSel) { state.placed = true; render(); }
      } else if (action === 'unplace') {
        state.placed = false; render();
      }
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSchoolCart);
  else initSchoolCart();
})();
