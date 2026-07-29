# 平台首頁（newhome）

`src/newhome/newhome.html` / `newhome.css` / `newhome.js`

## 用途
`treasurehub.tw` 的最外層行銷首頁（品牌介紹、數據展示、導向購物/校園攻略站），**是全站唯一雙語（中/英）的頁面**，其餘頁面都只有中文。

## i18n
`data-i18n` attribute 標記需要翻譯的元素，`applyLang(lang)` 遍歷 `querySelectorAll('[data-i18n]')` 從 `translations` 物件取值設定 `textContent`；`toggleLang()` 切換語言。

## 主要函式
- `animateNumber(target, start, end, duration)` / `startAllAnimations()`：數據區塊的滾動數字動畫。
- `scrollCards(direction)` / `scrollToNext()`：卡片區橫向捲動控制。
- AOS（Animate On Scroll）初始化、捲動進度條。
