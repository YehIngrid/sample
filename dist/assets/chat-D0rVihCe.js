import{C as T}from"./ChatBackendService-BYkGcC7l.js";const a=document.getElementById("talkInterface"),v=document.getElementById("chaticon");function L(){return!!document.querySelector(".bottom-nav")}let r=null;function B(){return r||(a?(r=document.createElement("button"),r.id="chatMaxBtn",r.title="全螢幕",r.innerHTML="⛶",r.style.display="none",document.body.appendChild(r),r.addEventListener("click",t=>{t.stopPropagation(),x()}),r):null)}function x(t=!1){var o;if(!a)return;const e=t?!1:!a.classList.contains("maximized");a.classList.toggle("maximized",e),(o=a.contentWindow)==null||o.postMessage({type:e?"maximizeChat":"restoreFromParent"},window.location.origin),r&&(r.classList.toggle("maximized",e),r.innerHTML=e?"⊡":"⛶",r.title=e?"縮小視窗":"全螢幕")}function N(){const t=B();t&&(t.style.display="block")}function E(){r&&(r.style.display="none")}async function S(){if(L()){window.location.href="../chatroom/chatroom.html";return}if(a.style.display==="none"||a.style.display===""){if(!await k()){a.style.display="none";return}(!a.src||a.src==="about:blank"||a.src===window.location.href)&&(a.src="../chatroom/chatroom.html"),a.style.display="block",N()}else a.classList.remove("maximized"),a.style.display="none",E()}window.addEventListener("click",function(t){L()||a&&a.style.display==="block"&&!a.classList.contains("maximized")&&!a.contains(t.target)&&!(v!=null&&v.contains(t.target))&&!document.querySelector(".swal2-container")&&(a.style.display="none")});document.addEventListener("keydown",function(t){t.key!=="Escape"||!a||a.style.display==="none"||(a.classList.contains("maximized")?x(!0):(a.style.display="none",E()))});window.addEventListener("message",function(t){var e,o,m;((e=t.data)==null?void 0:e.type)==="closeChat"?(a&&(a.classList.remove("maximized"),a.style.display="none"),E(),document.body.classList.remove("chat-open-mobile")):((o=t.data)==null?void 0:o.type)==="maximizeChat"?x(!1):((m=t.data)==null?void 0:m.type)==="restoreChat"&&x(!0)});async function k(){return!0}const A=5,_=5e3,y=new Map,h=new Map;(function(){if(document.getElementById("chat-toast-style"))return;const e=document.createElement("style");e.id="chat-toast-style",e.textContent=`
    #chat-toast-container {
      position: fixed;
      bottom: 90px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      pointer-events: none;
    }
    @media (min-width: 992px) {
      #chat-toast-container {
        left: auto;
        right: 30px;
        bottom: 150px;
      }
    }
    #talkInterface {
      transition: top 0.25s ease, left 0.25s ease, right 0.25s ease, bottom 0.25s ease,
                  width 0.25s ease, height 0.25s ease, border-radius 0.25s ease;
    }
    #talkInterface.maximized {
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      border-radius: 0 !important;
    }
    #chatMaxBtn {
      position: fixed;
      bottom: 625px;
      right: 38px;
      z-index: 10002;
      background: rgba(0,75,151,0.82);
      color: #fff;
      border: none;
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 14px;
      cursor: pointer;
      line-height: 1.5;
    }
    #chatMaxBtn:hover { background: rgba(36,182,133,0.9); }
    #chatMaxBtn.maximized {
      bottom: auto;
      top: 10px;
      right: 10px;
    }
    .chat-toast {
      position: relative;
      background: #fff;
      border-radius: 14px;
      padding: 10px 12px 10px 12px;
      padding-top: 22px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
      pointer-events: auto;
      cursor: pointer;
      max-width: 290px;
      min-width: 210px;
      overflow: hidden;
      opacity: 0;
      transform: translateX(14px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .chat-toast--visible {
      opacity: 1;
      transform: translateX(0);
    }
    .chat-toast:hover {
      box-shadow: 0 8px 28px rgba(0,0,0,0.18);
    }
    .chat-toast__badge {
      position: absolute;
      top: 6px;
      left: 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #004b97;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .chat-toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 100%;
      background: #abdad5;
      border-radius: 0 0 12px 12px;
      transform-origin: left;
      transform: scaleX(1);
    }
    .chat-toast__progress--running {
      transition: transform linear;
      transform: scaleX(0);
    }
    .chat-toast__close {
      position: absolute;
      top: 4px;
      right: 8px;
      background: none;
      border: none;
      font-size: 14px;
      color: #bbb;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .chat-toast__close:hover { color: #555; }
    .chat-toast__content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chat-toast__avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .chat-toast__body {
      flex: 1;
      overflow: hidden;
    }
    .chat-toast__name {
      font-size: 13px;
      font-weight: 600;
      color: #222;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chat-toast__preview {
      font-size: 12px;
      color: #777;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .chat-toast__img-thumb {
      width: 42px;
      height: 42px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid #eee;
    }
  `,document.head.appendChild(e)})();const U=(()=>{const t=document.createElement("div");return t.id="chat-toast-container",document.body.appendChild(t),t})();function w(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function f(t){const e=h.get(t);e&&(clearTimeout(e.timer),e.el.classList.remove("chat-toast--visible"),setTimeout(()=>{e.el.remove(),h.delete(t)},300))}function $(t){return t?Array.isArray(t)&&t.length>0?t[0]:typeof t=="string"&&t.trim()?t.trim():null:null}function I(t){var g;const e=t.username,o=y.get(e)||{name:t._overrideName??e,photoURL:t._overrideAvatar??"../image/default-avatar.webp",userId:null};t._overrideName&&(o.name=t._overrideName),t._overrideAvatar&&(o.photoURL=t._overrideAvatar);const m=L(),d=!!a,c=$(t.attachments),i=!!((g=t.message)!=null&&g.trim())?t.message.slice(0,45):c?"傳送一張圖片":"";if(h.has(e)){const s=h.get(e);clearTimeout(s.timer),s.count++;const u=s.el.querySelector(".chat-toast__preview");u&&(u.textContent=`${s.count} 則新訊息`),s.timer=setTimeout(()=>f(e),_);return}h.size>=A&&f(h.keys().next().value),localStorage.getItem("chatSound")!=="0"&&new Audio("../sound/toast.mp3").play().catch(()=>{});const l=document.createElement("div");l.className="chat-toast",l.innerHTML=`
    <span class="chat-toast__badge">New Message</span>
    <div class="chat-toast__progress"></div>
    <button class="chat-toast__close" aria-label="關閉">×</button>
    <div class="chat-toast__content">
      <img class="chat-toast__avatar" src="${w(o.photoURL)}" onerror="this.src='../image/default-avatar.webp'" alt="">
      <div class="chat-toast__body">
        <div class="chat-toast__name">${w(o.name)}</div>
        <div class="chat-toast__preview">${w(i)}</div>
      </div>
      ${c?`<img class="chat-toast__img-thumb" src="${w(c)}" alt="圖片預覽">`:""}
    </div>
  `,l.querySelector(".chat-toast__close").addEventListener("click",s=>{s.stopPropagation(),f(e)}),l.addEventListener("click",()=>{f(e);const s=o.userId;!m&&d&&s?(a.src=`../chatroom/chatroom.html?openChat=${s}`,a.style.display="block"):window.location.href=`../chatroom/chatroom.html${s?"?openChat="+s:""}`}),U.appendChild(l),requestAnimationFrame(()=>{l.classList.add("chat-toast--visible");const s=l.querySelector(".chat-toast__progress");s&&(s.style.transitionDuration=`${_}ms`,requestAnimationFrame(()=>s.classList.add("chat-toast__progress--running")))});const b=setTimeout(()=>f(e),_);h.set(e,{el:l,timer:b,count:1})}function M(t,e,o,m){if(!("Notification"in window)||Notification.permission!=="granted"||!document.hidden)return;const d=new Notification(t,{body:e,icon:o||"../webP/treasurehub.webp",badge:"../webP/treasurehub.webp",tag:"treasurehub-chat"});d.onclick=()=>{window.focus(),m&&(window.location.href=m),d.close()}}window.addEventListener("load",async()=>{var m;const t=new T,e=localStorage.getItem("username");try{const d=await t.listRooms();let c=!1;(m=d.data.items)==null||m.forEach(n=>{var s,u,C;if(n.type!=="OFFICIAL"){const p=(s=n.members)==null?void 0:s.find(z=>z.name!==e);p&&y.set(p.name,{name:p.name,photoURL:p.photoURL||"../image/default-avatar.webp",userId:p.id??p.accountId??p.userId??null})}const i=n.type==="OFFICIAL",l=(u=n.members)==null?void 0:u.find(p=>p.name===e),b=((C=n.lastMessage)==null?void 0:C.username)===(l==null?void 0:l.name),g=(l==null?void 0:l.lastReadMessageId)??n.lastReadMessageId??null;n.lastMessageId!=null&&g!==n.lastMessageId&&(i||!b)&&(c=!0)}),c&&window.dispatchEvent(new CustomEvent("chatUnread"))}catch{}const o=new EventSource(`${t.baseUrl}/api/chat/stream`,{withCredentials:!0});o.addEventListener("newMessage",d=>{var n;const c=JSON.parse(d.data);if(c.username!==e){window.dispatchEvent(new CustomEvent("chatUnread")),I(c);const i=y.get(c.username);M(`拾貨寶庫 — ${(i==null?void 0:i.name)??c.username}`,((n=c.message)==null?void 0:n.trim())||"傳送了一張圖片",(i==null?void 0:i.photoURL)??"../webP/treasurehub.webp",`../chatroom/chatroom.html${i!=null&&i.userId?"?openChat="+i.userId:""}`)}}),o.addEventListener("newBroadcast",d=>{var c;window.dispatchEvent(new CustomEvent("chatUnread"));try{const n=JSON.parse(d.data),i=n.channelName||((c=n.channel)==null?void 0:c.name)||"拾貨寶庫公告";I({username:"__official__",message:n.message||"新的官方公告",attachments:n.attachments,_overrideName:i,_overrideAvatar:"../webP/treasurehub.webp"}),M(`拾貨寶庫 — ${i}`,n.message||"新的官方公告","../webP/treasurehub.webp","../chatroom/chatroom.html")}catch{}}),o.addEventListener("ping",()=>{}),o.addEventListener("ready",()=>{}),o.onerror=()=>{o.close()}});function R(t){const e=document.getElementById("chatNavBadge");e&&e.classList.toggle("show",t)}window.addEventListener("chatUnread",()=>R(!0));window.toggleChatInterface=S;window.canEnterChat=k;
