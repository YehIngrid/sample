// 當整個頁面載入完成後，隱藏 loader 並顯示主要內容
window.onload = function() {
    // 當頁面載入完畢後隱藏載入動畫，顯示內容
    var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
  };
  document.addEventListener('DOMContentLoaded', function() {
    const mobileSearchIcon = document.getElementById('mobileSearchIcon');
    const searchForm = document.getElementById('searchForm');
    
    // 手機版：點擊黑色搜尋圖示時，隱藏該圖示並顯示搜尋表單（新行出現）
    mobileSearchIcon.addEventListener('click', function() {
      mobileSearchIcon.style.display = 'none';
      searchForm.style.display = 'flex';
      
      // 自動將游標焦點移至搜尋輸入框
      const input = searchForm.querySelector('input');
      if (input) {
        input.focus();
      }
    });
  });
let data = [
    {
        from:"店鋪公告",
        n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
        time:"2025-02-08"
    },
    {
        from:"系統公告",
        n_name:"網站登入頁面更新啦",
        time:"2025-02-07"
    },
    {
        from:"系統公告",
        n_name:"網站最新消息頁面更新啦",
        time:"2025-02-06"
    },
    {
        from:"店鋪公告",
        n_name:"許願池功能開啟啦，趕快去看看吧！",
        time:"2025-02-05"
    },
    {
        from:"店鋪公告",
        n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
        time:"2025-02-04"
    },
    {
        from:"系統公告",
        n_name:"網站登入頁面更新啦",
        time:"2025-02-03"
    },
    {
        from:"系統公告",
        n_name:"網站最新消息頁面更新啦",
        time:"2025-02-02"
    },
    {
        from:"店鋪公告",
        n_name:"許願池功能開啟啦，趕快去看看吧！",
        time:"2025-02-01"
    },
    {
        from:"店鋪公告",
        n_name:"最新消息每一則新聞都可以點擊歐，裡面有詳細資訊",
        time:"2025-01-31"
    },
    {
        from:"系統公告",
        n_name:"網站登入頁面更新啦",
        time:"2025-01-30"
    },
    {
        from:"系統公告",
        n_name:"網站最新消息頁面更新啦",
        time:"2025-01-29"
    },
    {
        from:"店鋪公告",
        n_name:"許願池功能開啟啦，趕快去看看吧！",
        time:"2025-01-28"
    },
    {
        from:"系統公告",
        n_name:"網站以後會固定在星期三晚上7:00-9:00進行更新",
        time:"2025-01-27"
    },
    {
        from:"系統公告",
        n_name:"網站會在2025-01-26進行更新",
        time:"2025-01-25"
    },
    {
        from:"店鋪公告",
        n_name:"店鋪即將開張！趕快來看看新上架的商品吧！",
        time:"2025-01-24"
    },
    
];
// 用來存放目前要顯示的資料，預設為全部資料
let filteredData = data;

// 每頁顯示筆數及當前頁碼（全域變數）
let itemsPerPage = 5;
let currentPage = 1;

// 根據 filteredData 長度計算總頁數
function getTotalPages() {
  return Math.ceil(filteredData.length / itemsPerPage);
}

