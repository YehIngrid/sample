

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
