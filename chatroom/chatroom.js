// class ChatRoomList {
//     constructor(initialRoomId = null) {
//         this.backend = new ChatBackendService();
//         this.currentRoomId = initialRoomId;
//         this.currentRoomName = '';
//         this.eventSource = null;
//         this.username = localStorage.getItem('username') || ''; // 從 localStorage 取得 username
//         this.auth = new BackendService();
//         this.isMobile = window.innerWidth < 768;
//         this.lightbox = null; // PhotoSwipe instance
//         this.pendingImage = null;
//         this.hasMore = true; 
//         this.isLoading = false;
//         this.sendImagebtn = document.getElementById('send-image-btn');
//         this.previewArea = document.getElementById('image-upload');
//         this.input = document.getElementById('messageInput');
//         this.alreadyInit = false;
//         this.lastReadId = null;
//         this.isMarkingRead = false;
//         this.readObserver = new IntersectionObserver(entries => {
//             entries.forEach(entry => {
//                 if (!entry.isIntersecting) return;

//                 const msgId = Number(entry.target.dataset.messageId);
//                 const lastRead = this.lastReadId ?? 0;
//                 if (msgId <= lastRead) return;

//                 if (this.isMarkingRead) return;

//                 this.isMarkingRead = true;
//                 const readAt = new Date().toISOString();
//                 this.backend.markAsRead(this.currentRoomId, readAt);

//                 this.lastReadId = msgId;

//                 this.isMarkingRead = false;
//                 this.readObserver.unobserve(entry.target);
//             });
//         }, { threshold: 0.6 });
//     }

//     async init() {
//         if (this.alreadyInit) return;
//         this.alreadyInit = true;
//         // this.cacheDOM();
//         this.setupMobileView();

//         // this.showLoaders();
//         await this.loadRooms();
//         // this.hideLoaders();
//         if (this.currentRoomId) {
//             const roomEl = document.querySelector(`[data-room-id="${this.currentRoomId}"]`);
//             if (roomEl) {
//                 // 從 HTML 結構中抓取商品名稱，避免傳入 undefined
//                 const name = roomEl.querySelector('.roomName')?.textContent || '未知';
//                 await this.switchRoom(this.currentRoomId, name);
//             }
//         }
//         window.addEventListener('resize', () => {
//             this.handleResize();
//         });
//         this.bindEvents();
//         this.putImage();
//         this.closePreview();
        
//     }
//     // cacheDOM() {
//     //     this.chatList = document.getElementById('chatList');
//     //     this.chatListLoader = document.getElementById('chatListLoader');
    
//     //     this.chatMainLoader = document.getElementById('chatMainLoader');
//     //     this.messagesContainer = document.getElementById('messagesContainer');
//     // }
//     // showLoaders() {
//     //     this.chatListLoader?.classList.remove('d-none');
//     //     this.chatMainLoader?.classList.remove('d-none');
//     // }
    
//     // hideLoaders() {
//     //     this.chatListLoader?.classList.add('d-none');
//     //     this.chatMainLoader?.classList.add('d-none');
//     // }
    
//     initPhotoSwipe() {
//         // 動態載入 PhotoSwipe CSS 和 JS
//         const cssLink = document.createElement('link');
//         cssLink.rel = 'stylesheet';
//         cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.min.css';
//         document.head.appendChild(cssLink);
//         const script = document.createElement('script');
//         script.src = 'https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js';
//         script.type = 'module';
//         script.onload = () => {
//             console.log('PhotoSwipe 已載入');
//         };
//         document.head.appendChild(script);
//     }
//     initPhotoSwipeGallery() {
//         // 等待 PhotoSwipe 模組載入
//         import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
//             .then(module => {
//                 const PhotoSwipeLightbox = module.default;
                
//                 // 如果已存在實例，先銷毀
//                 if (this.lightbox) {
//                     this.lightbox.destroy();
//                 }

//                 // 創建新的 lightbox 實例
//                 this.lightbox = new PhotoSwipeLightbox({
//                     gallery: '#messagesContainer',
//                     children: 'a.image-link',
//                     pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js'),
//                     // 防止失真的關鍵設定
//                     padding: { top: 50, bottom: 50, left: 100, right: 100 },
//                     bgOpacity: 0.9,
//                     // 確保使用原始圖片尺寸
//                     preload: [1, 2],
//                     // 禁用圖片縮放時的模糊效果
//                     maxWidthToAnimate: 4000,
//                     // 保持圖片品質
//                     imageClickAction: 'zoom',
//                     tapAction: 'close',
//                     doubleTapAction: 'zoom'
//                 });

//                 // 在打開前動態獲取圖片尺寸
//                 this.lightbox.on('contentLoad', (e) => {
//                     const { content } = e;
                    
//                     // 如果還沒有正確的尺寸，從圖片元素獲取
//                     if (content.data.w === 'auto' || content.data.h === 'auto') {
//                         const img = new Image();
//                         img.onload = () => {
//                             content.data.w = img.naturalWidth;
//                             content.data.h = img.naturalHeight;
//                             content.onLoaded();
//                         };
//                         img.src = content.data.src;
                        
//                         // 防止內容載入
//                         e.preventDefault();
//                     }
//                 });

//                 this.lightbox.init();
//             })
//             .catch(error => {
//                 console.error('PhotoSwipe 載入失敗:', error);
//             });
//     }
//     putImage() {
//         this.sendImagebtn.addEventListener('click', () => {
//             console.log('點擊上傳圖片按鈕');
//             this.previewArea.click();
//         });

//         this.previewArea.addEventListener('change', (e) => {
//             const file = e.target.files[0];
//             if (!file) return;
//             if(file.size > 5 * 1024 * 1024) {
//                 alert('圖片大小超過 5MB 限制');
//                 return;
//             }
//             this.pendingImage = file;
//             this.previewImage(file);
//         });
//     }
//     closePreview() {
//         document.addEventListener('click', (e) => {
//             const closeBtn = e.target.closest('.btn-close');
//             if (!closeBtn) return;
//             else {
//                 console.log('關閉圖片預覽');
//             }
//             this.pendingImage = null;
//             document.querySelector('.preview')?.remove();
//         });
//     }
    
