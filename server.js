import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5500;

// 直接將整個專案根目錄作為靜態資源
app.use(express.static(path.join(__dirname, 'src')));

// 根路徑導向購物首頁
app.get('/', (req, res) => {
  res.redirect('/shop/shop.html');
});

app.listen(PORT, () => {
  console.log(`\n🚀 TreasureHub dev server 已啟動`);
  console.log(`   http://localhost:${PORT}\n`);
});
