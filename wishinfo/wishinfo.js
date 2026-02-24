let wpbackendService;
let backendService;
let wishId = new URLSearchParams(location.search).get('id');
document.addEventListener('DOMContentLoaded', () => {
    wpbackendService = new wpBackendService();
    backendService = new BackendService();
    console.log('id:', wishId);
    if (!wishId) {
        console.warn('缺少願望 id');
        return;
    }
    renderWishInfo(wishId);
});
const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})
async function renderWishInfo(id) {
    try {
        wpbackendService = new wpBackendService();
        const res = await wpbackendService.getWishInfo(id);
        console.log('wish info:', res);
        const titleEl = document.getElementById('product-name');
        const descEl = document.getElementById('product-description');
        const priceEl = document.getElementById('wish-price');
        const wisher = document.getElementById('wisher');
        const priorityEl = document.getElementById('wish-priority');
        const imagesContainer = document.getElementById('wish-photo');
        priorityMap = {
            1: '不急',
            2: '一般',
            3: '緊急'
        };
        // --- 修改圖片生成邏輯 ---
        if (res.data.photoURL) {
            // PhotoSwipe 需要 a 標籤包裹，並註明寬高 (這裡先預設 1200x800)
            imagesContainer.innerHTML = `
                <a href="${res.data.photoURL}" 
                   data-pswp-width="1200" 
                   data-pswp-height="800" 
                   target="_blank"
                   class="image-item">
                    <img src="${res.data.photoURL}" alt="${res.data.itemName}">
                </a>`;
            
            // 重要：圖片插入 DOM 後，初始化或重啟 PhotoSwipe
            initPhotoSwipe(); 
        } else {
            imagesContainer.innerHTML = `<div class="no-image-placeholder"> (無圖片 SVG 略...) </div>`;
        }
        imagesContainer.innerHTML = image;
        priorityEl.innerText = priorityMap[res.data.priority] || '未設定';
        titleEl.innerText = res.data.itemName || '無標題';
        descEl.innerText = res.data.description || '無描述';
        priceEl.innerText = res.data.maxPrice || '無價格上限';
        wisher.innerText = res.data.owner.name || '未知';
    } catch (error) {
        console.error('Error fetching wish info:', error);
        return;
    }
}
function initPhotoSwipe() {
    // 從 CDN 引入模組
    import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
        .then((module) => {
            const PhotoSwipeLightbox = module.default;
            const lightbox = new PhotoSwipeLightbox({
                gallery: '#wish-photo', // 對應 HTML 中的 ID
                children: 'a',          // 點擊 a 標籤觸發
                pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js')
            });
            lightbox.init();
        })
        .catch(err => console.error('PhotoSwipe 加載失敗:', err));
}
const contactbtn = document.getElementById('contact-wisher');
const mbcontactbtn = document.getElementById('contact-wisher-mobile');

async function handleContactWisher() {
  try {
    if (!wishId) {
      console.warn('缺少願望 id');
      return;
    }

    await wpbackendService.contactWisher(wishId);
    alert('已聯絡許願者，請等待回覆！');
  } catch (error) {
    console.error('Error contacting wisher:', error);
    alert('聯絡許願者失敗，請稍後再試。');
  }
}

// 只對「存在的」元素綁事件
[contactbtn, mbcontactbtn].forEach(btn => {
  if (btn) {
    btn.addEventListener('click', handleContactWisher);
  }
});
