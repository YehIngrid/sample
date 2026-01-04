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
// TODO wishpool 還沒改成適合wishpool.js的格式

  const wishForm   = document.getElementById('wishForm');

  // 基本檢查
  if (!wishForm) {
    console.error('[wish] 缺少必要元素：',  wishForm );
  } else {
    console.log('[wish] 元素載入完成，開始綁定事件');
  }

  const fileInput = document.getElementById('wish-image');
  const preview   = document.getElementById('imgPreview');
  const imgEl     = document.getElementById('imgPreviewImg');
  // --- 取得欄位 ---

const budgetMax = document.getElementById('budgetMax');
const expireDate = document.getElementById('expireDate');
const urgency   = document.getElementById('urgency');

// --- 小工具：設/清錯 ---
function setErr(el, msg) {
  el.classList.add('is-invalid');
  const fb = el.nextElementSibling;
  if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = msg || '此欄位有誤';
}
function clearErr(el) {
  el.classList.remove('is-invalid');
  const fb = el.nextElementSibling;
  if (fb && fb.classList.contains('invalid-feedback')) fb.textContent = '';
}

// --- 驗證：照片必上傳 ---
function validatePhoto() {
  clearErr(fileInput);
  const f = fileInput.files && fileInput.files[0];
  if (!f) { setErr(fileInput, '請上傳商品照片'); return false; }
  return true;
}

// --- 驗證：最低/最高預算 + 關係 ---
const toNum = v => (v === '' ? NaN : Number(v));

function validexpireDate() {
  clearErr(expireDate);
  const v = expireDate.value;
  if (!v) { setErr(expireDate, '請選擇願望過期日'); return false; }
  const selectedDate = new Date(v);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    setErr(expireDate, '過期日不可早於今天');
    return false;
  }
}
function validateBudgetMax() {
  clearErr(budgetMax);
  const v = toNum(budgetMax.value);
  if (Number.isNaN(v)) { setErr(budgetMax, '請填最高預算'); return false; }
  if (v <= 0)          { setErr(budgetMax, '最高預算需大於 0'); return false; }
  return true;
}


// --- 驗證：急迫度必選 ---
function validateUrgency() {
  clearErr(urgency);
  if (!urgency.value) { setErr(urgency, '請選擇急迫度'); return false; }
  return true;
}

// --- 即時驗證（使用者輸入就檢查） ---
fileInput.addEventListener('change', validatePhoto);
expireDate.addEventListener('input', () => { validexpireDate();});
budgetMax.addEventListener('input', () => { validateBudgetMax(); });
urgency.addEventListener('change', validateUrgency);


  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      preview.classList.remove('has-image');
      imgEl.removeAttribute('src');
      return;
    }
    const url = URL.createObjectURL(file);
    imgEl.onload = () => URL.revokeObjectURL(url); // 釋放暫存
    imgEl.src = url;
    preview.classList.add('has-image');
  });

  //（可選）支援拖曳上傳
  ['dragenter','dragover'].forEach(evt =>
    preview.addEventListener(evt, (e) => {
      e.preventDefault();
      e.dataTransfer && (e.dataTransfer.dropEffect = 'copy');
      preview.classList.add('dragover');
    })
  );
  ['dragleave','drop'].forEach(evt =>
    preview.addEventListener(evt, (e) => {
      e.preventDefault();
      preview.classList.remove('dragover');
    })
  );
  preview.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    // --- 新增：把拖進來的檔案同步到 <input type="file">，讓下方顯示檔名 ---
    const dt = new DataTransfer();       // 新增
    dt.items.add(file);                  // 新增
    fileInput.files = dt.files;          // 新增
    const url = URL.createObjectURL(file);
    imgEl.onload = () => URL.revokeObjectURL(url);
    imgEl.src = url;
    preview.classList.add('has-image');
  });


  
    const wishFormbig = document.getElementById("wishFormbtn");
    if (!wishFormbig) {
      console.error("[wish] 缺少必要元素：", wishFormbig);
    }
    wishFormbig.addEventListener("click", (e) => {
      console.log("送出表單，進行最終驗證");
      e.preventDefault(); // 先阻止送出
      let isValid = true;
      const okPhoto = validatePhoto();
      const okDate   = validexpireDate();
      const okMax   = validateBudgetMax();
      const okUrg   = validateUrgency();
      isValid = isValid && okPhoto && okDate && okMax && okUrg;
    
      // 驗證 商品名稱
      const wishName = document.getElementById("wishName");
      if (!wishName.value.trim()) {
        wishName.classList.add("is-invalid");
        wishName.classList.remove("is-valid");
        isValid = false;
      } else {
        wishName.classList.remove("is-invalid");
        wishName.classList.add("is-valid");
      }
  
      // 驗證 商品分類
      const wishCategory = document.getElementById("wishCategory");
      if (wishCategory.value === "notselyet" || !wishCategory.value) {
        wishCategory.classList.add("is-invalid");
        wishCategory.classList.remove("is-valid");
        isValid = false;
      } else {
        wishCategory.classList.remove("is-invalid");
        wishCategory.classList.add("is-valid");
      }
  
      // 驗證 內容說明
      const wishDesc = document.getElementById("wishDesc");
      if (!wishDesc.value.trim() || wishDesc.value.length < 10) {
        wishDesc.classList.add("is-invalid");
        wishDesc.classList.remove("is-valid");
        isValid = false;
      } else {
        wishDesc.classList.remove("is-invalid");
        wishDesc.classList.add("is-valid");
      }
  

      // ✅ 全部正確才送出
      if (isValid) {
        wishFormbig.submit();
      }
  });

