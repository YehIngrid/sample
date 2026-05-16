import{B as M}from"./BackendService-iS7mEpP4.js";/* empty css                *//* empty css                     */import"./default-CbfdwExZ.js";import"./chat-D0rVihCe.js";import"./ChatBackendService-BYkGcC7l.js";let f,C;const ie=10;let Be=1,X="all",ee="all";const Le={all:null,pending:"pending",preparing:"preparing",shipping:"shipping",delivered:"delivered",review:"review_pending",completed:"completed",cancelled:"canceled"};localStorage.getItem("uid");window.currentOrder=null;window.onload=function(){var t=document.getElementById("loader"),n=document.getElementById("whatcontent");t&&n&&(t.style.setProperty("display","none","important"),n.style.setProperty("display","block","important"))};function R(t){return t==null?"":t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const _=document.getElementById("mProfileName"),D=document.getElementById("mProfileInfo"),N=document.getElementById("mProfileAvatar"),F=document.getElementById("uid"),V=document.getElementById("muid"),W=document.getElementById("rate"),Y=document.getElementById("rate1"),G=document.getElementById("rate2"),Z=document.getElementById("showName"),K=document.getElementById("showIntro"),H=document.getElementById("profileName"),q=document.getElementById("profileInfo"),U=document.getElementById("profileAvatar"),ue="../webP/default-avatar.webp";N&&(N.src=ue);U&&(U.src=ue);window._authReady.then(t=>{if(t){const n=localStorage.getItem("username")||"使用者名稱",o=localStorage.getItem("intro")||"尚未新增使用者介紹",e=localStorage.getItem("avatar"),r=localStorage.getItem("rate")||"無法顯示",s=localStorage.getItem("uid")||"",i=localStorage.getItem("userCreatedAt"),a=localStorage.getItem("contractEmail")||"";F&&(F.textContent=s),V&&(V.textContent=s),_&&(_.textContent=n),D&&(D.textContent=o),H&&(H.textContent=n),Z&&(Z.textContent=n),q&&(q.textContent=o),K&&(K.textContent=o);const c=document.getElementById("showEmail");c&&(c.textContent=a||"尚未設定"),W&&(W.textContent=r),Y&&(Y.textContent=r),G&&(G.textContent=r);const l=e&&e!=="null"&&e!=="",d=l?e:ue;N&&(N.src=d),U&&(U.src=d),l&&document.querySelectorAll('.bottom-nav-item .nav-icon[src*="default-avatar"]').forEach(p=>{p.src=e,p.style.borderRadius="50%",p.style.border="1px solid #004b97",p.style.objectFit="cover"}),nt();const u=document.getElementById("showTime");if(u)if(!i)u.textContent="無法顯示";else{const p=new Date(i);u.textContent=isNaN(p.getTime())?"無法顯示":p.toLocaleDateString("zh-TW",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"})}}else{F&&(F.textContent=""),V&&(V.textContent=""),document.querySelectorAll(".uid").forEach(s=>s.style.display="none");const n='<a href="../account/account.html" style="color:#004b97;text-decoration:none;font-weight:600;">登入 / 註冊</a>';_&&(_.innerHTML=n),H&&(H.innerHTML=n),D&&(D.textContent=""),q&&(q.textContent=""),Z&&(Z.textContent=""),K&&(K.textContent=""),W&&(W.textContent=""),Y&&(Y.textContent=""),G&&(G.textContent="");const o=document.getElementById("showTime");o&&(o.textContent="");const e=document.getElementById("logoutMobile");e&&(e.style.display="none"),document.querySelectorAll(".fastContainer .fastIcon, .fastContainer button").forEach(s=>{s.style.opacity="0.35",s.style.pointerEvents="none",s.style.cursor="default"}),document.querySelectorAll(".itemContainer button").forEach(s=>{s.style.opacity="0.35",s.style.pointerEvents="none",s.style.cursor="default"}),document.querySelectorAll(".list-group-item[data-target]").forEach(s=>{s.dataset.target!=="account"&&(s.style.opacity="0.35",s.style.pointerEvents="none",s.style.cursor="default")});const r=document.getElementById("logout");r&&(r.innerHTML="登入 / 註冊",r.href="../account/account.html",r.onclick=null)}});document.getElementById("update-profile").addEventListener("click",async()=>{const t=document.getElementById("display-name").value.trim(),n=document.getElementById("photo"),o=document.getElementById("bio").value.trim(),e=document.getElementById("loader1"),r=new FormData;if(!t&&!o&&n.files.length===0){Swal.fire({icon:"warning",title:"請填寫完整資料",text:"請檢查是否有空白欄位"});return}t&&r.append("name",t),o&&r.append("introduction",o),n.files.length>0&&r.append("photo",n.files[0]);try{Swal.fire({title:"確定要進行更新嗎?",icon:"warning",showCancelButton:!0,confirmButtonColor:"#3085d6",cancelButtonColor:"#d33",confirmButtonText:"是，我要更新",cancelButtonText:"取消"}).then(async s=>{if(s.isConfirmed)try{e.style.display="block",f=new M;const i=await f.updateProfile(r);await Swal.fire({icon:"success",title:"更新成功",text:"個人資料已更新"}),_.textContent=localStorage.getItem("username")||"使用者名稱",D.textContent=localStorage.getItem("intro")||"使用者介紹",N.src=localStorage.getItem("avatar")||"../image/default-avatar.webp",H.textContent=localStorage.getItem("username")||"使用者名稱",q.textContent=localStorage.getItem("intro")||"使用者介紹",U.src=localStorage.getItem("avatar")||"../image/default-avatar.webp",window.location.reload()}catch(i){console.error("更新失敗：",i),Swal.fire({icon:"error",title:"更新失敗",text:i})}finally{e.style.display="none"}})}catch(s){console.error("更新失敗：",s),Swal.fire({icon:"error",title:"更新失敗",text:"請稍後再試"})}});const ce=document.getElementById("logout");ce==null||ce.addEventListener("click",function(){Swal.fire({title:"確定要登出嗎？",icon:"warning",showCancelButton:!0,confirmButtonText:"登出",cancelButtonText:"取消"}).then(t=>{t.isConfirmed&&(localStorage.removeItem("uid"),localStorage.removeItem("username"),localStorage.removeItem("intro"),localStorage.removeItem("avatar"),Swal.fire({icon:"success",title:"登出成功",text:"您已成功登出"}).then(()=>{window.location.href="../account/account.html"}))})});const le=document.getElementById("logoutMobile");le==null||le.addEventListener("click",function(){Swal.fire({title:"確定要登出嗎？",icon:"warning",showCancelButton:!0,confirmButtonText:"登出",cancelButtonText:"取消"}).then(async t=>{if(t.isConfirmed)try{f||(f=new M),await f.logout(),Swal.fire({icon:"success",title:"登出成功",text:"您已成功登出"}).then(()=>{window.location.href="../account/account.html"})}catch{Swal.fire({icon:"error",title:"登出失敗請稍後重試"})}})});var Ie;(Ie=document.getElementById("setEmailBtn"))==null||Ie.addEventListener("click",async()=>{var r,s,i,a;const t=(s=(r=document.getElementById("showEmail"))==null?void 0:r.textContent)==null?void 0:s.trim(),n=t==="尚未設定"?"":t,{isConfirmed:o}=await Swal.fire({title:"設定常用帳號",html:`<input id="swal-email-input" type="email" autocomplete="email" class="swal2-input" placeholder="輸入 Email" value="${n}">`,showCancelButton:!0,confirmButtonText:"儲存",cancelButtonText:"取消",focusConfirm:!1,preConfirm:()=>{const c=document.getElementById("swal-email-input").value.trim();return c?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)?c:(Swal.showValidationMessage("Email 格式不正確"),!1):(Swal.showValidationMessage("請輸入 Email"),!1)}});if(!o)return;const e=(a=(i=document.getElementById("swal-email-input"))==null?void 0:i.value)==null?void 0:a.trim();if(e)try{const c=new FormData;c.append("contactEmail",e),await f.updateProfile(c),localStorage.setItem("contractEmail",e),document.getElementById("showEmail").textContent=e,Swal.fire({icon:"success",title:"儲存成功",timer:1500,showConfirmButton:!1})}catch{Swal.fire({icon:"error",title:"儲存失敗",text:"請稍後再試"})}});document.querySelectorAll("[data-target]").forEach(t=>{t.addEventListener("click",function(n){n.preventDefault();const o=this.getAttribute("data-target"),e=new URL(window.location.href);e.searchParams.set("page",o),e.searchParams.delete("orderId"),window.history.pushState({page:o},"",e),T()})});document.addEventListener("click",function(t){const n=t.target.closest(".action-btn");if(!n)return;const o=n.getAttribute("data-action"),e=n.getAttribute("data-id");Me(o,e,n)});function we(t,n){var i,a,c,l;if(!t)return null;const o=localStorage.getItem("uid"),e=t.find(d=>d.id==n);if(!e)return null;const r=((i=e.buyerUser)==null?void 0:i.id)??((a=e.buyerUser)==null?void 0:a.accountId),s=((c=e.sellerUser)==null?void 0:c.id)??((l=e.sellerUser)==null?void 0:l.accountId);return String(r)==o?s:String(s)==o?r:null}async function Me(t,n,o){var s,i,a,c,l;const e=o.closest(".content-section"),r=e?e.id:"";if(t==="checkInfo"||t==="查看"){const d=r==="sellProducts"?"sellOrderDetail":"buyerOrderDetail",u=new URL(window.location.href);u.searchParams.set("page",d),u.searchParams.set("orderId",n),window.history.pushState({page:d,orderId:n},"",u),T()}else if(t==="編輯商品")openEditDrawer(n,o);else if(t==="check"){const d=`../product/product.html?id=${encodeURIComponent(n)}`;window.location.href=d}else if(t==="聯絡賣家"||t==="contact"){let d=null;const u=localStorage.getItem("uid");if(window.currentOrder){const p=window.currentOrder,x=((s=p.buyerUser)==null?void 0:s.id)??((i=p.buyerUser)==null?void 0:i.accountId),$=((a=p.sellerUser)==null?void 0:a.id)??((c=p.sellerUser)==null?void 0:c.accountId);d=String(x)==u?$:x}if(d||(d=we(C,n)),!d){console.error("找不到聊天對象",{id:n,goodsOrder:C,currentOrder:window.currentOrder}),Swal.fire("錯誤","找不到聊天對象","error");return}Ke(d)}else if(t==="cancel"){if(confirm("確定要取消訂單嗎?"))try{await f.cancelMyOrder(n),j("cancel").then(()=>T()).then(()=>window.location.reload())}catch(d){Swal.fire({title:"訂單取消失敗",icon:"error",text:d})}}else if(t==="接受訂單")try{await f.sellerAcceptOrders(n),j("accept").then(()=>T()).then(()=>window.location.reload())}catch(d){Swal.fire({title:"訂單同意失敗",icon:"error",text:d})}else if(t==="即將出貨")try{await f.sellerDeliveredOrders(n),j("deliver").then(()=>T()).then(()=>window.location.reload())}catch(d){Swal.fire({title:"系統登記出貨失敗",icon:"error",text:d})}else if(t==="成功取貨")try{await f.buyerCompletedOrders(n),await j("completed"),await oe(1)}catch(d){Swal.fire({title:"系統登記取貨失敗",icon:"error",text:d})}else if(t==="給對方評價")Je(n,we(C,n),r==="sellProducts"?"buyer":"seller");else if(t==="watchComment"){const d=((l=o.closest(".content-section"))==null?void 0:l.id)==="sellProducts";Qe(n,d)}else t==="delete"&&Swal.fire({title:"確定要下架並刪除此商品嗎？",icon:"warning",showCancelButton:!0,confirmButtonText:"是，我要下架",cancelButtonText:"取消"}).then(async d=>{d.isConfirmed&&await f.deleteMyItems(n).then(()=>{Swal.fire({icon:"success",title:"商品下架成功"}),window.location.reload()}).catch(u=>Swal.fire({icon:"error",title:"刪除失敗",text:String(u)}))})}async function T(){var l,d,u,p,x,$,m,b,E,v,w,g,y,h,L,A;const t=new URLSearchParams(window.location.search),n=t.get("page")||"account",o=t.get("orderId");window.scrollTo({top:0,behavior:"instant"}),document.querySelectorAll(".content-section").forEach(S=>S.classList.add("d-none"));const e=document.getElementById("sellTable"),r=document.getElementById("sellTableTitle"),s=document.getElementById("buyTableTitle"),i=document.getElementById("buyTable");r&&(r.style.display="block"),s&&(s.style.display="block"),e&&(e.style.display="block"),i&&(i.style.display="block"),document.getElementById("sell-product")&&document.getElementById("sell-product").classList.remove("d-none"),document.getElementById("buy-product")&&document.getElementById("buy-product").classList.remove("d-none");const a=document.getElementById(n);if(a&&a.classList.remove("d-none"),(l=document.getElementById("sellFilter"))==null||l.classList.remove("d-none"),(d=document.getElementById("buyFilter"))==null||d.classList.remove("d-none"),(u=document.getElementById("sellPagination"))==null||u.classList.remove("d-none"),(p=document.getElementById("buyPagination"))==null||p.classList.remove("d-none"),n==="sellOrderDetail"&&o){(x=document.getElementById("sellProducts"))==null||x.classList.remove("d-none"),($=document.getElementById("sellOrderDetail"))==null||$.classList.remove("d-none");const S=document.getElementById("sell-product");S&&S.classList.add("d-none"),e.style.display="none",r.style.display="none",(m=document.getElementById("sellFilter"))==null||m.classList.add("d-none"),(b=document.getElementById("sellPagination"))==null||b.classList.add("d-none"),(E=document.querySelector("#sellProducts .mobile-back-btn"))==null||E.classList.add("d-none"),(v=document.querySelector("#sellProducts .order-guide-wrap"))==null||v.classList.add("d-none"),he(o);return}if(n==="buyerOrderDetail"&&o){(w=document.getElementById("buyProducts"))==null||w.classList.remove("d-none"),(g=document.getElementById("buyerOrderDetail"))==null||g.classList.remove("d-none");const S=document.getElementById("buy-product");S&&S.classList.add("d-none"),i.style.display="none",s.style.display="none",(y=document.getElementById("buyFilter"))==null||y.classList.add("d-none"),(h=document.getElementById("buyPagination"))==null||h.classList.add("d-none"),(L=document.querySelector("#buyProducts .mobile-back-btn"))==null||L.classList.add("d-none"),(A=document.querySelector("#buyProducts .order-guide-wrap"))==null||A.classList.add("d-none"),he(o);return}Re(),document.querySelectorAll(".list-group-item[data-target]").forEach(S=>{S.classList.toggle("active",S.dataset.target===n)}),f||(f=new M);try{n==="sellProducts"?(window.currentOrder=null,X="all",document.querySelectorAll("#sellFilter .filter-tab").forEach(S=>S.classList.toggle("active",S.dataset.status==="all")),document.querySelector("#sellProducts tbody").innerHTML='<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>',document.getElementById("sell-product").innerHTML='<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>',await me(1)):n==="buyProducts"?(window.currentOrder=null,ee="all",document.querySelectorAll("#buyFilter .filter-tab").forEach(S=>S.classList.toggle("active",S.dataset.status==="all")),document.querySelector("#buyProducts tbody").innerHTML='<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>',document.getElementById("buy-product").innerHTML='<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>',await oe(1)):n==="products"?(Be=1,await Ae(1)):n==="settings"&&(De(),ke(1))}catch(S){console.error(S)}const c=t.get("scroll");c&&setTimeout(()=>{var S;(S=document.getElementById(c))==null||S.scrollIntoView({behavior:"smooth",block:"start"})},100)}var Ee;(Ee=document.getElementById("backToSellTable"))==null||Ee.addEventListener("click",()=>{const t=new URL(window.location.href);t.searchParams.set("page","sellProducts"),t.searchParams.delete("orderId"),history.pushState({},"",t),T()});var Se;(Se=document.getElementById("backToBuyTable"))==null||Se.addEventListener("click",()=>{const t=new URL(window.location.href);t.searchParams.set("page","buyProducts"),t.searchParams.delete("orderId"),history.pushState({},"",t),T()});const Oe={accept:{svg:"../svg/acceptOrder.svg",anim:"swal-anim-bounce",title:"已同意訂單",sub:"買家將收到通知"},deliver:{svg:"../svg/readyDeliver.svg",anim:"swal-anim-slide-up",title:"已登記出貨",sub:"請買家留意收貨狀態"},completed:{svg:"../svg/completed.svg",anim:"swal-anim-pop-glow",title:"交易完成！",sub:"感謝您使用拾貨寶庫"},cancel:{svg:"../svg/cancelOrder.svg",anim:"swal-anim-shake",title:"已取消訂單",sub:"系統將自動通知對方",gray:!0},review:{svg:"../svg/giveStar.svg",anim:"swal-anim-spin-in",title:"評價已送出",sub:"感謝您留下評價"}};function j(t){const n=Oe[t];return n?Swal.fire({html:`
      <div class="swal-order-icon ${n.anim}${n.gray?" swal-grayscale":""}">
        <img src="${n.svg}" alt="">
      </div>
      <div class="swal-order-title">${n.title}</div>
      <div class="swal-order-sub">${n.sub}</div>
    `,showConfirmButton:!1,timer:2200,timerProgressBar:!0,customClass:{popup:"swal-order-popup"}}):Promise.resolve()}function Re(){var t,n,o,e,r,s;(t=document.getElementById("sellOrderDetail"))==null||t.classList.add("d-none"),(n=document.getElementById("buyerOrderDetail"))==null||n.classList.add("d-none"),(o=document.querySelector("#sellProducts .mobile-back-btn"))==null||o.classList.remove("d-none"),(e=document.querySelector("#buyProducts .mobile-back-btn"))==null||e.classList.remove("d-none"),(r=document.querySelector("#sellProducts .order-guide-wrap"))==null||r.classList.remove("d-none"),(s=document.querySelector("#buyProducts .order-guide-wrap"))==null||s.classList.remove("d-none")}async function me(t){var n,o,e,r;try{const s=Le[X]??null,i=await f.getSellerOrders(t,s),a=((o=(n=i==null?void 0:i.data)==null?void 0:n.data)==null?void 0:o.orders)??[],c=((r=(e=i==null?void 0:i.data)==null?void 0:e.data)==null?void 0:r.pagination)??{};C=a,Ne(a),Fe(a),Pe("sellPagination",c,me),Ce(a,"sellFilter",c,X)}catch(s){console.error("loadSellerOrders failed",s);const i=document.querySelector("#sellProducts tbody");i&&(i.innerHTML='<tr><td colspan="4" class="text-center text-muted py-4">載入失敗，請重新整理</td></tr>');const a=document.getElementById("sell-product");a&&(a.innerHTML='<div class="col-12 text-center text-muted py-4">載入失敗，請重新整理</div>')}}async function oe(t){var n,o,e,r;try{const s=Le[ee]??null,i=await f.getBuyerOrders(t,s),a=((o=(n=i==null?void 0:i.data)==null?void 0:n.data)==null?void 0:o.orders)??[],c=((r=(e=i==null?void 0:i.data)==null?void 0:e.data)==null?void 0:r.pagination)??{};C=a,je(a),Ve(a),Pe("buyPagination",c,oe),Ce(a,"buyFilter",c,ee)}catch(s){console.error("loadBuyerOrders failed",s);const i=document.querySelector("#buyProducts tbody");i&&(i.innerHTML='<tr><td colspan="5" class="text-center text-muted py-4">載入失敗，請重新整理</td></tr>');const a=document.getElementById("buy-product");a&&(a.innerHTML='<div class="col-12 text-center text-muted py-4">載入失敗，請重新整理</div>')}}const Te={pending:"pending",preparing:"preparing",shipping:"delivered",delivered:"delivered",review_pending:"review",completed:"completed",canceled:"cancelled"},de=new Set(["pending","preparing","delivered","review"]);function Ce(t,n,o,e="all"){const r=document.getElementById(n);if(!r)return;const s=(o.totalPages??1)>1;if(e==="all"){const i=o.totalItems??t.length,a={};t.forEach(c=>{const l=Te[(c.status??"").toLowerCase()]??"pending";a[l]=(a[l]||0)+1}),r.querySelectorAll(".filter-tab").forEach(c=>{const l=c.dataset.status;let d=c.querySelector(".tab-count");if(d||(d=document.createElement("span"),d.className="tab-count",c.appendChild(d)),l==="all")d.textContent=s?`${i}+`:i;else{const u=a[l]||0;d.textContent=s&&u>0?`${u}+`:u,c.classList.toggle("tab-has-dot",u>0&&de.has(l))}})}else{const i=o.totalItems??t.length,a=r.querySelector(`.filter-tab[data-status="${e}"]`);if(!a)return;let c=a.querySelector(".tab-count");c||(c=document.createElement("span"),c.className="tab-count",a.appendChild(c)),c.textContent=s?`${i}+`:i,a.classList.toggle("tab-has-dot",i>0&&de.has(e))}}async function _e(){var t,n,o,e,r,s,i,a;try{const[c,l]=await Promise.all([f.getSellerOrders(1),f.getBuyerOrders(1)]),d=((n=(t=c==null?void 0:c.data)==null?void 0:t.data)==null?void 0:n.orders)??[],u=((e=(o=l==null?void 0:l.data)==null?void 0:o.data)==null?void 0:e.orders)??[],p=((s=(r=c==null?void 0:c.data)==null?void 0:r.data)==null?void 0:s.pagination)??{},x=((a=(i=l==null?void 0:l.data)==null?void 0:i.data)==null?void 0:a.pagination)??{};be("sellProducts",d,p),be("buyProducts",u,x)}catch{}}function be(t,n,o){const e=o.totalItems??n.length,s=(o.totalPages??1)>1?`${e}+`:`${e}`,i=n.some(a=>de.has(Te[(a.status??"").toLowerCase()]));document.querySelectorAll(`[data-target="${t}"]`).forEach(a=>{let c=a.querySelector(".order-sidebar-count");c||(c=document.createElement("span"),c.className="order-sidebar-count",a.appendChild(c)),c.textContent=e>0?s:"";let l=a.querySelector(".order-red-dot");l||(l=document.createElement("span"),l.className="order-red-dot",a.appendChild(l)),l.style.display=i?"":"none"})}function Pe(t,n,o){const e=document.getElementById(t);if(!e)return;const{currentPage:r=1,totalPages:s=1,hasPrevPage:i,hasNextPage:a}=n;if(s<1){e.innerHTML="";return}const c=Array.from({length:s},(l,d)=>d+1);e.innerHTML=`
    <button class="order-page-btn" data-page="${r-1}" ${i?"":"disabled"}>&#8592; 上一頁</button>
    ${c.map(l=>`<button class="order-page-num ${l===r?"active":""}" data-page="${l}">${l}</button>`).join("")}
    <button class="order-page-btn" data-page="${r+1}" ${a?"":"disabled"}>下一頁 &#8594;</button>
  `,e.querySelectorAll("button[data-page]").forEach(l=>{l.addEventListener("click",()=>{const d=parseInt(l.dataset.page);isNaN(d)||o(d)})})}document.getElementById("photo").addEventListener("change",function(t){const n=document.getElementById("myAvatarPreview");n.innerHTML="";const o=t.target.files[0];if(!o)return;const e=new FileReader;e.onload=function(r){const s=document.createElement("img");s.src=r.target.result,s.style.width="150px",s.style.height="150px",s.style.margin="10px",s.style.objectFit="cover",s.style.borderRadius="50%",s.style.border="2px solid #ccc",s.style.boxShadow="0 0 6px rgba(0,0,0,0.1)",n.appendChild(s)},e.readAsDataURL(o)});async function De(){var t,n,o;try{const e=await f.getMe(),r=(t=e==null?void 0:e.data)==null?void 0:t.data;if(!r)return;const s=document.getElementById("showLoginEmail");s&&(s.textContent=((n=r.account)==null?void 0:n.email)||"—");const i=document.getElementById("emailVerifyBadge");i&&(((o=r.account)==null?void 0:o.emailVerify)?i.innerHTML='<span style="display:inline-flex;align-items:center;gap:4px;background:rgb(36,182,133);color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;"><i class="ti ti-circle-check"></i>已驗證</span>':i.innerHTML='<span style="display:inline-flex;align-items:center;gap:4px;background:#e67e22;color:#fff;font-size:11px;padding:2px 8px;border-radius:20px;"><i class="ti ti-alert-circle"></i>未驗證</span>');const a=document.getElementById("showEmail");a&&(a.textContent=r.contactEmail||"尚未設定");const c=document.getElementById("showName"),l=document.getElementById("showIntro");c&&r.name&&(c.textContent=r.name),l&&r.introduction!=null&&(l.textContent=r.introduction||"尚未新增使用者介紹")}catch{}}async function He(){var n,o;const t=document.getElementById("recentNotifList");if(t)try{let i=function(a){if(!a)return"";const c=Math.floor((Date.now()-new Date(a))/6e4);if(c<1)return"剛剛";if(c<60)return`${c} 分鐘前`;const l=Math.floor(c/60);return l<24?`${l} 小時前`:`${Math.floor(l/24)} 天前`};const e=await f.getNotifications(1,20),r=(((o=(n=e==null?void 0:e.data)==null?void 0:n.data)==null?void 0:o.notifications)??[]).filter(a=>!a.isRead).slice(0,5);if(!r.length){t.innerHTML='<div class="text-center text-muted py-3" style="font-size:14px;">目前沒有通知</div>';return}const s={wishpool_contact:"許願池聯絡",order_placed:"訂單成立",order_completed:"訂單完成",order_cancelled:"訂單取消",review:"收到評價",system:"系統通知",new_message:"新訊息",product_sold:"商品已售出",product_liked:"商品被收藏"};t.innerHTML=r.map(a=>{var x,$;const c=((x=a.actor)==null?void 0:x.photoURL)??(($=a.actor)==null?void 0:$.avatar)??"../image/default-avatar.webp",l=a.title??s[a.type]??a.type??"",d=a.body??a.content??a.message??"",u=i(a.createdAt),p=!a.isRead;return`<div class="d-flex align-items-start gap-2${p?" fw-semibold":""}" style="font-size:13px;border-bottom:1px solid #f0f0f0;padding-bottom:8px;margin-bottom:8px;">
        <img src="${c}" onerror="this.src='../image/default-avatar.webp'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;" alt="">
        <div style="flex:1;min-width:0;">
          ${l?`<div style="color:#004b97;font-size:12px;">${l}</div>`:""}
          ${d?`<div class="text-truncate" style="max-width:100%;">${d}</div>`:""}
          <div style="color:#aaa;font-size:11px;margin-top:2px;">${u}</div>
        </div>
        ${p?'<span style="width:7px;height:7px;border-radius:50%;background:#004b97;flex-shrink:0;margin-top:6px;"></span>':""}
      </div>`}).join("")}catch{t.innerHTML='<div class="text-center text-muted py-3" style="font-size:14px;">無法載入通知</div>'}}document.addEventListener("DOMContentLoaded",()=>{var t,n;f=new M,T(),document.querySelectorAll(".profile-edit-header.collapsible").forEach(o=>{o.addEventListener("click",()=>{const e=o.dataset.collapseTarget,r=document.getElementById(e);if(!r)return;const s=r.classList.toggle("collapsed");o.classList.toggle("collapsed",s)})}),He(),_e(),window.onpopstate=function(){T()},(t=document.getElementById("sellFilter"))==null||t.addEventListener("click",o=>{const e=o.target.closest(".filter-tab");e&&(X=e.dataset.status,document.querySelectorAll("#sellFilter .filter-tab").forEach(r=>r.classList.toggle("active",r===e)),me(1))}),(n=document.getElementById("buyFilter"))==null||n.addEventListener("click",o=>{const e=o.target.closest(".filter-tab");e&&(ee=e.dataset.status,document.querySelectorAll("#buyFilter .filter-tab").forEach(r=>r.classList.toggle("active",r===e)),oe(1))})});const te={pending:{text:"待確認",badge:"order-badge-pending",action:"接受訂單",icon:"../svg/acceptOrder.svg"},preparing:{text:"待出貨",badge:"order-badge-preparing",action:"即將出貨",icon:"../svg/readyDeliver.svg"},shipping:{text:"配送中",badge:"order-badge-delivered",action:"等待買家確認收貨",icon:"../svg/waitBuyer.svg"},delivered:{text:"待收貨",badge:"order-badge-delivered",action:"等待買家確認收貨",icon:"../svg/waitBuyer.svg"},review_pending:{text:"待評價",badge:"order-badge-completed",action:"給對方評價",icon:"../svg/giveStar.svg"},completed:{text:"已完成",badge:"order-badge-scored",action:null,icon:null},canceled:{text:"已取消",badge:"order-badge-canceled",action:null,icon:null}},ne={pending:{text:"待確認",badge:"order-badge-pending",action:"聯絡賣家",icon:"../svg/canChat.svg"},preparing:{text:"待出貨",badge:"order-badge-preparing",action:"聯絡賣家",icon:"../svg/canChat.svg"},shipping:{text:"配送中",badge:"order-badge-delivered",action:"成功取貨",icon:"../svg/acceptOrder.svg"},delivered:{text:"待收貨",badge:"order-badge-delivered",action:"成功取貨",icon:"../svg/acceptOrder.svg"},review_pending:{text:"待評價",badge:"order-badge-completed",action:"給對方評價",icon:"../svg/giveStar.svg"},completed:{text:"已完成",badge:"order-badge-scored",action:null,icon:null},canceled:{text:"已取消",badge:"order-badge-canceled",action:null,icon:null}};function se(t,n,o){if((t.status??"").toLowerCase()!=="review_pending")return null;const r=t.reviewProgress??{},s=n?!!r.sellerReviewed:!!r.buyerReviewed,i=r.reviewDeadline?`<div class="review-deadline-hint">評論截止：${B(r.reviewDeadline)}</div>`:"";return s?`<div class="review-done-wrap">
      <span class="review-done-text">您已評論，等待對方評論</span>
      ${i}
    </div>`:`<div class="review-action-wrap">
    <button class="checkInfoBtn action-btn btn-row-action" data-action="給對方評價" data-id="${I(o)}">
      <img src="../svg/giveStar.svg" alt="給對方評價icon"/>
      <div>給對方評價</div>
    </button>
    ${i}
  </div>`}const qe=new Intl.NumberFormat("zh-TW",{style:"currency",currency:"TWD",maximumFractionDigits:0});function O(t){return t==null||isNaN(Number(t))?"-":qe.format(Number(t))}function B(t){if(!t)return"-";const n=new Date(t);if(isNaN(n))return"-";const o=n.getFullYear(),e=String(n.getMonth()+1).padStart(2,"0"),r=String(n.getDate()).padStart(2,"0");return`${o}/${e}/${r}`}function I(t){return String(t??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function re(t){var o;const n=t.orderItems;if(Array.isArray(n)&&n.length>0){const e=n[0],r=((o=e==null?void 0:e.item)==null?void 0:o.name)||(e==null?void 0:e.name)||t.name||"商品",s=(e==null?void 0:e.quantity)??1,i=n.length>1?"…":"";return`${I(r)} × ${s}${i}`}return I(t.name||`訂單 ${t.id}`)}function je(t){const n=document.querySelector("#buyProducts tbody");if(!n)return;if(!Array.isArray(t)||t.length===0){n.innerHTML='<tr><td colspan="5" class="text-center text-muted py-5">目前沒有訂單</td></tr>';return}const o=t.map((e,r)=>{var u;const s=e.id;I(e.name);const i=re(e),a=O(e.totalAmount);(u=e.sellerUser)==null||u.name,e.type;const c=B(e.createdAt),l=(e.status??"listed").toLowerCase(),d=ne[l]??ne.pending;return I(e.log||"無詳細資訊"),`
      <tr data-id="${I(s)}" style="animation-delay:${r*.05}s">
        <td>${i}</td>
        <td><span class="badge ${d.badge}">${d.text}</span></td>
        <td>${c}</td>
        <td>${a} 元</td>
        <td>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            ${se(e,!1,s)??(e.status!=="canceled"&&d.action?`<button class="checkInfoBtn action-btn btn-row-action" data-action="${d.action}" data-id="${s}">
              <img src="${d.icon}" alt="${d.action}icon"/>
              <div>${d.action}</div>
            </button>`:"")}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${s}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
              <div>訂單詳情</div>
            </button>
            ${e.status=="pending"||e.status=="preparing"?`<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${s}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>`:""}
            ${e.status!=="canceled"?`<button class="order-chat-btn action-btn" data-action="contact" data-id="${s}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>`:""}
          </div>
        </td>
      </tr>
    `}).join("");n.innerHTML=o}function Ne(t){const n=document.querySelector("#sellProducts tbody");if(!n)return;if(!Array.isArray(t)||t.length===0){n.innerHTML='<tr><td colspan="4" class="text-center text-muted py-5">目前沒有訂單</td></tr>';return}const o=t.map((e,r)=>{var u;const s=e.id;I(e.name);const i=re(e);O(e.totalAmount),(u=e.buyerUser)==null||u.name,e.type;const a=B(e.createdAt),c=(e.status??"listed").toLowerCase(),l=te[c]??te.pending,d=l.action==="等待買家確認收貨"?"disabled":"";return`
      <tr data-id="${I(s)}" style="animation-delay:${r*.05}s">
        <td>${i}</td>
        <td><span class="badge ${l.badge}">${l.text}</span></td>
        <td>${a}</td>
        <td>
          <div class="d-flex gap-2 flex-wrap align-items-center">
            ${se(e,!0,s)??(e.status!=="canceled"&&l.action?`<button class="checkInfoBtn action-btn btn-row-action" data-action="${l.action}" data-id="${s}" ${d}>
              <img src="${l.icon}" alt="${l.action}icon"/>
              <div>${l.action}</div>
            </button>`:"")}
            <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${s}">
              <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
              <div>訂單詳情</div>
            </button>
            ${e.status=="pending"||e.status=="preparing"?`<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${s}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>`:""}
            ${e.status!=="canceled"?`<button class="order-chat-btn action-btn" data-action="contact" data-id="${s}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>`:""}
          </div>
        </td>
      </tr>
    `}).join("");n.innerHTML=o}function Ue(t=[]){const n=document.querySelector("#products tbody");if(!n)return;if(!Array.isArray(t)||t.length===0){n.innerHTML='<tr><td colspan="6" class="text-center text-muted py-5">目前沒有商品</td></tr>';return}const o=t.map((e,r)=>{const s=e.id,i=I(e.name),a=O(e.price),c=B(e.updatedAt),l=B(e.createdAt),d=e.stock,u=d===0?"color: #dc3545; font-weight: bold;":"";return`
      <tr data-id="${I(s)}" style="animation-delay:${r*.05}s">
        <td>${i}</td>
        <td><span style="${u}">${d}</span></td>
        <td>${a}</td>
        <td>${l}</td>
        <td>${c}</td>
        <td>
          <div class="d-flex gap-3">
            <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="check" data-id="${s}">
              <img src="../svg/checkSell.svg" alt="查看商品按鈕"/>
              <div>查看商品</div>
            </button>
            <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="編輯商品" data-id="${s}">
              <img src="../svg/editSell.svg" alt="編輯此商品按鈕"/>
              <div>編輯商品</div>
            </button>
            <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="delete" data-id="${s}">
              <img src="../svg/deleteSell.svg" alt="永久下架此商品按鈕"/>
              <div>永久下架</div>
            </button>
          </div>
        </td>
      </tr>
    `}).join("");n.innerHTML=o}function ze(t=[]){const n=document.getElementById("product-cards");if(!n)return;if(!Array.isArray(t)||t.length===0){n.innerHTML='<div class="col-12 text-center text-muted py-5">目前沒有商品</div>';return}const o=t.map((e,r)=>{const s=e.id,i=I(e.name),a=O(e.price),c=B(e.updatedAt),l=B(e.createdAt),d=I(e.mainImage||e.imageUrl||"../image/placeholder.webp"),u=e.stock,p=u===0?"color: #dc3545; font-weight: bold;":"";return`
      <div class="col" data-id="${I(s)}">
        <div class="cardContainer h-100" style="animation-delay:${r*.07}s">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row justify-content-between align-items-end">
              <div class="d-flex">
                <div class="bg-light">
                  <img src="${d}" alt="${i}" class="object-cover">
                </div>
                <div>
                  <h6 class="mb-0 text-truncate" title="${i}">${i}</h6>
                  <div class="small text-muted mb-2" style="font-size: 12px;">建立：${l}<br>更新：${c}</div>
                  <div style="font-size: 12px; color: #004b97;">庫存：<span style="font-weight: bold; ${p}">${u}</span></div>
                </div>
              </div>
              <div class="fw-bold mb-2 text-end">${a}</div>
            </div>
            <div class="mt-auto d-flex justify-content-around gap-2">
              <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="check" data-id="${s}">
                <img src="../svg/checkSell.svg" alt="查看商品按鈕"/>
                <div>查看商品</div>
              </button>
              <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="編輯商品" data-id="${s}">
                <img src="../svg/editSell.svg" alt="編輯此商品按鈕"/>
                <div>編輯商品</div>
              </button>
              <button class="btnSell d-flex justify-content-center align-items-center gap-1 action-btn btn-row-action" data-action="delete" data-id="${s}">
                <img src="../svg/deleteSell.svg" alt="永久下架此商品按鈕"/>
                <div>永久下架</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `}).join("");n.innerHTML=o}function Fe(t=[]){const n=document.getElementById("sell-product");if(!n)return;if(!Array.isArray(t)||t.length===0){n.innerHTML='<div class="col-12 text-center text-muted py-5">目前沒有商品</div>';return}const o=t.map((e,r)=>{const s=e.id,i=I(e.name),a=re(e),c=O(e.totalAmount);B(e.updatedAt);const l=B(e.createdAt),d=(e.status??"listed").toLowerCase(),u=te[d]??te.pending,p=u.action==="等待買家確認收貨"?"disabled":"";return`
      <div class="col" data-id="${I(s)}">
        <div class="cardContainer h-100" style="animation-delay:${r*.07}s">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row justify-content-between align-items-start">
              <div style="flex:1;min-width:0;">
                <h6 class="mb-0 text-truncate" title="${i}" style="font-size:0.88rem;">${a}</h6>
                <div class="small text-muted mt-1 mb-2" style="font-size:12px;">建立日期：${l}</div>
              </div>
              <div class="d-flex flex-column align-items-end ms-2 flex-shrink-0">
                <span class="badge ${u.badge} mb-1">${u.text}</span>
                <div class="fw-bold">${c}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2 flex-wrap align-items-center">
              ${se(e,!0,s)??(e.status!=="canceled"&&u.action?`<button class="checkInfoBtn action-btn btn-card-action" data-id="${s}" data-action="${u.action}" ${p}>
                <img src="${u.icon}" alt="${u.action}icon"/>
                <div>${u.action}</div>
              </button>`:"")}
              <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${s}">
                <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
                <div>訂單詳情</div>
              </button>
              ${e.status=="pending"||e.status=="preparing"?`<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${s}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>`:""}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="text-muted" style="font-size:11px;">訂單編號 ${s}</div>
              ${e.status!=="canceled"?`<button class="order-chat-btn action-btn" data-action="contact" data-id="${s}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>`:""}
            </div>
          </div>
        </div>
      </div>
    `}).join("");n.innerHTML=o}function Ve(t=[]){const n=document.getElementById("buy-product");if(!n)return;if(!Array.isArray(t)||t.length===0){n.innerHTML='<div class="col-12 text-center text-muted py-5">目前沒有商品</div>';return}const o=t.map((e,r)=>{const s=e.id,i=I(e.name),a=re(e),c=O(e.totalAmount),l=B(e.createdAt),d=(e.status??"listed").toLowerCase(),u=ne[d]??ne.pending;return`
      <div class="col" data-id="${I(s)}">
        <div class="cardContainer h-100" style="animation-delay:${r*.07}s">
          <div class="card-body d-flex flex-column">
            <div class="d-flex flex-row justify-content-between align-items-start">
              <div style="flex:1;min-width:0;">
                <h6 class="mb-0 text-truncate" title="${i}" style="font-size:0.88rem;">${a}</h6>
                <div class="small text-muted mt-1 mb-2" style="font-size:12px;">建立日期：${l}</div>
              </div>
              <div class="d-flex flex-column align-items-end ms-2 flex-shrink-0">
                <span class="badge ${u.badge} mb-1">${u.text}</span>
                <div class="fw-bold">${c}</div>
              </div>
            </div>
            <div class="mt-auto d-flex gap-2 flex-wrap align-items-center">
              ${se(e,!1,s)??(e.status!=="canceled"&&u.action?`<button class="checkInfoBtn action-btn btn-card-action" data-id="${s}" data-action="${u.action}">
                <img src="${u.icon}" alt="${u.action}icon"/>
                <div>${u.action}</div>
              </button>`:"")}
              <button class="checkInfoBtn action-btn btn-row-action" data-action="checkInfo" data-id="${s}">
                <img src="../svg/orderInfo.svg" alt="訂單詳情icon"/>
                <div>訂單詳情</div>
              </button>
              ${e.status=="pending"||e.status=="preparing"?`<button class="cancelOrderBtn action-btn btn-row-action" data-action="cancel" data-id="${s}"><img src="../svg/cancelOrder.svg" alt="取消訂單icon"/><div>取消訂單</div></button>`:""}
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="text-muted" style="font-size:11px;">訂單編號 ${s}</div>
              ${e.status!=="canceled"?`<button class="order-chat-btn action-btn" data-action="contact" data-id="${s}" title="聯絡對方"><img src="../svg/canChat.svg" alt="聯絡對方"/></button>`:""}
            </div>
          </div>
        </div>
      </div>
    `}).join("");n.innerHTML=o}function We(t,n){return!Array.isArray(t)||t.length===0?'<div class="review-empty" style="padding:12px 0;">尚無評論</div>':t.map(o=>{var a,c,l;const r=o.role==="BUYER_TO_SELLER"?"買家 → 賣家":"賣家 → 買家",i=(Array.isArray(o==null?void 0:o.tags)?o.tags:[]).map(d=>`<span class="review-display-chip ${pe(d)?"positive":"negative"}">${ge(d)}</span>`).join("");return`
      <div class="review-card mt-2">
        <div class="review-card__header">
          <img src="${((a=o.reviewer)==null?void 0:a.photoURL)??"../image/default-avatar.webp"}" alt="${(c=o.reviewer)==null?void 0:c.name}" class="reviewer-avatar">
          <div class="review-card__meta">
            <span class="reviewerName">${((l=o.reviewer)==null?void 0:l.name)??"—"}</span>
            <span class="review-role-label">${r}</span>
          </div>
        </div>
        ${i?`<div class="review-card__chips">${i}</div>`:""}
        <div class="reviewText">${o.comment||'<span style="color:#aaa">（無文字評論）</span>'}</div>
      </div>`}).join("")}async function he(t){var n,o,e;try{const r=document.getElementById("sellProducts"),s=document.getElementById("buyProducts"),i=document.getElementById("sellOrderDetail"),a=document.getElementById("buyerOrderDetail"),c=!r.classList.contains("d-none"),l=c?document.getElementById("sellOrderInfo"):document.getElementById("buyerOrderInfo");l&&(l.innerHTML='<div class="d-flex justify-content-center py-5"><div class="spinner-border text-secondary" role="status"></div></div>');const u=(await f.getOrderDetails(t)).data.data;window.currentOrder=u;const p={pending:"訂單已建立，等待賣家接受",preparing:"賣家已接受訂單，正在準備商品",delivered:"賣家已出貨，等待買家確認收貨",review_pending:"買家已確認收貨，等待雙方評價",completed:"訂單已完成",canceled:"訂單已取消"},x={c2c:"面交取貨"},$=c?document.getElementById("sellOrderInfo"):document.getElementById("buyerOrderInfo"),m=u.reviewProgress??{},b=u.status==="review_pending"&&m.reviewDeadline?`<span style="font-size:0.8em;color:#e07b39;margin-left:4px;">（截止：${B(m.reviewDeadline)}）</span>`:"";if(Object.keys(P).length===0)try{const y=await f.getReviewTags();(((o=(n=y==null?void 0:y.data)==null?void 0:n.data)==null?void 0:o.tags)??[]).forEach(h=>{P[h.tag]=h.description??h.meaning,z[h.tag]=h.positive})}catch{}const v=(e=(await f.getOrderBothReviews(t)).data)==null?void 0:e.data;$.innerHTML=`
      <ul style="font-size: 1rem;">
        <li><span class="orderstyle">訂單編號</span>${t}</li>
        <li><span class="orderstyle">建立日期</span>${new Date(u.createdAt).toLocaleDateString()}</li>
        <li><span class="orderstyle">商品狀態</span>${p[u.status]??u.status}${b}</li>
        <li><span class="orderstyle">交貨方式</span>${x[u.type]}</li>
        <li>
          <span class="orderstyle">${c?"買家姓名":"賣家姓名"}</span>
          ${c?u.buyerUser.name:u.sellerUser.name}
        </li>
        <div class="d-flex gap-2">
          <button class="checkInfoBtn action-btn" data-action="contact" data-id="${t}" style="font-size: 1rem;">與對方聯絡<img src="../svg/canChat.svg" alt="與對方聯絡，開啟聊天室icon"/></button>
          <button class="checkInfoBtn action-btn" data-action="watchComment" data-id="${t}" style="font-size: 1rem;">查看對方評論<img src="../svg/reviewsIcon.svg" alt="查看對方評論icon" style="border-radius: 50%; width: 20px;"/></button>
        </div>
        <li style="text-align:end;">
          <span class="orderstyle">總計</span>
          <span style="font-weight:600;color:#004b97">
            ${u.totalAmount}
          </span> 元
        </li>
      </ul>
      <hr style="border:none;border-top:1px dashed #7bbfb9;margin:12px 0;">
      <span class="orderstyle">訂購商品</span>
      <table class="align-middle responsive-table mt-3 mb-3" style="border: none;">
        <thead>
          <tr>
            <th>商品編號</th>
            <th>商品照片</th>
            <th>名稱</th>
            <th>購買數量</th>
            <th>單價(元)</th>
          </tr>
        </thead>
        <tbody class="itemlist"></tbody>
      </table>
      <span class="orderstyle">此訂單評價</span>
      ${We((v==null?void 0:v.reviews)??[],c)}
    `;const w=$.querySelector(".itemlist"),g=u.orderItems;if(!Array.isArray(g)||g.length===0?w.innerHTML='<tr><td colspan="5">沒有商品資料</td></tr>':(w.innerHTML=g.map(y=>`
        <tr>
          <td data-label="商品編號">${y.itemId}</td>
          <td data-label="商品照片">
            <img src="${y.item.mainImage||"../image/placeholder.webp"}"
                 style="width:80px;height:80px;object-fit:cover;cursor:pointer;border-radius:6px;transition:opacity 0.2s;"
                 onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          </td>
          <td data-label="名稱">${R(y==null?void 0:y.item.name)}</td>
          <td data-label="購買數量">${y.quantity}</td>
          <td data-label="單價(元)">${y.price}</td>
        </tr>
      `).join(""),w.querySelectorAll('td[data-label="商品照片"] img').forEach(y=>{y.addEventListener("click",()=>{Swal.fire({imageUrl:y.src,imageAlt:"商品照片",showConfirmButton:!1,showCloseButton:!0,background:"#fff",width:"auto"})})})),Ge(u,c?i:a),!new URLSearchParams(window.location.search).get("orderId"))return;c?(document.getElementById("sellTable").style.display="none",i.classList.remove("d-none")):(document.getElementById("buyTable").style.display="none",a.classList.remove("d-none"))}catch(r){Swal.fire({title:"Oops",icon:"error",text:r.message||r})}}window.addEventListener("popstate",t=>{(!t.state||t.state.page!=="detail")&&Ye()});function Ye(){const t=new URL(window.location.href);t.searchParams.delete("orderId"),window.history.pushState({},"",t),T()}const J=new Intl.DateTimeFormat("zh-TW",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}),Ge=(t,n)=>{const o=t.logs||[],e=n.querySelectorAll(".status-item"),r=o.find(l=>l.status==="canceled"),s=o.find(l=>l.status==="completed"),i={pending:"訂單已建立<br>等待賣家接受",preparing:"賣家已接受訂單<br>正在準備商品",delivered:"賣家已出貨<br>等待買家確認收貨",review_pending:"買家已確認收貨<br>等待雙方評價",completed:"訂單已完成"},a={review_pending:"completed",completed:"scored"};e.forEach(l=>{const d=l.querySelector("img"),u=l.querySelector(".timestamp"),p=l.querySelector(".stateText"),x=l.dataset.status,$=a[x]??x;d.src=`../svg/${$}yet.svg`,u.innerText="",l.classList.remove("active"),l.style.display="",p&&(p.innerHTML=i[x])});let c=!1;e.forEach(l=>{const d=l.dataset.status,u=o.find(m=>m.status===d),p=l.querySelector("img"),x=l.querySelector(".timestamp"),$=l.querySelector(".stateText");r&&!s?u?(p.src=p.src.replace("yet.svg",".svg"),x.innerText=J.format(new Date(u.timestamp)),l.classList.add("active")):window.innerWidth<=991?c?l.style.display="none":(p.src="../svg/cancel.svg",x.innerText=J.format(new Date(r.timestamp)),$&&($.innerHTML="訂單已取消"),c=!0):(p.src="../svg/cancel.svg",x.innerText=J.format(new Date(r.timestamp)),$&&($.innerHTML="訂單已取消")):u&&(p.src=p.src.replace("yet.svg",".svg"),x.innerText=J.format(new Date(u.timestamp)),l.classList.add("active"))})};(()=>{let t=null,n=null,o=[],e=[],r=[];const s=5,i=5;let a=null;document.addEventListener("DOMContentLoaded",c);function c(){var v,w;if(a=l(),!a.modal||!a.form){console.error("[edit-modal] 缺少 Modal 必要節點 (#editDrawer / #editItemForm)");return}(v=a.image)==null||v.addEventListener("change",g=>{var h;const y=(h=g.target.files)==null?void 0:h[0];if(!y){x();return}n&&URL.revokeObjectURL(n),n=URL.createObjectURL(y),a.imagePreview.src=n,a.imagePreview.classList.remove("d-none")}),(w=a.imagesInput)==null||w.addEventListener("change",g=>{const y=Array.from(g.target.files||[]),h=[];for(const L of y){if(L.size/1048576>i){Swal.fire({icon:"warning",title:"檔案過大",text:`${L.name} 超過 ${i}MB`});continue}h.push(L)}e=h.slice(0,s),m(),E(),b()}),a.form.querySelectorAll('input[name="editCategoryRadio"]').forEach(g=>{g.addEventListener("change",()=>{a.category.value=g.value})}),a.form.querySelectorAll('input[name="editSizeRadio"]').forEach(g=>{g.addEventListener("change",()=>{a.size&&(a.size.value=g.value)})}),a.form.querySelectorAll('input[name="editConditionRadio"]').forEach(g=>{g.addEventListener("change",()=>{a.condition&&(a.condition.value=g.value)})}),a.modal.addEventListener("show.bs.modal",()=>document.body.classList.add("edit-modal-open")),a.modal.addEventListener("hidden.bs.modal",()=>{document.body.classList.remove("edit-modal-open"),x(),$()}),a.form.addEventListener("submit",async g=>{var A,S,ye,fe;if(g.preventDefault(),!t)return;const y=a.form.querySelector('button[type="submit"]');y&&(y.disabled=!0,y.dataset.orig=y.textContent,y.textContent="儲存中...");const h=new FormData;h.append("name",a.name.value.trim()),h.append("price",a.price.value),h.append("category",a.category.value),h.append("description",a.description.value),h.append("stock",a.stock.value),((A=a.size)==null?void 0:A.value)!==""&&h.append("size",a.size.value),((S=a.condition)==null?void 0:S.value)!==""&&h.append("new_or_old",a.condition.value);const L=(fe=(ye=a.image)==null?void 0:ye.files)==null?void 0:fe[0];L&&h.append("image",L),e.length>0&&e.forEach(k=>h.append("otherImages[]",k));try{const k={headers:{"Content-Type":"multipart/form-data"}};await f.updateMyItems(t,h,k),await Swal.fire({icon:"success",title:"已更新"}),typeof window.tryUpdateListDom=="function"&&window.tryUpdateListDom(t,{name:a.name.value.trim(),price:a.price.value}),u(),location.reload()}catch(k){console.error(k),Swal.fire({icon:"error",title:"更新失敗",text:String(k||"請稍後再試")})}finally{y&&(y.disabled=!1,y.textContent=y.dataset.orig||"儲存")}}),window.openEditDrawer=d,window.closeEditDrawer=u}function l(){return{modal:document.getElementById("editDrawer"),closeBtn:document.getElementById("editDrawerCloseBtn"),cancelBtn:document.getElementById("editDrawerCancelBtn"),form:document.getElementById("editItemForm"),id:document.getElementById("edit-id"),name:document.getElementById("edit-name"),price:document.getElementById("edit-price"),category:document.getElementById("edit-category"),stock:document.getElementById("edit-stock"),description:document.getElementById("edit-description"),size:document.getElementById("edit-size"),condition:document.getElementById("edit-condition"),image:document.getElementById("edit-image"),imagePreview:document.getElementById("edit-image-preview"),imagesInput:document.getElementById("edit-images"),imagesPreview:document.getElementById("edit-images-preview"),imagesHint:document.getElementById("edit-images-hint")}}async function d(v,w=null){t=v,a.id.value=v,a.form.reset(),x(),$();try{const g=await f.getItemsInfo(v),y=(g==null?void 0:g.data)??g??{};p(y)}catch(g){console.warn("讀取商品失敗，將以空白表單開啟",g)}bootstrap.Modal.getOrCreateInstance(a.modal).show(),a.modal.addEventListener("shown.bs.modal",()=>{var g;return(g=a.name)==null?void 0:g.focus()},{once:!0})}function u(){var v;(v=bootstrap.Modal.getInstance(a.modal))==null||v.hide()}function p(v){a.name.value=v.name??"",a.price.value=v.price??"",a.description.value=v.description??"",a.stock.value=v.stock??v.quantity??"",a.category.value=v.category??"",a.form.querySelectorAll('input[name="editCategoryRadio"]').forEach(h=>{h.checked=h.value===v.category});const w=String(v.size??"");a.size&&(a.size.value=w),a.form.querySelectorAll('input[name="editSizeRadio"]').forEach(h=>{h.checked=h.value===w});const g=String(v.newOrOld??v.new_or_old??"");a.condition&&(a.condition.value=g),a.form.querySelectorAll('input[name="editConditionRadio"]').forEach(h=>{h.checked=h.value===g});const y=v.mainImage||v.imageUrl||"";y?(a.imagePreview.src=y,a.imagePreview.classList.remove("d-none")):x(),o=Array.isArray(v.otherImages)?v.otherImages:Array.isArray(v.otherImageUrls)?v.otherImageUrls:Array.isArray(v.images)?v.images.slice(1):[],e=[],m(),b()}function x(){a.imagePreview.classList.add("d-none"),a.imagePreview.removeAttribute("src"),n&&(URL.revokeObjectURL(n),n=null)}function $(){r.forEach(v=>URL.revokeObjectURL(v)),r=[],o=[],e=[],a.imagesInput&&(a.imagesInput.value=""),a.imagesPreview&&(a.imagesPreview.innerHTML=""),b()}function m(){if(!a.imagesPreview)return;r.forEach(w=>URL.revokeObjectURL(w)),r=[],a.imagesPreview.innerHTML="",e.length>0?(e.forEach((w,g)=>{const y=URL.createObjectURL(w);r.push(y);const h=document.createElement("div");h.className="col-4",h.innerHTML=`
          <div class="thumb-card1">
            <span class="badge rounded-pill text-bg-primary thumb-badge">新</span>
            <button type="button" class="btn btn-sm btn-outline-danger thumb-remove" data-index="${g}">&times;</button>
            <img src="${y}" alt="${w.name}">
          </div>
        `,a.imagesPreview.appendChild(h)}),a.imagesPreview.querySelectorAll(".thumb-remove").forEach(w=>{w.addEventListener("click",()=>{const g=Number(w.getAttribute("data-index"));Number.isNaN(g)||(e.splice(g,1),m(),E(),b())})})):o.forEach(w=>{const g=document.createElement("div");g.className="col-4",g.innerHTML=`
          <div class="thumb-card1">
            <span class="badge rounded-pill text-bg-secondary thumb-badge">既有</span>
            <img src="${w}" alt="existing">
          </div>
        `,a.imagesPreview.appendChild(g)})}function b(){if(!a.imagesHint)return;const v=e.length>0?Math.min(e.length,s):o.length;a.imagesHint.textContent=`已選 ${v} / ${s}`}function E(){if(!a.imagesInput)return;const v=new DataTransfer;e.slice(0,s).forEach(w=>v.items.add(w)),a.imagesInput.files=v.files}})();function Ze(t,n){const o=new URL(window.location.href);o.searchParams.set("page",t),n?o.searchParams.set("scroll",n):o.searchParams.delete("scroll"),window.location.href=o.toString()}const Q=document.getElementById("change-password-btn");Q&&Q.addEventListener("click",async()=>{const t=document.getElementById("current-password").value,n=document.getElementById("new-password").value,o=document.getElementById("confirm-password").value;if(!t||!n||!o){Swal.fire({icon:"warning",title:"請填寫完整",text:"請輸入目前密碼與新密碼"});return}if(!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(n)){Swal.fire({icon:"warning",title:"密碼格式不符",text:"新密碼需至少 8 位，包含大寫、小寫字母及數字"});return}if(n!==o){Swal.fire({icon:"warning",title:"密碼不一致",text:"兩次輸入的新密碼不相同"});return}Q.disabled=!0;try{f=new M,await f.changePassword(t,n),document.getElementById("current-password").value="",document.getElementById("new-password").value="",document.getElementById("confirm-password").value="",await Swal.fire({icon:"success",title:"密碼已更新",text:"請使用新密碼重新登入",confirmButtonText:"確定"})}catch(r){Swal.fire({icon:"error",title:"修改失敗",text:r.message})}finally{Q.disabled=!1}});const xe=document.getElementById("disableAccountBtn");xe&&xe.addEventListener("click",async()=>{if((await Swal.fire({title:"確定要停用帳號嗎？",text:"停用後將無法登入，且資料將被刪除",icon:"warning",showCancelButton:!0,confirmButtonText:"是的，停用帳號",cancelButtonText:"取消"})).isConfirmed)try{await f.disableAccount(),Swal.fire({title:"帳號已停用",text:"您的帳號已成功停用，將被登出",icon:"success"}).then(()=>{f.logout().finally(()=>{window.location.href="/"})})}catch(n){console.error("停用帳號失敗:",n),Swal.fire({title:"錯誤",text:"停用帳號失敗，請稍後再試",icon:"error"})}});async function Ke(t){if(!t)return Swal.fire({icon:"warning",title:"缺少userid"});sessionStorage.setItem("chatroomReturnUrl",window.location.href),window.location.href=`../chatroom/chatroom.html?openChat=${t}`}async function Je(t,n,o){var p,x,$;const e=o==="buyer",r=e?"買家":"賣家";let s=(C||[]).find(m=>m.id==t),i=e?s==null?void 0:s.buyerUser:s==null?void 0:s.sellerUser;if(!(i!=null&&i.name))try{const m=await f.getOrderDetails(t),b=(p=m==null?void 0:m.data)==null?void 0:p.data;i=e?b==null?void 0:b.buyerUser:b==null?void 0:b.sellerUser}catch(m){console.warn("取得訂單詳情失敗，將以預設值顯示",m)}const a=(i==null?void 0:i.photoURL)||"../image/default-avatar.webp",c=(i==null?void 0:i.name)||r,l=(i==null?void 0:i.rate)??"-";let d=[];try{const m=await f.getReviewTags();d=(($=(x=m==null?void 0:m.data)==null?void 0:x.data)==null?void 0:$.tags)??[],d.forEach(b=>{P[b.tag]=b.description??b.meaning,z[b.tag]=b.positive})}catch(m){console.warn("取得評論標籤失敗",m)}const u=d.map(m=>`
    <label class="review-chip">
      <input type="checkbox" class="review-tag-check" data-key="${I(m.tag)}">
      <span>${I(m.meaning)}</span>
    </label>`).join("");Swal.fire({title:`評價${r}`,customClass:{htmlContainer:"swal-left-body"},html:`
      <div id="review-list">

        <!-- 被評者資訊 -->
        <div class="review-target-row">
          <img src="${a}" alt="${r}頭像" class="review-target-avatar"/>
          <div>
            <div class="review-target-name">${c}</div>
            <div class="review-target-credit">
              <i class="ti ti-shield-check" style="color:#004b97;"></i>
              信譽積分：<strong>${l}</strong>
            </div>
          </div>
        </div>

        <!-- 評價標籤 -->
        <div class="review-section-label">評價標籤 <span class="review-section-hint">（可複選）</span></div>
        <div class="review-chips-row">${u||'<span class="review-section-hint">無可用標籤</span>'}</div>

        <!-- 文字評價 -->
        <div class="review-section-label" style="margin-top:12px;">文字評價 <span class="review-section-hint">（選填）</span></div>
        <textarea id="review-comment" class="review-comment-input" rows="3" placeholder="留下文字評價..."></textarea>

        <!-- 匿名（僅買家評賣家才顯示） -->
        ${e?"":`
        <label class="review-anon-row">
          <input type="checkbox" id="review-anonymous">
          <span>匿名評價</span>
        </label>`}
      </div>
    `,showCancelButton:!0,confirmButtonText:"送出評價",cancelButtonText:"取消",width:560,preConfirm:async()=>{var v;const m=document.getElementById("review-comment").value.trim(),b=!e&&(((v=document.getElementById("review-anonymous"))==null?void 0:v.checked)??!1),E=[...document.querySelectorAll(".review-tag-check:checked")].map(w=>w.dataset.key.toUpperCase());try{const w=await f.postReview(t,{comment:m,isAnonymous:b,tags:E}),g=w==null?void 0:w.data;if(!(g!=null&&g.data))throw new Error((g==null?void 0:g.message)||"送出失敗");return{ok:!0,data:g}}catch(w){return{ok:!1,message:w.message||"評價送出失敗，請稍後再試"}}}}).then(async m=>{var b,E;m.isConfirmed&&((b=m.value)!=null&&b.ok?(await j("review"),window.location.reload()):Swal.fire({icon:"error",title:"送出失敗",text:((E=m.value)==null?void 0:E.message)||"評價送出失敗，請稍後再試",confirmButtonText:"確定"}))})}async function Qe(t,n){var m,b,E,v;const o=window.currentOrder,e=n?o==null?void 0:o.buyerUser:o==null?void 0:o.sellerUser,r=(e==null?void 0:e.name)||"對方",s=(e==null?void 0:e.photoURL)||"../image/default-avatar.webp",i=(e==null?void 0:e.rate)??"-",a=(e==null?void 0:e.intro)??(e==null?void 0:e.description)??"",c=(e==null?void 0:e.id)??(e==null?void 0:e.accountId);let l=null,d=null;try{const[w,g]=await Promise.all([f.getOrderBothReviews(t),c?f.getUserReviews(c):Promise.resolve(null)]),y=((b=(m=w==null?void 0:w.data)==null?void 0:m.data)==null?void 0:b.reviews)??[],h=n?"BUYER_TO_SELLER":"SELLER_TO_BUYER";l=y.find(L=>L.role===h)??null,d=((v=(E=g==null?void 0:g.data)==null?void 0:E.data)==null?void 0:v.stats)??null}catch{}const u=Number((d==null?void 0:d.reviewCount)??0),p=(d==null?void 0:d.accountScore)??"-",x=u>0?`<div style="font-size:12px;color:#555;margin-top:2px;">${u} 則評價 · 信譽積分 ${p}</div>`:'<div style="font-size:12px;color:#aaa;margin-top:2px;">尚無評價紀錄</div>';let $="";if(l){const g=(Array.isArray(l==null?void 0:l.tags)?l.tags:[]).map(y=>`<span class="review-display-chip ${pe(y)?"positive":"negative"}">${ge(y)}</span>`).join("");$=`
      ${g?`<div class="review-card__chips" style="margin:8px 0;">${g}</div>`:""}
      <div class="review-display-comment">${l.comment||'<span style="color:#aaa">（無文字評論）</span>'}</div>
    `}else $='<div class="review-display-empty">對方尚未留下評論</div>';Swal.fire({title:"對方評論",customClass:{htmlContainer:"swal-left-body"},html:`
      <div class="review-target-row">
        <img src="${s}" class="review-target-avatar reviewer-avatar--clickable" style="cursor:pointer;"
          data-reviewer-id="${c??""}" data-reviewer-name="${I(r)}" data-reviewer-photo="${I(s)}"
          alt="${r}頭像" title="查看 ${I(r)} 的評價">
        <div>
          <div class="review-target-name reviewer-avatar--clickable" style="cursor:pointer;text-decoration:underline dotted #abdad5;"
            data-reviewer-id="${c??""}" data-reviewer-name="${I(r)}" data-reviewer-photo="${I(s)}">${r}</div>
          <div class="review-target-credit">
            <i class="ti ti-star-filled" style="color:#f5a623;"></i>
            信譽積分：<strong>${i}</strong>
          </div>
          ${x}
          ${a?`<div style="font-size:12px;color:#888;margin-top:2px;">${a}</div>`:""}
        </div>
      </div>
      ${$}
    `,confirmButtonText:"關閉",width:500,didOpen:w=>ve(w)})}async function Ae(t=1){Be=t,f||(f=new M),document.querySelector("#products tbody").innerHTML='<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></td></tr>',document.getElementById("product-cards").innerHTML='<div class="col-12 text-center py-4"><div class="spinner-border spinner-border-sm text-secondary" role="status"></div></div>';try{const n=await f.getMyItems({page:t,limit:ie}),o=n==null?void 0:n.data;let e=[],r=0;Array.isArray(o)?(e=o,r=(n==null?void 0:n.total)??(n==null?void 0:n.count)??null):o&&typeof o=="object"&&(e=(o==null?void 0:o.commodities)??(o==null?void 0:o.data)??(o==null?void 0:o.items)??[],Array.isArray(e)||(e=[]),r=(o==null?void 0:o.total)??(o==null?void 0:o.count)??(n==null?void 0:n.total)??(n==null?void 0:n.count)??null);const s=r!==null?r:(t-1)*ie+e.length,i=Math.max(1,Math.ceil(s/ie));Ue(e),ze(e),Xe({totalPages:i,total:s,hasPrevPage:t>1,hasNextPage:t<i},t),C=e}catch(n){console.error(n)}}function Xe(t,n){const o=document.getElementById("products-pager");if(!o)return;if(!t||t.total===0){o.innerHTML="";return}const{totalPages:e,hasPrevPage:r,hasNextPage:s}=t;if(e<=1){o.innerHTML=`<span class="text-muted" style="font-size:0.82rem;">共 ${t.total} 件</span>`;return}let i=`<button class="pager-nav-btn" ${r?"":"disabled"} data-p="${n-1}">‹ 上一頁</button>`;for(let a=1;a<=e;a++)i+=`<button class="pager-nav-btn${a===n?" pager-nav-btn--active":""}" data-p="${a}">${a}</button>`;i+=`<button class="pager-nav-btn" ${s?"":"disabled"} data-p="${n+1}">下一頁 ›</button>`,o.innerHTML=i,o.querySelectorAll("button[data-p]").forEach(a=>{a.addEventListener("click",()=>{a.disabled||Ae(Number(a.dataset.p))})})}window.goToPage=Ze;const $e={fast_shipping:"出貨快速",great_packaging:"包裝完整保護良好",accurate_description:"描述與實物一致",quick_payment:"付款迅速",slow_shipping:"出貨延遲",poor_packaging:"包裝保護不足",misleading_description:"描述與實際不符",late_payment:"付款延遲",no_show:"未到場或無故失聯"},P={},z={};function ge(t){return t?P[t]?P[t]:$e[t]??$e[t.toLowerCase()]??t:""}function pe(t){if(!t)return!0;const n=z[t]??z[t.toLowerCase()];return n!==void 0?n:!0}function ve(t){t.addEventListener("click",n=>{if(n.target.closest("[data-report-review-id]")){const i=n.target.closest("[data-report-review-id]");et(i.dataset.reportReviewId,i.dataset.reportReviewerName,i.dataset.reportReviewerId);return}const o=n.target.closest("[data-reviewer-id]");if(!o)return;const e=o.dataset.reviewerId,r=o.dataset.reviewerName,s=o.dataset.reviewerPhoto;e&&tt(e,r,s)})}async function et(t,n,o){var a;let e=[];try{const c=await f.getReportCategories();e=((a=c==null?void 0:c.data)==null?void 0:a.categories)??[]}catch{}const r=e.map(c=>`<option value="${c.category}">${c.meaning}</option>`).join(""),{isConfirmed:s,value:i}=await Swal.fire({title:"檢舉評價",customClass:{popup:"report-form-popup"},html:`
      ${n?`<p class="report-form-target">檢舉對象：<strong>${n}</strong></p>`:""}
      <label class="report-form-label" for="report-category">檢舉類型 <span style="color:red">*</span></label>
      <select id="report-category" class="report-form-select">
        <option value="" disabled selected>請選擇檢舉類型</option>
        ${r}
      </select>
      <label class="report-form-label" for="report-subject">主旨 <span style="color:red">*</span></label>
      <input id="report-subject" class="report-form-input" placeholder="請輸入主旨（最多 120 字）" maxlength="120">
      <label class="report-form-label" for="report-detail">補充說明 <span class="report-form-optional">（選填，最多 1000 字）</span></label>
      <textarea id="report-detail" class="report-form-textarea" placeholder="請描述詳細情況" maxlength="1000"></textarea>
    `,showCancelButton:!0,confirmButtonText:"送出檢舉",cancelButtonText:"取消",focusConfirm:!1,preConfirm:()=>{const c=document.getElementById("report-category").value,l=document.getElementById("report-subject").value.trim(),d=document.getElementById("report-detail").value.trim();return c?l?{category:c,subject:l,detail:d}:(Swal.showValidationMessage("請填寫主旨"),!1):(Swal.showValidationMessage("請選擇檢舉類型"),!1)}});if(!(!s||!i))try{if(o){const c=new FormData;c.append("reportedUserId",o),c.append("category",i.category),c.append("subject",i.subject),i.detail&&c.append("detail",i.detail),await f.submitReport(c)}else await f.reportReview(t,{reason:i.category,subject:i.subject,detail:i.detail});Swal.fire({icon:"success",title:"檢舉已送出",text:"我們會盡快處理，謝謝你的回報。",timer:2e3,showConfirmButton:!1})}catch{Swal.fire({icon:"error",title:"送出失敗",text:"請稍後再試"})}}function ae(t,n){var p,x,$;const o=((p=t==null?void 0:t.reviewer)==null?void 0:p.name)??"評價者",e=((x=t==null?void 0:t.reviewer)==null?void 0:x.photoURL)??"../image/default-avatar.webp",r=(($=t==null?void 0:t.reviewer)==null?void 0:$.accountId)??"",s=(t==null?void 0:t.id)??"",i=t!=null&&t.createdAt?B(t.createdAt):"",a=t!=null&&t.commodityName?I(t.commodityName):"",c=n==="seller"?"賣":n==="buyer"?"買":"",l=n==="seller"?"reviewer-role-badge--seller":n==="buyer"?"reviewer-role-badge--buyer":"",u=(Array.isArray(t==null?void 0:t.tags)?t.tags:[]).map(m=>`<span class="review-display-chip ${pe(m)?"positive":"negative"}">${ge(m)}</span>`).join("");return`
    <div class="review-card">
      <div class="review-card__header">
        <div class="reviewer-avatar-wrap">
          <img src="${e}" alt="${o}" class="reviewer-avatar reviewer-avatar--clickable" data-reviewer-id="${r}" data-reviewer-name="${I(o)}" data-reviewer-photo="${I(e)}" title="查看 ${I(o)} 的評價">
          ${c?`<span class="reviewer-role-badge ${l}">${c}</span>`:""}
        </div>
        <div class="review-card__meta">
          <span class="reviewerName reviewer-avatar--clickable" data-reviewer-id="${r}" data-reviewer-name="${I(o)}" data-reviewer-photo="${I(e)}">${o}</span>
          ${a?`<span class="review-commodity-name">· ${a}</span>`:""}
        </div>
        <div class="review-card__actions">
          ${i?`<span class="reviewTime">${i}</span>`:""}
          ${s?`<button class="review-report-btn" data-report-review-id="${s}" data-report-reviewer-id="${r}" data-report-reviewer-name="${I(o)}" title="檢舉此評價"><i class="ti ti-flag"></i></button>`:""}
        </div>
      </div>
      ${u?`<div class="review-card__chips">${u}</div>`:""}
      ${t!=null&&t.comment?`<div class="reviewText">${I(t.comment)}</div>`:""}
    </div>`}async function tt(t,n,o){var p,x,$;let e=null,r=[],s=[],i="";try{const[m,b]=await Promise.all([f.getUserReviews(t),f.getPublicUserProfile(t).catch(()=>null)]),E=(p=m==null?void 0:m.data)==null?void 0:p.data;e=(E==null?void 0:E.stats)??null,r=(E==null?void 0:E.sellerReviews)??[],s=(E==null?void 0:E.buyerReviews)??[],i=(($=(x=b==null?void 0:b.data)==null?void 0:x.data)==null?void 0:$.introduction)??""}catch{}const a=Number((e==null?void 0:e.reviewCount)??0),c=(e==null?void 0:e.accountScore)??"-",l=a>0?`<div style="font-size:12px;color:#555;margin-top:2px;">${a} 則評價 · 信譽積分 ${c}</div>`:'<div style="font-size:12px;color:#aaa;margin-top:2px;">尚無評價紀錄</div>',d=[...r.map(m=>ae(m,"seller")),...s.map(m=>ae(m,"buyer"))].join(""),u=d?`<div class="review-list">${d}</div>`:'<div class="review-empty" style="margin-top:12px;">目前尚無評價紀錄</div>';Swal.fire({title:`${n} 的評價`,customClass:{htmlContainer:"swal-left-body"},html:`
      <div class="review-target-row">
        <img src="${o}" class="review-target-avatar" alt="${n}頭像">
        <div>
          <div class="review-target-name">${n}</div>
          ${l}
          ${i?`<div style="font-size:12px;color:#888;margin-top:4px;">${I(i)}</div>`:""}
        </div>
      </div>
      <div style="max-height:340px;overflow-y:auto;margin-top:8px;">${u}</div>
    `,confirmButtonText:"關閉",width:520,didOpen:m=>ve(m)})}async function nt(){var o,e,r,s,i;const t=document.getElementById("reviewsContainer");if(!t)return;const n=localStorage.getItem("uid");if(n)try{if(Object.keys(P).length===0)try{const m=await f.getReviewTags();(((e=(o=m==null?void 0:m.data)==null?void 0:o.data)==null?void 0:e.tags)??[]).forEach(b=>{P[b.tag]=b.description??b.meaning,z[b.tag]=b.positive})}catch{}const a=await f.getUserReviews(n),c=(r=a==null?void 0:a.data)==null?void 0:r.data;if(!c)return;const l=Number(((s=c==null?void 0:c.stats)==null?void 0:s.reviewCount)??0),d=((i=c==null?void 0:c.stats)==null?void 0:i.accountScore)??"-",u=(c==null?void 0:c.sellerReviews)??[],p=(c==null?void 0:c.buyerReviews)??[],x=u.length+p.length;if(l===0&&x===0){t.innerHTML=`
        <div class="review-empty">
          <i class="ti ti-message-circle review-empty-icon"></i>
          <div class="review-empty-title">目前還沒有評價</div>
          <div class="review-empty-sub">完成交易後，買賣雙方可互相留下評價</div>
        </div>`;return}const $=[...u.map(m=>ae(m,"seller")),...p.map(m=>ae(m,"buyer"))].join("");t.innerHTML=`
      <div class="my-review-stats">
        <div class="my-review-stat-item">
          <i class="ti ti-message-check my-review-stat-icon"></i>
          <span class="my-review-stat-value">${l}</span>
          <span class="my-review-stat-label">累積評價</span>
        </div>
        <div class="my-review-stat-divider"></div>
        <div class="my-review-stat-item">
          <i class="ti ti-shield-star my-review-stat-icon"></i>
          <span class="my-review-stat-value">${d}</span>
          <span class="my-review-stat-label">信譽積分</span>
        </div>
      </div>
      <div class="review-list">${$||'<div class="review-empty">目前還沒有評價</div>'}</div>`,ve(t)}catch{t.innerHTML='<div class="review-empty">載入失敗，請稍後再試</div>'}}const at={pending:{text:"審核中",cls:"badge bg-warning text-dark"},approved:{text:"已通過",cls:"badge bg-success"},rejected:{text:"已駁回",cls:"badge bg-secondary"}};async function ke(t=1){var e,r;const n=document.getElementById("myReportsList"),o=document.getElementById("myReportsPager");if(n){n.innerHTML='<div class="text-center text-muted py-4" style="font-size:14px;">載入中...</div>',o.innerHTML="";try{const s=await f.getMyReports({page:t,limit:10}),i=((e=s==null?void 0:s.data)==null?void 0:e.reports)??[],a=((r=s==null?void 0:s.data)==null?void 0:r.pagination)??{};if(!i.length){n.innerHTML=`
        <div class="review-empty">
          <i class="ti ti-flag-off review-empty-icon"></i>
          <div class="review-empty-title">尚未送出任何檢舉</div>
          <div class="review-empty-sub">在商品頁或評價旁點擊檢舉按鈕即可送出</div>
        </div>`;return}n.innerHTML=i.map(l=>{const d=at[l.status]??{text:l.status,cls:"badge bg-secondary"},u=l.createdAt?B(l.createdAt):"",p=l.reviewNote?`<div class="text-muted small mt-1">審核備註：${R(l.reviewNote)}</div>`:"";return`
        <div class="profile-info-card mb-2" style="padding:14px 16px;">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-1">
            <div>
              <span class="${d.cls}" style="font-size:0.75rem;">${d.text}</span>
              <span class="ms-2 fw-bold" style="font-size:0.95rem;">${R(l.subject??"")}</span>
            </div>
            <small class="text-muted">${u}</small>
          </div>
          <div class="text-muted small mt-1">類型：${R(l.category??"")}</div>
          ${l.detail?`<div class="text-muted small mt-1" style="white-space:pre-wrap;">${R(l.detail)}</div>`:""}
          ${p}
        </div>`}).join("");const c=a.totalPages??1;if(c>1){let l="";for(let d=1;d<=c;d++)l+=`<button class="btn btn-sm ${d===t?"btn-primary":"btn-outline-secondary"} mx-1" onclick="loadMyReports(${d})">${d}</button>`;o.innerHTML=l}}catch{n.innerHTML='<div class="review-empty">載入失敗，請稍後再試</div>'}}}window.loadMyReports=ke;
