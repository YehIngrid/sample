import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5500;

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