// 根據當前頁碼，從 filteredData 中取出要顯示的資料
function renderNews(page) {
  currentPage = page;
  const totalPages = getTotalPages();
  const start = (page - 1) * itemsPerPage;
  const end = page * itemsPerPage;
  const currentItems = filteredData.slice(start, end);
  
  let html = "";
  currentItems.forEach(item => {
    html += `<tr>
               <td class="announce" style="padding-left: 2vw;">${item.from}</td>
               <td class="name"><a>${item.n_name}</a></td>
               <td class="time">${item.time}</td>
             </tr>`;
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
      paginationHTML += `<span class="active">${i}</span>`;
    } else {
      paginationHTML += `<a href="#" onclick="renderNews(${i})">${i}</a>`;
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

// 過濾新聞，並重置分頁為第一頁
function filterNews(category) {
  if (category === "全部公告") {
    filteredData = data;
  } else {
    filteredData = data.filter(item => item.from === category);
  }
  // 切換分類後從第一頁開始
  renderNews(1);
}

// 綁定標籤（頁籤）的點擊事件
const tabs = document.querySelectorAll('.nav-link');
tabs.forEach(tab => {
  tab.addEventListener('click', function(e) {
    e.preventDefault();
    // 移除所有標籤的 active
    tabs.forEach(t => t.classList.remove('active'));
    // 加上目前點擊的標籤 active
    e.target.classList.add('active');
    // 過濾新聞（用點擊標籤的文字作為分類依據）
    filterNews(e.target.textContent.trim());
  });
});

// 初始載入時，顯示「全部公告」
filterNews("全部公告");
// function init() {
//     const news = document.querySelector(".news tbody");
//     let str = "";
//     data.forEach(function(news){
//     let content = `<tr><td class="annouce" style="padding-left: 2vw;">${news.from}</td><td class="name"><a>${news.n_name}</a></td><td class="time">${news.time}</td></tr>`;
//     str += `${content}`;
//     })
//     news.innerHTML = str;
//     const e = {
//         target: {
//           tagName: "A",
//           textContent: "全部公告"
//         }
//       };
//       filter(e);
// }
// init();

// function filter(e) {
//     if (e.target.tagName !== "A") return;

//     const selectedCategory = e.target.textContent.trim();
//     console.log("Filtering by:", selectedCategory);

//     let str = "";
//     data.forEach(function (item) {
//         if (selectedCategory === "全部公告" || item.from == selectedCategory) {
//             str += `<tr>
//                 <td class="announce" style="padding-left: 2vw;">${item.from}</td>
//                 <td class="name">${item.n_name}</td>
//                 <td class="time">${item.time}</td>
//             </tr>`;
//         }
//     });

//     const news = document.querySelector(".news tbody");
//     if (news) {
//         news.innerHTML = str;
//     }
// }


// const filterall = document.querySelector("#all");
// const filtersystem = document.querySelector("#system");
// const filterstore = document.querySelector("#store");

//     filterall.addEventListener("click", function (e) {
//         filter(e);
//     });
//     filtersystem.addEventListener("click", function (e) {
//         filter(e);
//     });
//     filterstore.addEventListener("click", function (e) {
//         filter(e);
// });

// // 1. 綁定監聽事件給所有頁籤
// const tabs = document.querySelectorAll('.nav-link');
// tabs.forEach((tab) => {
//   tab.addEventListener('click', function (e) {
//     e.preventDefault(); // 依情況是否需要阻止預設行為
    
//     // 2. 先移除所有頁籤的 active
//     tabs.forEach((t) => t.classList.remove('active'));
    
//     // 3. 再給目前被點擊的頁籤加上 active
//     e.target.classList.add('active');
    
//     // 4. 執行過濾公告的程式碼（如果你用的是 filter(e)）
//     filter(e);
//   });
// });
// // 用來存放目前要顯示的資料，預設全部
// let filteredData = data;

// // 每頁顯示筆數
// let itemsPerPage = 5;
// // 當前頁碼（全局變數）
// let currentPage = 1;

// // 重新計算總頁數
// function getTotalPages() {
//   return Math.ceil(filteredData.length / itemsPerPage);
// }

// // 渲染新聞資料
// function renderNews(page) {
//   currentPage = page;
//   let totalPages = getTotalPages();
//   const start = (page - 1) * itemsPerPage;
//   const end = page * itemsPerPage;
//   const currentItems = filteredData.slice(start, end);

//   let html = "";
//   currentItems.forEach(item => {
//     html += `<tr>
//       <td>${item.from}</td>
//       <td class="name"><a>${item.n_name}</a></td>
//       <td class="time">${item.time}</td>
//     </tr>`;
//   });
//   document.querySelector(".news tbody").innerHTML = html;

//   renderPagination();
// }

// // 產生分頁導覽
// function renderPagination() {
//   let totalPages = getTotalPages();
//   let paginationHTML = "";

//   // 上一頁
//   if (currentPage > 1) {
//     paginationHTML += `<button onclick="renderNews(${currentPage - 1})">上一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>上一頁</button>`;
//   }

//   // 頁碼
//   for (let i = 1; i <= totalPages; i++) {
//     if (i === currentPage) {
//       paginationHTML += `<span class="active">${i}</span>`;
//     } else {
//       paginationHTML += `<a href="#" onclick="renderNews(${i})">${i}</a>`;
//     }
//   }

//   // 下一頁
//   if (currentPage < totalPages) {
//     paginationHTML += `<button onclick="renderNews(${currentPage + 1})">下一頁</button>`;
//   } else {
//     paginationHTML += `<button disabled>下一頁</button>`;
//   }

//   document.getElementById("pagination").innerHTML = paginationHTML;
// }

// // 過濾新聞，並重置分頁為第一頁
// function filterNews(category) {
//   if (category === "全部公告") {
//     filteredData = data;
//   } else {
//     filteredData = data.filter(item => item.from === category);
//   }
//   // 每次切換分類後，重置頁碼為 1
//   renderNews(1);
// }

// // 初始載入時顯示全部新聞
// renderNews(1);
// const filter = document.querySelector(".sort");
// filter.addEventListener("click",function(e){
//     if (e.target.value == "undefined"){
//         return;
//     }
//     if (e.target.value == "全部公告"){
//         console.log(e);
//         init();
//         return;
//     }
//     let str = "";
//     data.forEach(function(item,index){
//         let content = `<td>${news.from}</td><td>${news.n_name}</td><td>${news.time}</td>`;
//         if(news.from == e.target.value) {
//             str += content;
//         }
//     })
// const news = document.querySelector(".tr");
// news.innerHTML = str;
// })



// const stationName = document.querySelector(".stationName");
// const stationCharge = document.querySelector(".stationCharge");
// const btn = document.querySelector(".btn");
// btn.addEventListener("click", function(e){
//     let obj = {};
//     obj.Charge = stationCharge.value;
//     obj.name = stationName.value;
//     data.unshift(obj);
//     init();
//     stationCharge.value = "";
//     stationName.value = "";
// })