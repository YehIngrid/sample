import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5500;
const API_BASE = 'https://treasurehub.tw';

// ── 商品頁動態 OG tags（爬蟲用）──────────────────────────────
app.get(['/product/product.html', '/src/product/product.html'], async (req, res, next) => {
  const id = req.query.id;
  if (!id) return next();

  try {
    const apiRes = await fetch(`${API_BASE}/api/commodity/item/${id}`);
    const body = await apiRes.json();
    const product = body?.data;

    if (!product) return next();

    const name        = product.name        || '商品詳細資訊';
    const description = product.description || '拾貨寶庫是中興大學最方便的二手拍賣市集。';
    const image       = product.mainImage   || `${API_BASE}/webP/treasurehub.webp`;
    const url         = `${API_BASE}/product/product.html?id=${id}`;
    const title       = `${name} ｜ 拾貨寶庫`;

    const htmlPath = path.join(__dirname, 'dist', 'product', 'product.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // 替換 og tags
    html = html
      .replace(/<meta property="og:title"[^>]*>/,   `<meta property="og:title" content="${esc(title)}">`)
      .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}">`)
      .replace(/<meta property="og:image"[^>]*>/,   `<meta property="og:image" content="${esc(image)}">`)
      .replace(/<meta property="og:url"[^>]*>/,     `<meta property="og:url" content="${esc(url)}">`)
      .replace(/<meta name="description"[^>]*>/,    `<meta name="description" content="${esc(description)}">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    next();
  }
});

// ── 許願池頁動態 OG tags（爬蟲用）────────────────────────────
app.get(['/wishpool/wishpool.html', '/src/wishpool/wishpool.html'], async (req, res, next) => {
  const id = req.query.id;
  if (!id) return next();

  try {
    const apiRes = await fetch(`${API_BASE}/api/wishpool/${id}`);
    const body = await apiRes.json();
    const wish = body?.data ?? body;

    if (!wish?.itemName) return next();

    const name        = wish.itemName   || '許願池';
    const description = wish.description || '在拾貨寶庫許願池發布你想要的二手物品需求。';
    const image       = wish.photoURL   || `${API_BASE}/webP/treasurehub.webp`;
    const url         = `${API_BASE}/wishpool/wishpool.html?id=${id}`;
    const title       = `${name} ｜ 拾貨寶庫許願池`;

    const htmlPath = path.join(__dirname, 'dist', 'wishpool', 'wishpool.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    html = html
      .replace(/<meta property="og:title"[^>]*>/,       `<meta property="og:title" content="${esc(title)}">`)
      .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}">`)
      .replace(/<meta property="og:image"[^>]*>/,       `<meta property="og:image" content="${esc(image)}">`)
      .replace(/<meta property="og:url"[^>]*>/,         `<meta property="og:url" content="${esc(url)}">`)
      .replace(/<meta name="description"[^>]*>/,        `<meta name="description" content="${esc(description)}">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    next();
  }
});

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// serve Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// 根路徑導向購物首頁
app.get('/', (req, res) => {
  res.redirect('/src/shop/shop.html');
});

app.listen(PORT, () => {
  console.log(`\n🚀 TreasureHub server 已啟動`);
  console.log(`   http://localhost:${PORT}\n`);
});
