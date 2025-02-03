// 取得元素
const modal = document.getElementById("loginModal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.querySelector(".close");
const loginForm = document.getElementById("loginForm");

// 點擊「登入」按鈕時顯示 Modal
openModal.addEventListener("click", function(e) {
    modal.style.display = "flex";
});

// 點擊「×」按鈕時關閉 Modal
closeModalBtn.addEventListener("click", function(e) {
    modal.style.display = "none";
});

// 點擊 Modal 以外的地方關閉視窗
window.addEventListener("click", function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// 監聽登入表單提交事件
loginForm.addEventListener("submit", function(event) {
    event.preventDefault(); // 防止表單提交刷新頁面

    // 獲取輸入值
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // 模擬登入（實際應該連接後端）
    if (username === "user" && password === "1234") {
        alert("登入成功！");
        modal.style.display = "none"; // 登入成功後關閉 Modal
    } else if(username===""||password===""){
        alert('帳號或密碼尚未輸入！');
    } else {
        alert("帳號或密碼錯誤！");
    }
        
    
});

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
        
    
    fetch("https://你的後端/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("登入成功！");
            modal.style.display = "none"; // 關閉 Modal
        } else {
            alert("登入失敗：" + data.message);
        }
    })
    .catch(error => console.error("錯誤:", error));
});