//     previewImage(file) {
//         const reader = new FileReader();
//         reader.onload = () => {
//             const container = document.getElementById('img-input-container');

//             const preview = document.createElement('div');
//             preview.className = 'preview';

//             preview.innerHTML = `
//                 <div class="position-relative d-inline-block">
//                     <button type="button" class="btn-close" aria-label="Close"></button>
//                     <img src="${reader.result}">
//                 </div>
//             `;

//             container.appendChild(preview);
//         };
//         reader.readAsDataURL(file);
//     }

//     sendImage(file) {
//         const reader = new FileReader();
//         reader.onload = async () => {
//             const base64Image = reader.result;
//             try {
//                 const response = await this.backend.sendAttach(this.currentRoomId, base64Image);
//                 console.log('圖片上傳成功:', response);
//                 // 上傳成功後，在聊天室中顯示圖片訊息
//             } catch (error) {
//                 console.error('發送圖片錯誤:', error);
//                 // 即使沒有伺服器,也在本地顯示圖片訊息(用於測試)
//                 // this.appendImageMessage({
//                 //     ...messageData,
//                 //     isSelf: true
//                 // });
//             }
//         };
//         reader.readAsDataURL(file);
//     }

//     // 修正後的圖片訊息添加函數
//     appendImageMessage(data, prepend = false) {
//         const container = document.getElementById('messagesContainer');
//         const imgWrapper = document.createElement('div');
        
//         // 修正：正確判斷是否為自己的訊息
//         const isSelf = data.isSelf === true || data.username === this.username;
//         imgWrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;
//         imgWrapper.dataset.timestamp = data.timestamp; // 用於載入更多訊息時的時間戳記
//         imgWrapper.dataset.messageId = data.id; // 用於已讀功能的訊息 ID
//         const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
//             hour: '2-digit',
//             minute: '2-digit', 
//             hour12: false
//         });

//         // 提取圖片 URL
//         let imageUrl = data.attachments || '';

//         imgWrapper.innerHTML = `
//             ${!isSelf ? `
//                 <div class="message-avatar">
//                     <i class="bi bi-person-circle"></i>
//                 </div>
//             ` : ''}
//             <div class="message-content">
//                 <div class="message-header ${isSelf ? 'text-end' : ''}">
//                     ${isSelf ? `` : `<strong>${data.username}</strong>`}
//                 </div>
//                 <div class="d-flex align-items-end">
//                     ${isSelf ? `<small class="text-muted me-2" style="font-size: 0.75rem;">${time}</small>` : ``}
//                     <div class="message-image-wrapper" style="margin-top: 8px;">
//                         <a href="${imageUrl}" 
//                         data-pswp-width="auto" 
//                         data-pswp-height="auto" 
//                         target="_blank"
//                         class="image-link">
//                             <img src="${imageUrl}" 
//                                 alt="Image" 
//                                 style="width: 200px; background: #f0f0f0; border-radius: 8px; cursor: pointer;"
//                                 loading="lazy">
//                         </a>
//                     </div>
//                     ${isSelf ? `` : `<small class="text-muted me-2" style="font-size: 0.75rem;">${time}</small>`}
//                 </div>
//             </div>
//         `;

//         if (prepend) {
//             container.prepend(imgWrapper);
//         } else {
//             container.appendChild(imgWrapper);
            
//             // --- 修改重點：強制在插入後滾動一次 ---
//             // 使用 requestAnimationFrame 確保瀏覽器已經渲染該 DOM 節點
//             requestAnimationFrame(() => {
//                 container.scrollTop = container.scrollHeight;
//             });
//         }

//         // 圖片載入完成後的處理
//         const tempImg = new Image();
//         tempImg.onload = () => {
//             // ... 原有的 PhotoSwipe 邏輯 ...
//             // 圖片載入完成後，更新 data 屬性
//             const link = imgWrapper.querySelector('.image-link');
//             if (link) {
//                 link.setAttribute('data-pswp-width', tempImg.naturalWidth);
//                 link.setAttribute('data-pswp-height', tempImg.naturalHeight);
//             }
//             // 重新初始化 PhotoSwipe 以包含新圖片
//             this.initPhotoSwipeGallery();
//             // --- 核心修正：圖片真正加載完成撐開高度後，再滾動一次 ---
//             if (!prepend) {
//                 container.scrollTop = container.scrollHeight;
//             }
//         };
//         tempImg.src = imageUrl;
//     }
//     setupMobileView() {
//         this.isMobile = window.innerWidth < 768;
//         console.log('初始視窗大小, 是否為手機版:', this.isMobile);
//         if (this.isMobile) {
//             this.showSidebar();
//             this.hideChatMain();
//         } else {
//             this.showSidebar();
//             this.showChatMain();
//         }
//     }

//     handleResize() {
//         const wasMobile = this.isMobile;
//         console.log('視窗大小改變, 是否為手機版:', wasMobile, '->', window.innerWidth < 768);
//         this.isMobile = window.innerWidth < 768;
//         if (wasMobile && !this.isMobile) {
//             this.showSidebar();
//             this.showChatMain();
//         } else if (!wasMobile && this.isMobile) {
//             this.showSidebar();
//             this.hideChatMain();
//         }  
//     }


//     showSidebar() {
//         const sidebar = document.getElementById('sidebar');
//         if (!sidebar) return;
//         sidebar.classList.remove('mobile-hidden');
//     }

//     hideSidebar() {
//         const sidebar = document.getElementById('sidebar');
//         if (!sidebar) return;
//         sidebar.classList.add('mobile-hidden');
//     }
//     showChatMain() {
//         const chatMain = document.getElementById('chatMain');
//         if (!chatMain) return;
//         chatMain.classList.remove('mobile-hidden');
//     }
//     hideChatMain() {
//         const chatMain = document.getElementById('chatMain');
//         if (!chatMain) return;
//         chatMain.classList.add('mobile-hidden');
//     }
//     switchToChat() {
//         if (this.isMobile) {
//             this.hideSidebar();
//             this.showChatMain();
//         }
//     }
//     backToSidebar() {
//         if (this.isMobile) {
//             this.showSidebar();
//             this.hideChatMain();
//         }
//     }

//     bindEvents() {
//         document.addEventListener('click', async (e) => {
//             const backBtn = e.target.closest('#backButton');
//             if (!backBtn) return;

