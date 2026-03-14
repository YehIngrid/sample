import BackendService from '../BackendService.js';
import wpBackendService from '../wpBackendService.js';
import '../../default/default.js';

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
            "LOW": '不急',
            "MEDIUM": '一般',
            "HIGH": '緊急'
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
        // 找不到願望（404）或其他錯誤，導向 404 頁面
        const status = error?.response?.status;
        if (status === 404 || !status) {
            window.location.replace('../NotFoundPage.html');
        }
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
  const btns = [contactbtn, mbcontactbtn].filter(Boolean);
  btns.forEach(b => { b.disabled = true; b.dataset.origText = b.textContent; b.textContent = '載入中...'; });
  try {
    if (!wishId) {
      console.warn('缺少願望 id');
      return;
    }

    // 取得自己的商品列表
    const res = await backendService.getMyItems();
    const commodities = res?.data?.commodities || [];

    if (commodities.length === 0) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      const goSellResult = await Swal.fire({
        icon: 'info',
        title: '您目前沒有上架的商品',
        text: '請先到個人頁面上架商品後再媒合。',
        showCancelButton: true,
        confirmButtonText: '去上架商品',
        cancelButtonText: '關閉'
      });
      if (goSellResult.isConfirmed) {
        window.location.href = `../../shop/shop.html`;
      }
      return;
    }

    // 建立商品卡片 HTML
    const cardsHtml = commodities.map(item => {
      const name  = item.name?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '未命名';
      const price = Number(item.price).toLocaleString();
      const img   = item.mainImage || '../image/default-avatar.png';
      return `
        <div class="wc-card" data-id="${item.id}" tabindex="0">
          <img src="${img}" alt="${name}" loading="lazy">
          <div class="wc-info">
            <div class="wc-name">${name}</div>
            <div class="wc-price">$${price}</div>
            <div class="wc-stock">庫存：${item.stock}</div>
          </div>
        </div>`;
    }).join('');

    const result = await Swal.fire({
      title: '請選擇要媒合的商品',
      width: 680,
      html: `
        <div class="wc-grid">${cardsHtml}</div>
        <div style="text-align:right; margin-top:10px;">
          <a href="../shop/shop.html?page=seller&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}"
             style="font-size:.8rem; color:#888; text-decoration:underline;">
            找不到想上架的商品？點此新增商品 
          </a>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '確認媒合',
      cancelButtonText: '取消',
      didOpen: () => {
        document.querySelectorAll('.wc-card').forEach(card => {
          const select = () => {
            document.querySelectorAll('.wc-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
          };
          card.addEventListener('click', select);
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
          });
        });
      },
      preConfirm: () => {
        const selected = document.querySelector('.wc-card.selected');
        if (!selected) {
          Swal.showValidationMessage('請選擇一個商品');
          return false;
        }
        return selected.dataset.id;
      }
    });

    if (result.isConfirmed) {
      const selectedCommodityId = result.value;
      console.log('選到商品ID:', selectedCommodityId);
      await wpbackendService.contactWisher(wishId, selectedCommodityId);
      Swal.fire({ icon: 'success', title: '已聯絡許願者！', text: '請等待對方回覆。' });
    }
  } catch (error) {
    console.error('Error contacting wisher:', error);
    Swal.fire({ icon: 'error', title: '聯絡失敗', text: '請稍後再試。' });
  } finally {
    btns.forEach(b => { b.disabled = false; b.textContent = b.dataset.origText || '媒合願望'; });
  }
}

// 只對「存在的」元素綁事件
[contactbtn, mbcontactbtn].forEach(btn => {
  if (btn) {
    btn.addEventListener('click', handleContactWisher);
  }
});
