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
        // 在 renderWishInfo 內部
        if (res.data.photoURL) {
            imagesContainer.innerHTML = `
                <a href="${res.data.photoURL}" 
                id="pswp-link"
                data-pswp-width="1200" 
                data-pswp-height="800" 
                target="_blank"
                class="image-item">
                    <img src="${res.data.photoURL}" id="wish-img-element" alt="${res.data.itemName}">
                </a>`;
            
            // 呼叫更新尺寸並初始化的函式
            updateImageSizeAndInit(res.data.photoURL);
        }
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
/**
 * 自動偵測圖片比例並初始化 PhotoSwipe
 */
function updateImageSizeAndInit(url) {
    const img = new Image();
    img.src = url;
    img.onload = function() {
        const link = document.getElementById('pswp-link');
        if (link) {
            // 這裡拿到圖片真實的寬高
            link.setAttribute('data-pswp-width', this.naturalWidth);
            link.setAttribute('data-pswp-height', this.naturalHeight);
        }
        // 尺寸設定好後，再初始化
        initPhotoSwipe();
    };
}

function initPhotoSwipe() {
    import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
        .then((module) => {
            const PhotoSwipeLightbox = module.default;
            const lightbox = new PhotoSwipeLightbox({
                gallery: '#wish-photo',
                children: 'a',
                pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js')
            });
            
            // 如果這不是第一次執行，先毀掉舊的實例防止衝突
            if (window.currentLightbox) {
                window.currentLightbox.destroy();
            }
            
            window.currentLightbox = lightbox;
            lightbox.init();
        });
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