//             console.log('返回側邊欄');
//             this.backToSidebar();
//             await this.loadRooms(); // 返回側邊欄時重新載入聊天室列表，確保最新狀態
//         });
//         // const backButton = document.getElementById('backButton');
//         // console.log('是否收到backButton: ', backButton);
//         // backButton.addEventListener('click', () => {
//         //     console.log('返回側邊欄');
//         //     this.backToSidebar();
//         // });
//         const form = document.getElementById('messageForm');
//         form.addEventListener('submit', (e) => {
//             e.preventDefault();
//             this.sendMessage();
//         });
//         let typingTimer;

//         this.input.addEventListener('input', () => {
//             clearTimeout(typingTimer);
//             typingTimer = setTimeout(() => {
//                 this.backend.typing(this.currentRoomId);
//             }, 400);
//         });
//         const container = document.getElementById('messagesContainer');
//         container.addEventListener('scroll', () => {
//             // 當捲軸拉到最頂端 (scrollTop === 0) 時觸發
//             if (container.scrollTop <= 10) {
//                 this.loadMoreMessages();
//             }
//         });
//     }
//     // 播放通知音
//     playNotificationSound() {
//         // 可以添加音效檔案
//         const audio = new Audio('../sound/mes.mp3');
//         audio.play().catch(e => console.log('無法播放音效'));
//     }
//     /* ======================
//        聊天室列表
//     ====================== */
//     getLastMessageText(lastMsg) {
//         if (!lastMsg) return '無訊息';
        
//         // 1. 優先判斷文字內容
//         if (lastMsg.message) {
//             return lastMsg.message;
//         }
        
//         // 2. 判斷是否有圖片/附件
//         if (lastMsg.attachments && lastMsg.attachments.length > 0) {
//             return '傳送了一張圖片';
//         }
        
//         // 3. 預設回傳
//         return '無訊息';
//     };
//     async loadRooms() {
//         const chatList = document.getElementById('chatList');
//         console.log('載入聊天室列表, chatList元素:', chatList);
//         if (!chatList) {
//             console.error('找不到聊天室列表容器');
//             return;
//         }
//         chatList.innerHTML = '';
//         // this.showLoaders();
//         try {
//             const rooms = await this.backend.listRooms();  
//             console.log(rooms);
//             if (!rooms.data.items || rooms.data.items.length === 0) {
//                 chatList.innerHTML = '<p class="text-center text-muted mt-3">無可用聊天室</p>';
//                 return;
//             }
//             let target = null;
//             let myself = null;
//             rooms.data.items.forEach(data => {
//                 const item = document.createElement('div');
//                 target = data.members.find(m => m.name !== this.username);
//                 myself = data.members.find(m => m.name === this.username);
//                 const isMyMessage = data.lastMessage.username == myself.name ? true : false;
//                 const isNewMessage = !isMyMessage && myself.lastReadMessageId !== data.lastMessageId;
//                 this.lastReadId = myself.lastReadMessageId ?? 0;
//                 console.log('聊天室目標對象:', target);
//                 console.log('聊天室自己:', myself);
//                 const targetUrl = target.photoURL || '../image/default-avatar.png';
//                 item.className = 'chat-item';
//                 item.dataset.roomId = data.id;
//                 item.innerHTML = `
//                     <div class="d-flex align-items-center">
//                         <div class="chat-avatar">
//                             <img src="${targetUrl}" alt="${target.name}的照片" style="width: 45px; height: 45px; border-radius: 50px;">
//                         </div>
//                         <div class="flex-grow-1">
//                             <h6 class="mb-0 roomName">${target.name}</h6>
//                             <small class="text-muted lastMessage">${this.getLastMessageText(data.lastMessage)}</small>
//                         </div>
//                         <span class="badge bg-primary rounded-pill ${isNewMessage ? '' : 'd-none'}">新訊息</span> 
//                     </div>
//                 `;
//                 console.log('myself.lastReadMessageId:', myself.lastReadMessageId);
//                 console.log('data.lastMessageId:', data.lastMessageId);
//                 // 未讀訊息徽章(上面的badge)
//                 chatList.appendChild(item);
//             });
//             document.getElementById("chatList").addEventListener("click", (e) => {
//                 const item = e.target.closest(".chat-item");
//                 if (!item) return;
//                 const roomId = item.dataset.roomId;
//                 const name = item.querySelector(".roomName").textContent;
//                 this.switchRoom(roomId, name);
//             });
//         } catch (err) {
//             console.error('聊天室列表載入失敗', err);
//         }
//         // } finally {
//         //     this.hideLoaders();
//         // }
//     }

//     /* ======================
//        切換聊天室
//     ====================== */

//     async switchRoom(roomId, targetName) {
//         if (this.readObserver) {
//             this.readObserver.disconnect();
//         }
//         // this.chatMainLoader.classList.remove('d-none');
//         if(this.isMobile) {
//             this.hideSidebar();
//             this.showChatMain();
//         }
//         console.log('切換聊天室', roomId);
//         this.currentRoomId = roomId;
//         this.currentRoomName = targetName;

//         document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
//         document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');
//         // 聊天室內名字
//         document.querySelector('.chat-header h6').textContent = targetName;

//         const container = document.getElementById('messagesContainer');
//         container.innerHTML = '';

//         // 載入歷史訊息
//         const before = new Date().toISOString();
//         if(!before) return;
//         console.log('載入歷史訊息', roomId, before);
//         const limit = 50;
//         const history = await this.backend.getHistory(roomId, limit, before);
//         if (history.data && history.data.length > 0) {

//             const container = document.getElementById("messagesContainer");

//             const lastReadId = this.lastReadId || 0; // 如果沒有已讀訊息，預設為 0
//             const messages = history.data.sort((a,b)=>a.id-b.id);
//             const firstUnread = messages.find(m => m.id > lastReadId);

