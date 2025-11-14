  // 建立 WebSocket 連線（記得換成你的後端網址）
  const socket = new WebSocket("ws://localhost:8080");

  // 連線建立成功
  socket.addEventListener("open", () => {
    console.log("✅ 已連線到 WebSocket 伺服器");
  });

  // 接收訊息
  socket.addEventListener("message", (event) => {
    const chatBox = document.getElementById("chat");
    const msg = document.createElement("div");
    msg.className = "message receiver";
    msg.textContent = event.data;
    chatBox.appendChild(msg);

    // 自動捲到底
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  // 點擊送出按鈕
  document.getElementById("sendbtn").addEventListener("click", () => {
    const input = document.getElementById("messageInput");
    if (input.value.trim() !== "") {
      // 發送訊息給伺服器
      socket.send(input.value);

      // 顯示在自己這端
      const chatBox = document.getElementById("chat");
      const msg = document.createElement("div");
      msg.className = "message sender";
      msg.textContent = input.value;
      chatBox.appendChild(msg);

      chatBox.scrollTop = chatBox.scrollHeight;
      input.value = "";
    }
  });

