import{C as S}from"./ChatBackendService-sdQaFUXt.js";const a=document.getElementById("talkInterface"),v=document.getElementById("chaticon");function L(){return!!document.querySelector(".bottom-nav")}let i=null;function A(){return i||(a?(i=document.createElement("button"),i.id="chatMaxBtn",i.title="全螢幕",i.innerHTML="⛶",i.style.display="none",document.body.appendChild(i),i.addEventListener("click",t=>{t.stopPropagation(),b()}),i):null)}function b(t=!1){var o;if(!a)return;const e=t?!1:!a.classList.contains("maximized");a.classList.toggle("maximized",e),(o=a.contentWindow)==null||o.postMessage({type:e?"maximizeChat":"restoreFromParent"},window.location.origin),i&&(i.classList.toggle("maximized",e),i.innerHTML=e?"⊡":"⛶",i.title=e?"縮小視窗":"全螢幕")}function U(){const t=A();t&&(t.style.display="block")}function E(){i&&(i.style.display="none")}async function $(){if(L()){window.location.href="../chatroom/chatroom.html";return}if(a.style.display==="none"||a.style.display===""){if(!await B()){a.style.display="none";return}(!a.src||a.src==="about:blank"||a.src===window.location.href)&&(a.src="../chatroom/chatroom.html"),a.style.display="block",U()}else a.classList.remove("maximized"),a.style.display="none",E()}window.addEventListener("click",function(t){L()||a&&a.style.display==="block"&&!a.classList.contains("maximized")&&!a.contains(t.target)&&!(v!=null&&v.contains(t.target))&&!document.querySelector(".swal2-container")&&(a.style.display="none")});document.addEventListener("keydown",function(t){t.key!=="Escape"||!a||a.style.display==="none"||(a.classList.contains("maximized")?b(!0):(a.style.display="none",E()))});window.addEventListener("message",function(t){var e,o,m;((e=t.data)==null?void 0:e.type)==="closeChat"?(a&&(a.classList.remove("maximized"),a.style.display="none"),E(),document.body.classList.remove("chat-open-mobile")):((o=t.data)==null?void 0:o.type)==="maximizeChat"?b(!1):((m=t.data)==null?void 0:m.type)==="restoreChat"&&b(!0)});async function B(){return!0}const O=5,_=5e3,y=new Map,f=new Map;(function(){if(document.getElementById("chat-toast-style"))return;const e=document.createElement("style");e.id="chat-toast-style",e.textContent=`
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
  `,document.head.appendChild(e)})();const R=(()=>{const t=document.createElement("div");return t.id="chat-toast-container",document.body.appendChild(t),t})();function x(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function g(t){const e=f.get(t);e&&(clearTimeout(e.timer),e.el.classList.remove("chat-toast--visible"),setTimeout(()=>{e.el.remove(),f.delete(t)},300))}function q(t){return t?Array.isArray(t)&&t.length>0?t[0]:typeof t=="string"&&t.trim()?t.trim():null:null}function M(t){var h;const e=t.username,o=y.get(e)||{name:t._overrideName??e,photoURL:t._overrideAvatar??"../image/default-avatar.webp",userId:null};t._overrideName&&(o.name=t._overrideName),t._overrideAvatar&&(o.photoURL=t._overrideAvatar);const m=L(),d=!!a,r=q(t.attachments),p=!!((h=t.message)!=null&&h.trim())?t.message.slice(0,45):r?"傳送一張圖片":"";if(f.has(e)){const s=f.get(e);clearTimeout(s.timer),s.count++;const w=s.el.querySelector(".chat-toast__preview");w&&(w.textContent=`${s.count} 則新訊息`),s.timer=setTimeout(()=>g(e),_);return}f.size>=O&&g(f.keys().next().value),localStorage.getItem("chatSound")!=="0"&&new Audio("../sound/toast.mp3").play().catch(()=>{});const n=document.createElement("div");n.className="chat-toast",n.innerHTML=`
    <span class="chat-toast__badge">New Message</span>
    <div class="chat-toast__progress"></div>
    <button class="chat-toast__close" aria-label="關閉">×</button>
    <div class="chat-toast__content">
      <img class="chat-toast__avatar" src="${x(o.photoURL)}" onerror="this.src='../image/default-avatar.webp'" alt="">
      <div class="chat-toast__body">
        <div class="chat-toast__name">${x(o.name)}</div>
        <div class="chat-toast__preview">${x(p)}</div>
      </div>
      ${r?`<img class="chat-toast__img-thumb" src="${x(r)}" alt="圖片預覽">`:""}
    </div>
  `,n.querySelector(".chat-toast__close").addEventListener("click",s=>{s.stopPropagation(),g(e)}),n.addEventListener("click",()=>{g(e);const s=o.userId;!m&&d&&s?(a.src=`../chatroom/chatroom.html?openChat=${s}`,a.style.display="block"):window.location.href=`../chatroom/chatroom.html${s?"?openChat="+s:""}`}),R.appendChild(n),requestAnimationFrame(()=>{n.classList.add("chat-toast--visible");const s=n.querySelector(".chat-toast__progress");s&&(s.style.transitionDuration=`${_}ms`,requestAnimationFrame(()=>s.classList.add("chat-toast__progress--running")))});const c=setTimeout(()=>g(e),_);f.set(e,{el:n,timer:c,count:1})}function z(t,e,o,m){if(!("Notification"in window)||Notification.permission!=="granted"||!document.hidden)return;const d=new Notification(t,{body:e,icon:o||"../webP/treasurehub.webp",badge:"../webP/treasurehub.webp",tag:"treasurehub-chat"});d.onclick=()=>{window.focus(),m&&(window.location.href=m),d.close()}}window.addEventListener("load",async()=>{var m;const t=new S,e=localStorage.getItem("username");try{const d=await t.listRooms();let r=!1;(m=d.data.items)==null||m.forEach(n=>{var I,C,k;if(n.type!=="OFFICIAL"){const u=(I=n.members)==null?void 0:I.find(N=>N.name!==e);u&&y.set(u.name,{name:u.name,photoURL:u.photoURL||"../image/default-avatar.webp",userId:u.id??u.accountId??u.userId??null})}const c=n.type==="OFFICIAL",h=(C=n.members)==null?void 0:C.find(u=>u.name===e),s=((k=n.lastMessage)==null?void 0:k.username)===(h==null?void 0:h.name),w=(h==null?void 0:h.lastReadMessageId)??n.lastReadMessageId??null;n.lastMessageId!=null&&w!==n.lastMessageId&&(c||!s)&&(r=!0)});const l=document.getElementById("talkInterface"),p=l&&l.style.display!=="none";r&&!p&&window.dispatchEvent(new CustomEvent("chatUnread"))}catch{}const o=new EventSource(`${t.baseUrl}/api/chat/stream`,{withCredentials:!0});o.addEventListener("newMessage",d=>{var l;const r=JSON.parse(d.data);if(r.username!==e){const p=document.getElementById("talkInterface");p&&p.style.display!=="none"||window.dispatchEvent(new CustomEvent("chatUnread")),M(r);const c=y.get(r.username);z(`拾貨寶庫 — ${(c==null?void 0:c.name)??r.username}`,((l=r.message)==null?void 0:l.trim())||"傳送了一張圖片",(c==null?void 0:c.photoURL)??"../webP/treasurehub.webp",`../chatroom/chatroom.html${c!=null&&c.userId?"?openChat="+c.userId:""}`)}}),o.addEventListener("newBroadcast",d=>{var r;window.dispatchEvent(new CustomEvent("chatUnread"));try{const l=JSON.parse(d.data),p=l.channelName||((r=l.channel)==null?void 0:r.name)||"拾貨寶庫公告";M({username:"__official__",message:l.message||"新的官方公告",attachments:l.attachments,_overrideName:p,_overrideAvatar:"../webP/treasurehub.webp"}),z(`拾貨寶庫 — ${p}`,l.message||"新的官方公告","../webP/treasurehub.webp","../chatroom/chatroom.html")}catch{}}),o.addEventListener("ping",()=>{}),o.addEventListener("ready",()=>{}),o.onerror=()=>{o.close()}});function T(t){const e=document.getElementById("chatNavBadge");e&&e.classList.toggle("show",t)}window.addEventListener("chatUnread",()=>T(!0));window.addEventListener("chatRead",()=>T(!1));window.toggleChatInterface=$;window.canEnterChat=B;