//             messages.forEach(msg => {
//                 if (firstUnread && msg.id === firstUnread.id) {
//                     const divider = document.createElement("div");
//                     divider.className = "unread-divider";
//                     divider.innerText = "以下為未讀訊息";
//                     container.appendChild(divider);
//                 }
//                 this.renderMessage(msg);
//             });
//         } else {
//             console.log('沒有訊息');
//             document.getElementById('messagesContainer').innerHTML = '<p class="text-center text-muted mt-3">沒有訊息</p>';
//         }
//         // this.chatMainLoader.classList.add('d-none');
//         // SSE
//         await this.connectSSE(roomId);
//         this.scrollToFirstUnread(history.data, this.lastReadId);
//     }
//     scrollToFirstUnread(messages, lastReadId) {
//         if (!messages || !lastReadId) {
//             // 沒已讀紀錄 → 捲到底
//             const container = document.getElementById('messagesContainer');
//             container.scrollTop = container.scrollHeight;
//             return;
//         }

//         const firstUnread = messages.find(m => m.id > lastReadId);
//         if (!firstUnread) return;

//         const el = document.querySelector(`[data-message-id="${firstUnread.id}"]`);
//         if (el) {
//             el.scrollIntoView({ behavior: "instant", block: "start" });
//             console.log("Scrolled to first unread", firstUnread.id);
//         }
//     }
//     /* ======================
//        SSE 即時訊息
//     ====================== */

//     async connectSSE(roomId) {
//         if (this.eventSource && this.currentRoomId === roomId) {
//             console.log("SSE already connected");
//             return;
//         }

//         if (this.eventSource) {
//             this.eventSource.close();
//             this.eventSource = null;
//         }
//         this.currentRoomId = roomId;
//         this.eventSource = new EventSource(`${this.backend.baseUrl}/api/chat/stream?room=${roomId}`, {
//             withCredentials: true
//         });

//         this.eventSource.addEventListener('newMessage', (event) => {
//             const data = JSON.parse(event.data);
//             this.renderMessage(data);
//             this.playNotificationSound();
//         });
//         this.eventSource.addEventListener('typing', (event) => {
//             const data = JSON.parse(event.data);
        
//             // 確保有自己的 username
//             this.username = localStorage.getItem('username');
        
//             // 如果是自己送的 typing，忽略
//             if (data.username === this.username) return;
        
//             this.showTyping();
//         });
        
//         this.eventSource.addEventListener('read', (event) => {
//             const data = JSON.parse(event.data);
//             console.log('訊息已讀:', data);
//             // 可以在這裡更新 UI，例如移除未讀徽章
//             //this.removeUnreadBadge(data.roomId);
//             const item = document.querySelector(`[data-room-id="${data.roomId}"]`);
//             item?.querySelector('.badge')?.classList.add('d-none');
//         });

//         this.eventSource.addEventListener('ping', (event) => {
//             const data = JSON.parse(event.data);
//             console.log('ping:', data);
//         });

//         this.eventSource.addEventListener('ready', (event) => {
//             const data = JSON.parse(event.data);
//             console.log('連線狀態:', data);
//         });

//         this.eventSource.onerror = (error) => {
//             console.error('SSE 連接錯誤:', error);
//             this.eventSource.close();
//         };
//     }

//     /* ======================
//        傳送訊息
//     ====================== */

//     async sendMessage() {
//         if (this.pendingImage) {
//             await this.sendImage(this.pendingImage);
//             this.pendingImage = null;
//             document.querySelector('.preview')?.remove();
//             return;
//         }
//         const input = document.getElementById('messageInput');
//         const text = input.value.trim();
//         if (!text || !this.currentRoomId) return;

//         await this.backend.sendMessage(this.currentRoomId, text);
//         input.value = '';
//     }

//     /* ======================
//        UI 渲染
//     ====================== */
//     renderMessage(data, prepend = false) {
//         if (data.attachments && data.attachments.length > 0) {
//             this.appendImageMessage({
//                 attachments: data.attachments,
//                 username: data.username,
//                 timestamp: data.timestamp
//             }, prepend);
//             return;
//         }

//         const container = document.getElementById('messagesContainer');
//         console.log('data', data);
//         this.username = localStorage.getItem('username');
//         const isSelf = this.username == data.username;
//         console.log('isSelf', isSelf);
//         const timestamp = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
//             hour: '2-digit',
//             minute: '2-digit', 
//             hour12: false
//         });
//         const div = document.createElement('div');
//         div.className = `message ${isSelf ? 'message-self' : 'message-other'}`;
//         div.dataset.timestamp = data.timestamp; // 用於載入更多訊息時的時間戳記
//         div.dataset.messageId = data.id; // 用於已讀功能的訊息 ID
//         div.innerHTML = `
//             ${!isSelf ? `
//                 <div class="message-avatar">
//                     <i class="bi bi-person-circle"></i>
//                 </div>` : ''}
//             <div class="message-content">
//                 <div class="message-header ${isSelf ? 'text-end' : ''}">
//                     ${isSelf
//                         ? ``
//                         : `<strong>${data.username}</strong>`
//                     }
//                 </div>
//                 <div class="d-flex align-items-end">
//                     ${isSelf ? `<small class="text-muted me-2" style="font-size: 0.75rem;">${timestamp}</small>` : ``}
//                     <div class="message-text">
//                         ${this.escapeHtml(data.message)}
//                     </div>
//                     ${isSelf ? `` : `<small class="text-muted ms-2" style="font-size: 0.75rem;">${timestamp}</small>`}
//                 </div>
//             </div>
//         `;
//         // TODO data.username 是對方名子?
//         if (prepend) {
//             container.prepend(div); // 插入到最前面
//         } else {
//             container.appendChild(div); // 插入到最後面
//             container.scrollTop = container.scrollHeight; // 只有新訊息才自動滾到底部
//         }
//         this.detectRead(div);
//         return div;
//     }

//     showTyping() {
//         const indicator = document.getElementById('typingIndicator');
//         indicator.style.display = 'block';
//         indicator.innerHTML = `<small>對方正在輸入...</small>`;
//         clearTimeout(this.typingTimer);
//         this.typingTimer = setTimeout(() => {
//             indicator.style.display = 'none';
//         }, 1000);
//     }
//     detectRead(element) {
//         this.readObserver.observe(element);
//     }
//     // TODO 總訊息量超過五十則
//     async loadMoreMessages() {
//         const container = document.getElementById('messagesContainer');
//         if (!this.hasMore || this.isLoading) return;
//         // 1. 取得目前最頂端訊息的時間戳
//         const firstMsgElement = container.querySelector('.message, .imgmessage');
//         if (!firstMsgElement) return;
//         const before = firstMsgElement.dataset.timestamp;

