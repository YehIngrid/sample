
  let data = [
    {
        from:"店鋪公告",
        n_name:"拾貨寶庫買賣流程公告",
        time:"2026-09-20",
        detail:"<p>為了讓大家能安心在<strong>拾貨寶庫</strong>交易，我們將訂單狀態分為五個階段，並且從<strong>買家</strong>與<strong>賣家</strong>的角度說明各自的操作與注意事項：<br><br>🔹 1. Pending（待確認）<br><strong>買家</strong>：您已經送出訂單，系統會先幫您暫存，等待賣家確認是否能出貨。<br><strong>賣家</strong>：您會收到新訂單通知，請盡快檢查庫存與商品狀況，並回覆是否能接單。<br><br>🔹 2. Preparing（準備中）<br><strong>買家</strong>：代表賣家已接受訂單，正在整理商品。此時您可耐心等候，不需額外操作。<br><strong>賣家</strong>：請開始準備商品，並在約定前確認商品完整、乾淨，符合買家需求。<br></br>🔹 3. 現實面交<br><strong>買家</strong>：和賣家約定的面交時間、地點已經確認，請準時到達並攜帶現金或雙方約定的付款方式。<br><strong>賣家</strong>：請準時到達面交地點，並準備好商品，確保交付順利完成。<br></br>🔹 4. Delivered（已交付）<br><strong>買家</strong>：您已經收到商品，請再次檢查商品是否與描述相符。<br><strong>賣家</strong>：商品已經交付給買家，可以在系統中更新狀態。<br></br>🔹 5. Completed（完成）<br><strong>買家</strong>：訂單正式結束，感謝您的支持！別忘了可以給賣家一個評價，幫助更多人安心交易。<br><strong>賣家</strong>：訂單已完成，您可放心結算此次交易。也歡迎您繼續在拾貨寶庫分享更多好物。<br></br>💡 <strong>提醒</strong>：整個過程中，若有任何問題或無法面交，請務必提前與對方溝通，避免誤會與爭議。拾貨寶庫致力於打造透明、安全又溫暖的交易環境，感謝每一位用心參與的買家與賣家！</p>"},
];
let filteredData = data;  // 預設為全部資料
    let itemsPerPage = 7;
    let currentPage = 1;

    // 計算總頁數
    function getTotalPages() {
      return Math.ceil(filteredData.length / itemsPerPage);
    }

    // 顯示新聞列表
    function renderNews(page) {
      currentPage = page;
      const totalPages = getTotalPages();
      const start = (page - 1) * itemsPerPage;
      const end = page * itemsPerPage;
      const currentItems = filteredData.slice(start, end);

      let html = "";
      currentItems.forEach((item, index) => {
        // 這裡的 index 是當前頁面的局部索引，若要取全域索引需調整計算
        // 但我們可以直接在 showNewsDetail() 裡用 (start + index)
        html += `
          <tr>
            <td class="announce" style="padding-left: 2vw;">${item.from}</td>
            <td>
              <a href="#" 
                 onclick="showNewsDetail(${start + index})"
                  class="name">
                ${item.n_name}
              </a>
            </td>
            <td class="time">${item.time}</td>
          </tr>
        `;
      });
      document.querySelector(".news tbody").innerHTML = html;
      renderPagination();
    }

    // 產生分頁導覽
    function renderPagination() {
      const totalPages = getTotalPages();
      let paginationHTML = "";

      // 上一頁按鈕
      if (currentPage > 1) {
        paginationHTML += `<button onclick="renderNews(${currentPage - 1})">上一頁</button>`;
      } else {
        paginationHTML += `<button disabled>上一頁</button>`;
      }

      // 頁碼連結
      for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
          paginationHTML += `<span class="active" style="margin:0 5px;">${i}</span>`;
        } else {
          paginationHTML += `<a href="#" style="margin:0 5px;" onclick="renderNews(${i})">${i}</a>`;
        }
      }

      // 下一頁按鈕
      if (currentPage < totalPages) {
        paginationHTML += `<button onclick="renderNews(${currentPage + 1})">下一頁</button>`;
      } else {
        paginationHTML += `<button disabled>下一頁</button>`;
      }

      document.getElementById("pagination").innerHTML = paginationHTML;
    }

    // 過濾新聞（依據分類），並從第一頁開始顯示
    function filterNews(category) {
      if (category === "全部公告") {
        filteredData = data;
      } else {
        filteredData = data.filter(item => item.from === category);
      }
      renderNews(1);
    }

    // 顯示新聞詳細內容
    function showNewsDetail(index) {
      // 1. 根據 index 從 filteredData 取得對應新聞
      const item = filteredData[index];

      // 2. 將新聞詳細內容塞到 detail 區域
      document.getElementById("detailTitle").textContent = item.n_name;
      document.getElementById("detailFrom").textContent = item.from;
      document.getElementById("detailTime").textContent = item.time;
      document.getElementById("detailContent").innerHTML = item.detail;

      // 3. 顯示 detail 區塊，隱藏列表
      document.getElementById("newsListPage").style.display = "none";
      document.getElementById("newsDetailPage").style.display = "block";
    }

    // 返回新聞列表
    function showNewsList() {
      // 隱藏 detail 區塊，顯示列表
      document.getElementById("newsDetailPage").style.display = "none";
      document.getElementById("newsListPage").style.display = "block";
    }

    // 假設你的標籤連結（tab-link）可能是這樣：
    // <a class="tab-link" href="#">全部公告</a>
    // <a class="tab-link" href="#">系統公告</a>
    // <a class="tab-link" href="#">店鋪公告</a>
    const tabs = document.querySelectorAll('.tab-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        filterNews(e.target.textContent.trim());
      });
    });

    // 預設載入「全部公告」
    filterNews("全部公告");

