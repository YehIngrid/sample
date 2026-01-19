let wpbackendService;
const backbtn = document.querySelector('#back-btn');
backbtn.addEventListener('click', function(e){
    window.history.back();
})
let wishId = new URLSearchParams(location.search).get('id');
document.addEventListener('DOMContentLoaded', () => {
    console.log('id:', wishId);
    if (!wishId) {
        console.warn('缺少願望 id');
        return;
    }
    renderWishInfo(wishId);
});
async function renderWishInfo(id) {
    try {
        wpbackendService = new wpBackendService();
        const res = await wpbackendService.getWishInfo(id);
        console.log('wish info:', res);
        const titleEl = document.getElementById('product-title');
        const descEl = document.getElementById('product-description');
        const priceEl = document.getElementById('wish-price');
        const priorityEl = document.getElementById('wish-priority');
        const imagesContainer = document.getElementById('wish-photo');
        priorityMap = {
            1: '不急',
            2: '一般',
            3: '緊急'
        };
        imagesContainer.innerHTML = `<img src="${res.photoURL}" alt="願望圖片" />`;
        priorityEl.innerText = priorityMap[res.priority] || '未設定';
        titleEl.innerText = res.itemName || '無標題';
        descEl.innerText = res.description || '無描述';
        priceEl.innerText = res.maxPrice || '無價格上限';
        // TODO: 表單必填資訊尚未處理

    } catch (error) {
        console.error('Error fetching wish info:', error);
        return;
    }
}
const contactbtn = document.getElementById('contact-wisher');
contactbtn.addEventListener('click', async () => {
    try {
        if (!wishId) {
            console.warn('缺少願望 id');
            return;
        }
        const res = await wpbackendService.contactWisher(wishId);
        alert('已聯絡許願者，請等待回覆！');
    } catch (error) {
        console.error('Error contacting wisher:', error);
        alert('聯絡許願者失敗，請稍後再試。');
    }
});
// 簡單的 lightbox 功能
function openLightbox(src) {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox').classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// 綁定點擊事件
document.querySelectorAll('.image-item img').forEach(img => {
    img.addEventListener('click', () => {
        openLightbox(img.src);
    });
});

// ESC 鍵關閉
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
});

// 點擊背景關閉
document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
});