//         // 2. 紀錄增加資料前的 總高度 與 捲軸位置
//         const oldScrollHeight = container.scrollHeight;

//         try {
//             this.isLoading = true;
//             const limit = 50;
//             const history = await this.backend.getHistory(this.currentRoomId, limit, before);
//             console.log('載入更多歷史訊息:', history);
//             console.log('timestamp:', before);
//             // 3. 歷史訊息通常是時間由新到舊，我們要「反向」插入回頂端
//             // 假設後端回傳 [49, 48, 47...0]，我們要確保順序正確
//             if (history.data && history.data.length > 0) {
//                 // 注意：這裡直接 loop 並使用 prepend
//                 const data = history.data;
//                 for (let i = data.length - 1; i >= 0; i--) {
//                     this.renderMessage(data[i], true); 
//                 }

//                 // 4. 最關鍵：修正捲軸位置
//                 // 新的高度 - 舊的高度 = 剛才載入的內容高度
//                 // 讓捲軸維持在原本看的那一則訊息上
//                 container.scrollTop = container.scrollHeight - oldScrollHeight;
//                 if (data.length < limit) {
//                     this.hasMore = false; 
//                     this.renderNoMoreHint(container);
//                 }
//             } else {
//                 console.log('沒有更多對話紀錄');
//                 // 可以選擇顯示一個提示，告訴使用者已經沒有更多訊息了
//                 // 例如在頂端顯示一個小訊息「沒有更多歷史訊息了」
//                 this.hasMore = false; 
//                 this.renderNoMoreHint(container);
//             }
//         } catch (err) {
//             console.error('載入更多訊息失敗', err);
//         } finally {
//             this.isLoading = false;
//         }
//     }
//     // 提取出來的顯示提示函數
//     renderNoMoreHint(container) {
//         if (container.querySelector('.nohistory')) return; // 避免重複添加
//         const noMoreMsg = document.createElement('div');
//         noMoreMsg.className = 'text-center text-muted nohistory';
//         noMoreMsg.textContent = '沒有更多對話紀錄了';
//         container.prepend(noMoreMsg);
//     }
//     /* ======================
//        綁定事件
//     ====================== */

//     // bindEvents() {
//     //     const messageForm = document.getElementById('messageForm');
//     //     if(!messageForm) return;
//     //     messageForm.addEventListener('submit', e => {
//     //         e.preventDefault();
//     //         this.sendMessage();
//     //     });

//     //     document.getElementById('messageInput').addEventListener('input', () => {
//     //         this.backend.typing(this.currentRoomId);
//     //     });

//     //     document.getElementById('backButton')?.addEventListener('click', () => {
//     //         document.getElementById('sidebar').classList.remove('mobile-hidden');
//     //         document.getElementById('chatMain').classList.add('mobile-hidden');
//     //     });
//     // }

//     escapeHtml(text) {
//         const div = document.createElement('div');
//         div.textContent = text;
//         return div.innerHTML;
//     }
// }
// let chatRoomList = null;
// window.addEventListener("load", () => {
//     console.log('chatroom Load');
//     openChatRoomList(null);
// });

