// 拾貨寶庫 Footer（全站共用）：回到頂部、複製信箱、水獺吉祥物互動
(() => {
  const f = document.getElementById('thf');
  if (!f) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 回到頂部
  f.querySelector('.thf-top')?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  // 複製信箱
  const toast = f.querySelector('.thf-toast');
  let tt;
  const say = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove('show'), 1800);
  };
  f.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    try {
      await navigator.clipboard.writeText(e.currentTarget.dataset.copy);
      say('已複製信箱');
    } catch {
      say('help@treasurehub.tw');
    }
  });

  // 點水獺：跳一下、舉起寶物幣
  const otter = f.querySelector('.thf-otter');
  if (!otter) return;
  otter.addEventListener('click', () => {
    otter.classList.remove('jump');
    void otter.offsetWidth;
    otter.classList.add('jump', 'happy');
    setTimeout(() => otter.classList.remove('happy'), 900);
  });

  if (reduce) return;

  // 水獺眼睛跟著游標
  const eyes = [...otter.querySelectorAll('.eye')];
  addEventListener('pointermove', (e) => {
    const r = f.getBoundingClientRect();
    if (r.top > innerHeight || r.bottom < 0) return;
    eyes.forEach((eye) => {
      const b = eye.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(4, d / 30);
      eye.style.transform = `translate(${(dx / d) * k}px,${(dy / d) * k}px)`;
    });
  }, { passive: true });
})();