// function openChatRoomList(roomId) {
//     if (!chatRoomList) {
//         chatRoomList = new ChatRoomList(roomId);
//         chatRoomList.init().then(() => {
//             if (roomId) chatRoomList.switchRoom(roomId);
//         });
//     } else if (roomId) {
//         chatRoomList.switchRoom(roomId);
//     }
// }
// async function openChatWithTarget(targetUserId) {
//     if (!targetUserId) {
//         return alert('無法開啟聊天室，缺少 User ID');
//     }
//     chatService = new ChatBackendService();
//     try {
//         const res =  await chatService.createRoom(targetUserId);
//         const roomId = res?.data?.room?.id;
//         console.log('聊天室 ID：', roomId);
//         console.log('聊天室服務回應：', res);
//         openChatRoomList(roomId);
//     } catch (error) {
//         console.error(error);
//     }
// }
class ChatRoomList {
    constructor(initialRoomId = null) {
        this.backend = new ChatBackendService();
        this.currentRoomId = initialRoomId;
        this.currentRoomName = '';
        this.eventSource = null;
        this.username = localStorage.getItem('username') || '';
        this.auth = new BackendService();
        this.isMobile = window.innerWidth < 768;
        this.lightbox = null;
        this.pendingImage = null;
        this.hasMore = true;
        this.isLoading = false;
        this.sendImagebtn = document.getElementById('send-image-btn');
        this.previewArea = document.getElementById('image-upload');
        this.input = document.getElementById('messageInput');
        this.alreadyInit = false;

        // 每個房間各自記錄 lastReadMessageId 和 lastReadTimestamp
        this.lastReadMap = new Map(); // roomId -> { id, timestamp }

        this.isMarkingRead = false;
        this.readObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const msgId = entry.target.dataset.messageId;
                const msgTimestamp = entry.target.dataset.timestamp;
                if (!msgId || !msgTimestamp) return;

                const roomRead = this.lastReadMap.get(String(this.currentRoomId));
                const lastReadId = roomRead?.id ?? '';

                // id 是 string，比較時用字串比較會有問題，改用 timestamp 比較
                if (msgTimestamp <= (roomRead?.timestamp ?? '')) return;
                if (this.isMarkingRead) return;

                this.isMarkingRead = true;

                // ✅ API: PATCH /api/chat/rooms/{roomId}/read
                // body: { readAt: "訊息的 timestamp" }  ← 傳訊息本身的時間，不是現在時間
                this.backend.markAsRead(this.currentRoomId, msgTimestamp)
                    .finally(() => { this.isMarkingRead = false; });

                this.lastReadMap.set(String(this.currentRoomId), {
                    id: msgId,
                    timestamp: msgTimestamp
                });
                this.readObserver.unobserve(entry.target);
            });
        }, { threshold: 0.6 });
    }

    async init() {
        if (this.alreadyInit) return;
        this.alreadyInit = true;
        this.setupMobileView();
        await this.loadRooms();
        if (this.currentRoomId) {
            const roomEl = document.querySelector(`[data-room-id="${this.currentRoomId}"]`);
            if (roomEl) {
                const name = roomEl.querySelector('.roomName')?.textContent || '未知';
                await this.switchRoom(this.currentRoomId, name);
            }
        }
        window.addEventListener('resize', () => this.handleResize());
        this.bindEvents();
        this.putImage();
        this.closePreview();
    }

    initPhotoSwipeGallery() {
        import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe-lightbox.esm.min.js')
            .then(module => {
                const PhotoSwipeLightbox = module.default;
                if (this.lightbox) this.lightbox.destroy();
                this.lightbox = new PhotoSwipeLightbox({
                    gallery: '#messagesContainer',
                    children: 'a.image-link',
                    pswpModule: () => import('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.esm.min.js'),
                    padding: { top: 50, bottom: 50, left: 100, right: 100 },
                    bgOpacity: 0.9,
                    preload: [1, 2],
                    maxWidthToAnimate: 4000,
                    imageClickAction: 'zoom',
                    tapAction: 'close',
                    doubleTapAction: 'zoom'
                });
                this.lightbox.on('contentLoad', (e) => {
                    const { content } = e;
                    if (content.data.w === 'auto' || content.data.h === 'auto') {
                        const img = new Image();
                        img.onload = () => {
                            content.data.w = img.naturalWidth;
                            content.data.h = img.naturalHeight;
                            content.onLoaded();
                        };
                        img.src = content.data.src;
                        e.preventDefault();
                    }
                });
                this.lightbox.init();
            })
            .catch(err => console.error('PhotoSwipe 載入失敗:', err));
    }

    putImage() {
        this.sendImagebtn.addEventListener('click', () => {
            this.previewArea.click();
        });
        this.previewArea.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert('圖片大小超過 5MB 限制');
                return;
            }
            this.pendingImage = file;
            this.previewImage(file);
        });
    }

    closePreview() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-close')) return;
            this.pendingImage = null;
            document.querySelector('.preview')?.remove();
        });
    }

    previewImage(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const container = document.getElementById('img-input-container');
            const preview = document.createElement('div');
            preview.className = 'preview';
            preview.innerHTML = `
                <div class="position-relative d-inline-block">
                    <button type="button" class="btn-close" aria-label="Close"></button>
                    <img src="${reader.result}">
                </div>`;
            container.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    async sendImage(file) {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                // ✅ API: POST /api/chat/attachment
                // body: { room: roomId, image: base64字串 }
                await this.backend.sendAttach(this.currentRoomId, reader.result);
            } catch (err) {
                console.error('發送圖片錯誤:', err);
            }
        };
        reader.readAsDataURL(file);
    }

    // ✅ attachments 是陣列 ["url1", ...]，取第一個元素顯示
    appendImageMessage(data, prepend = false) {
        const container = document.getElementById('messagesContainer');
        const imgWrapper = document.createElement('div');
        const isSelf = data.isSelf === true || data.username === this.username;
        imgWrapper.className = `imgmessage ${isSelf ? 'message-self' : 'message-other'}`;
        imgWrapper.dataset.timestamp = data.timestamp;
        imgWrapper.dataset.messageId = data.id ?? '';

        const time = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        // ✅ attachments 是陣列，取第一個
        const imageUrl = Array.isArray(data.attachments)
            ? data.attachments[0]
            : (data.attachments || '');

        imgWrapper.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><i class="bi bi-person-circle"></i></div>` : ''}
            <div class="message-content">
                <div class="message-header ${isSelf ? 'text-end' : ''}">
                    ${isSelf ? '' : `<strong>${data.username}</strong>`}
                </div>
                <div class="d-flex align-items-end">
                    ${isSelf ? `<small class="text-muted me-2" style="font-size: 0.75rem;">${time}</small>` : ''}
                    <div class="message-image-wrapper" style="margin-top: 8px;">
                        <a href="${imageUrl}" data-pswp-width="auto" data-pswp-height="auto"
                           target="_blank" class="image-link">
                            <img src="${imageUrl}" alt="Image"
                                 style="width: 200px; background: #f0f0f0; border-radius: 8px; cursor: pointer;"
                                 loading="lazy">
                        </a>
                    </div>
                    ${isSelf ? '' : `<small class="text-muted me-2" style="font-size: 0.75rem;">${time}</small>`}
                </div>
            </div>`;

        if (prepend) {
            container.prepend(imgWrapper);
        } else {
            container.appendChild(imgWrapper);
            requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
        }

        const tempImg = new Image();
        tempImg.onload = () => {
            const link = imgWrapper.querySelector('.image-link');
            if (link) {
                link.setAttribute('data-pswp-width', tempImg.naturalWidth);
                link.setAttribute('data-pswp-height', tempImg.naturalHeight);
            }
            this.initPhotoSwipeGallery();
            if (!prepend) container.scrollTop = container.scrollHeight;
        };
        tempImg.src = imageUrl;

        this.detectRead(imgWrapper);
    }

    setupMobileView() {
        this.isMobile = window.innerWidth < 768;
        if (this.isMobile) { this.showSidebar(); this.hideChatMain(); }
        else { this.showSidebar(); this.showChatMain(); }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 768;
        if (wasMobile && !this.isMobile) { this.showSidebar(); this.showChatMain(); }
        else if (!wasMobile && this.isMobile) { this.showSidebar(); this.hideChatMain(); }
    }

    showSidebar() { document.getElementById('sidebar')?.classList.remove('mobile-hidden'); }
    hideSidebar() { document.getElementById('sidebar')?.classList.add('mobile-hidden'); }
    showChatMain() { document.getElementById('chatMain')?.classList.remove('mobile-hidden'); }
    hideChatMain() { document.getElementById('chatMain')?.classList.add('mobile-hidden'); }
    backToSidebar() { if (this.isMobile) { this.showSidebar(); this.hideChatMain(); } }

    bindEvents() {
        document.addEventListener('click', async (e) => {
            if (!e.target.closest('#backButton')) return;
            this.backToSidebar();
            await this.loadRooms();
        });

        document.getElementById('messageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        let typingTimer;
        this.input.addEventListener('input', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                this.backend.typing(this.currentRoomId);
            }, 400);
        });

        const container = document.getElementById('messagesContainer');
        container.addEventListener('scroll', () => {
            if (container.scrollTop <= 10) this.loadMoreMessages();
        });
    }

    playNotificationSound() {
        const audio = new Audio('../sound/mes.mp3');
        audio.play().catch(() => {});
    }

    getLastMessageText(lastMsg) {
        if (!lastMsg) return '無訊息';
        if (lastMsg.message) return lastMsg.message;
        // ✅ attachments 是陣列
        if (Array.isArray(lastMsg.attachments) && lastMsg.attachments.length > 0) return '傳送了一張圖片';
        return '無訊息';
    }

    async loadRooms() {
        const chatList = document.getElementById('chatList');
        if (!chatList) return;
        chatList.innerHTML = '';

        try {
            // ✅ GET /api/chat/rooms 回應: { data: { items: [...] } }
            const rooms = await this.backend.listRooms();
            if (!rooms.data.items?.length) {
                chatList.innerHTML = '<p class="text-center text-muted mt-3">無可用聊天室</p>';
                return;
            }

            rooms.data.items.forEach(data => {
                const target = data.members.find(m => m.name !== this.username);
                const myself = data.members.find(m => m.name === this.username);
                const isMyMessage = data.lastMessage?.username === myself?.name;
                const isNewMessage = !isMyMessage && myself?.lastReadMessageId !== data.lastMessageId;

                // ✅ 用 Map 記錄每個房間的已讀資訊（id + timestamp）
                // ⚠️ members 的 lastReadMessageId 欄位名稱待截圖確認，先沿用
                if (myself) {
                    // ✅ members 欄位確認: lastReadMessageId (string), lastReadAt (ISO字串)
                    this.lastReadMap.set(String(data.id), {
                        id: myself.lastReadMessageId ?? null,
                        timestamp: myself.lastReadAt ?? null
                    });
                }

                const item = document.createElement('div');
                item.className = 'chat-item';
                item.dataset.roomId = data.id;
                item.innerHTML = `
                    <div class="d-flex align-items-center">
                        <div class="chat-avatar">
                            <img src="${target?.photoURL || '../image/default-avatar.png'}"
                                 alt="${target?.name}的照片"
                                 style="width: 45px; height: 45px; border-radius: 50px;">
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0 roomName">${target?.name ?? '未知'}</h6>
                            <small class="text-muted lastMessage">${this.getLastMessageText(data.lastMessage)}</small>
                        </div>
                        <span class="badge bg-primary rounded-pill ${isNewMessage ? '' : 'd-none'}">新訊息</span>
                    </div>`;
                chatList.appendChild(item);
            });

            // ✅ 用 cloneNode 斷開舊的 click listener，避免重複綁定
            const newChatList = chatList.cloneNode(true);
            chatList.parentNode.replaceChild(newChatList, chatList);
            newChatList.addEventListener('click', (e) => {
                const item = e.target.closest('.chat-item');
                if (!item) return;
                this.switchRoom(item.dataset.roomId, item.querySelector('.roomName').textContent);
            });

        } catch (err) {
            console.error('聊天室列表載入失敗', err);
        }
    }

    async switchRoom(roomId, targetName) {
        const prevRoomId = this.currentRoomId;

        if (this.readObserver) this.readObserver.disconnect();
        if (this.isMobile) { this.hideSidebar(); this.showChatMain(); }

        this.currentRoomId = roomId;
        this.currentRoomName = targetName;
        this.hasMore = true;

        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-room-id="${roomId}"]`)?.classList.add('active');
        document.querySelector('.chat-header h6').textContent = targetName;

        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        // ✅ GET /api/chat/history?room=&limit=&before=
        const before = new Date().toISOString();
        const history = await this.backend.getHistory(roomId, 50, before);

        if (history.data?.length > 0) {
            const roomRead = this.lastReadMap.get(String(roomId));
            const lastReadTimestamp = roomRead?.timestamp ?? null;

            // ✅ id 是 string，用 timestamp 排序
            const messages = history.data.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            const firstUnread = lastReadTimestamp
                ? messages.find(m => m.timestamp > lastReadTimestamp)
                : messages[0];

            messages.forEach(msg => {
                if (firstUnread && msg.id === firstUnread.id) {
                    const divider = document.createElement('div');
                    divider.className = 'unread-divider';
                    divider.innerText = '以下為未讀訊息';
                    container.appendChild(divider);
                }
                this.renderMessage(msg);
            });

            this.scrollToFirstUnread(firstUnread);
        } else {
            container.innerHTML = '<p class="text-center text-muted mt-3">沒有訊息</p>';
        }

        await this.connectSSE(roomId, prevRoomId);
    }

    scrollToFirstUnread(firstUnread) {
        const container = document.getElementById('messagesContainer');
        if (!firstUnread) {
            container.scrollTop = container.scrollHeight;
            return;
        }
        const el = document.querySelector(`[data-message-id="${firstUnread.id}"]`);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        else container.scrollTop = container.scrollHeight;
    }

    // ✅ prevRoomId 用來正確判斷 SSE 是否需要重連
    async connectSSE(roomId, prevRoomId) {
        if (this.eventSource && prevRoomId === roomId) return;
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.eventSource = new EventSource(
            `${this.backend.baseUrl}/api/chat/stream?room=${roomId}`,
            { withCredentials: true }
        );

        this.eventSource.addEventListener('newMessage', (event) => {
            const data = JSON.parse(event.data);
            this.renderMessage(data);
            this.playNotificationSound();
            // ✅ 通知外層頁面的 chaticon 顯示紅點
            if (data.username !== this.username) {
                window.parent?.dispatchEvent(new CustomEvent('chatUnread'));
            }
        });

        this.eventSource.addEventListener('typing', (event) => {
            const data = JSON.parse(event.data);
            this.username = localStorage.getItem('username');
            if (data.username === this.username) return;
            this.showTyping();
        });

        this.eventSource.addEventListener('read', (event) => {
            const data = JSON.parse(event.data);
            const isSelf = data.userId === this.username;

            if (isSelf) {
                // ✅ 自己已讀：移除聊天室列表的未讀 badge，通知外層清除紅點
                document.querySelector(`[data-room-id="${data.room}"]`)
                    ?.querySelector('.badge')?.classList.add('d-none');
                window.parent?.dispatchEvent(new CustomEvent('chatRead'));
            } else {
                // ✅ 對方已讀：更新訊息的「已讀」標記
                this.updateReadReceipts(data.lastReadMessageId);
            }
        });

        this.eventSource.addEventListener('ping', () => {});
        this.eventSource.addEventListener('ready', (event) => {
            console.log('SSE ready:', JSON.parse(event.data));
        });

        this.eventSource.onerror = () => {
            this.eventSource?.close();
        };
    }

    async sendMessage() {
        if (this.pendingImage) {
            await this.sendImage(this.pendingImage);
            this.pendingImage = null;
            document.querySelector('.preview')?.remove();
            return;
        }
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !this.currentRoomId) return;
        await this.backend.sendMessage(this.currentRoomId, text);
        input.value = '';
    }

    renderMessage(data, prepend = false) {
        // ✅ attachments 是陣列，有內容才視為圖片訊息
        if (Array.isArray(data.attachments) && data.attachments.length > 0) {
            this.appendImageMessage({
                id: data.id,
                attachments: data.attachments,  // 直接傳陣列
                username: data.username,
                timestamp: data.timestamp
            }, prepend);
            return;
        }

        const container = document.getElementById('messagesContainer');
        this.username = localStorage.getItem('username');
        const isSelf = this.username === data.username;
        const timestamp = new Date(data.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        const div = document.createElement('div');
        div.className = `message ${isSelf ? 'message-self' : 'message-other'}`;
        div.dataset.timestamp = data.timestamp;  // ISO 字串，用於 markAsRead
        div.dataset.messageId = data.id;          // string
        div.innerHTML = `
            ${!isSelf ? `<div class="message-avatar"><i class="bi bi-person-circle"></i></div>` : ''}
            <div class="message-content">
                <div class="message-header ${isSelf ? 'text-end' : ''}">
                    ${isSelf ? '' : `<strong>${data.username}</strong>`}
                </div>
                <div class="d-flex align-items-end">
                    ${isSelf ? `<small class="text-muted me-2" style="font-size: 0.75rem;">${timestamp}</small>` : ''}
                    <div class="message-text">${this.escapeHtml(data.message)}</div>
                    ${isSelf ? '' : `<small class="text-muted ms-2" style="font-size: 0.75rem;">${timestamp}</small>`}
                </div>
            </div>`;

        if (prepend) {
            container.prepend(div);
        } else {
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
        this.detectRead(div);
        return div;
    }

    // ✅ 對方讀到某則訊息後，把自己所有 <= lastReadMessageId 的訊息加上「已讀」標記
    updateReadReceipts(lastReadMessageId) {
        if (!lastReadMessageId) return;
        const container = document.getElementById('messagesContainer');
        const selfMsgs = container.querySelectorAll('.message-self, .imgmessage.message-self');

        let found = false;
        selfMsgs.forEach(el => {
            if (el.dataset.messageId === lastReadMessageId) found = true;

            // 已找到目標訊息（含）之前的所有自己訊息都標為已讀
            if (found) return; // 比目標新的訊息不動

            const existing = el.querySelector('.read-receipt');
            if (!existing) {
                const receipt = document.createElement('div');
                receipt.className = 'read-receipt';
                receipt.textContent = '已讀';
                el.querySelector('.message-content').appendChild(receipt);
            }
        });

        // 也處理目標訊息本身
        const targetEl = container.querySelector(`[data-message-id="${lastReadMessageId}"]`);
        if (targetEl?.classList.contains('message-self') || targetEl?.classList.contains('imgmessage')) {
            if (!targetEl.querySelector('.read-receipt')) {
                const receipt = document.createElement('div');
                receipt.className = 'read-receipt';
                receipt.textContent = '已讀';
                targetEl.querySelector('.message-content').appendChild(receipt);
            }
        }
    }

    showTyping() {
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'block';
        indicator.innerHTML = `<small>對方正在輸入...</small>`;
        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => { indicator.style.display = 'none'; }, 1000);
    }

    detectRead(element) {
        this.readObserver.observe(element);
    }

    async loadMoreMessages() {
        const container = document.getElementById('messagesContainer');
        if (!this.hasMore || this.isLoading) return;

        const firstMsgEl = container.querySelector('.message, .imgmessage');
        if (!firstMsgEl) return;
        const before = firstMsgEl.dataset.timestamp;
        const oldScrollHeight = container.scrollHeight;

        try {
            this.isLoading = true;
            const history = await this.backend.getHistory(this.currentRoomId, 50, before);

            if (history.data?.length > 0) {
                // 由新到舊排序後反向 prepend，確保畫面順序正確
                const sorted = history.data.sort((a, b) =>
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                for (const msg of sorted) {
                    this.renderMessage(msg, true);
                }
                container.scrollTop = container.scrollHeight - oldScrollHeight;
                if (history.data.length < 50) {
                    this.hasMore = false;
                    this.renderNoMoreHint(container);
                }
            } else {
                this.hasMore = false;
                this.renderNoMoreHint(container);
            }
        } catch (err) {
            console.error('載入更多訊息失敗', err);
        } finally {
            this.isLoading = false;
        }
    }

    renderNoMoreHint(container) {
        if (container.querySelector('.nohistory')) return;
        const el = document.createElement('div');
        el.className = 'text-center text-muted nohistory';
        el.textContent = '沒有更多對話紀錄了';
        container.prepend(el);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let chatRoomList = null;
window.addEventListener('load', () => {
    openChatRoomList(null);
});

function openChatRoomList(roomId) {
    if (!chatRoomList) {
        chatRoomList = new ChatRoomList(roomId);
        // ✅ init() 內部已經會呼叫 switchRoom(currentRoomId)，這裡不要再呼叫一次
        chatRoomList.init();
    } else if (roomId) {
        chatRoomList.switchRoom(roomId);
    }
}

async function openChatWithTarget(targetUserId) {
    if (!targetUserId) return alert('無法開啟聊天室，缺少 User ID');
    const chatService = new ChatBackendService();
    try {
        const res = await chatService.createRoom(targetUserId);
        const roomId = res?.data?.room?.id;
        openChatRoomList(roomId);
    } catch (err) {
        console.error(err);
    }
}