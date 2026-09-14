import{B as F}from"./default-Cq8rhwzI.js";import{A as N}from"./app-modal-qdw6XuZO.js";const $=new F,R={},S={},j="../webP/default-avatar.webp";function z(t){return t&&t.replace(/(\.(?:webp|jpe?g|png|gif))(\?|$)/i,"_big$1$2")}function a(t){return t==null?"":String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function V(t){return R[t]??t}function q(t){if(!t)return!0;const i=S[t]??S[t.toLowerCase()];return i!==void 0?i:!0}async function H(){var t,i;if(!(Object.keys(R).length>0))try{const r=await $.getReviewTags();(((i=(t=r==null?void 0:r.data)==null?void 0:t.data)==null?void 0:i.tags)??[]).forEach(s=>{R[s.tag]=s.description??s.meaning,S[s.tag]=s.positive})}catch{}}function E(t,i){var h,C,_,B;const r=((h=t==null?void 0:t.reviewer)==null?void 0:h.name)??(t==null?void 0:t.reviewerName)??"評價者",s=((C=t==null?void 0:t.reviewer)==null?void 0:C.photoURL)??((_=t==null?void 0:t.reviewerUser)==null?void 0:_.photoURL)??j,c=((B=t==null?void 0:t.reviewer)==null?void 0:B.accountId)??"",p=(t==null?void 0:t.id)??"",m=t!=null&&t.createdAt?new Date(t.createdAt).toLocaleDateString("zh-TW"):"",l=(t==null?void 0:t.comment)??"",g=(t==null?void 0:t.commodityName)??"",e=Array.isArray(t==null?void 0:t.tags)?t.tags:[],u=i==="seller"?"賣":i==="buyer"?"買":"",b=i==="seller"?"reviewer-role-badge--seller":"reviewer-role-badge--buyer",y=e.map(w=>`<span class="review-display-chip ${q(w)?"positive":"negative"}">${a(V(w))}</span>`).join("");return`
    <div class="review-card">
      <div class="review-card__header">
        <div class="reviewer-avatar-wrap">
          <img src="${a(s)}" alt="${a(r)}" class="reviewer-avatar reviewer-avatar--clickable"
            data-reviewer-id="${c}" data-reviewer-name="${a(r)}" data-reviewer-photo="${a(s)}"
            title="查看 ${a(r)} 的評價">
          ${u?`<span class="reviewer-role-badge ${b}">${u}</span>`:""}
        </div>
        <div class="review-card__meta">
          <span class="reviewerName reviewer-avatar--clickable"
            data-reviewer-id="${c}" data-reviewer-name="${a(r)}" data-reviewer-photo="${a(s)}">${a(r)}</span>
          ${g?`<span class="review-commodity-name">· ${a(g)}</span>`:""}
        </div>
        <div class="review-card__actions">
          ${m?`<span class="reviewTime">${m}</span>`:""}
          ${p?`<button class="review-report-btn" data-report-review-id="${p}"
            data-report-reviewer-id="${c}" data-report-reviewer-name="${a(r)}"
            title="檢舉此評價"><i class="ti ti-flag"></i></button>`:""}
        </div>
      </div>
      ${y?`<div class="review-card__chips">${y}</div>`:""}
      ${l?`<div class="reviewText">${a(l)}</div>`:""}
    </div>`}async function k({title:t,targetLabel:i,userId:r,reviewId:s}){var g;let c=[];try{const e=await $.getReportCategories();c=((g=e==null?void 0:e.data)==null?void 0:g.categories)??[]}catch{}const p=c.map(e=>`<option value="${a(e.category)}">${a(e.meaning)}</option>`).join(""),{isConfirmed:m,value:l}=await Swal.fire({title:t,customClass:{popup:"report-form-popup"},html:`
      ${i?`<p class="report-form-target">檢舉對象：<strong>${a(i)}</strong></p>`:""}
      <label class="report-form-label" for="report-category">檢舉類型 <span style="color:red">*</span></label>
      <select id="report-category" class="report-form-select">
        <option value="" disabled selected>請選擇檢舉類型</option>
        ${p}
      </select>
      <label class="report-form-label" for="report-subject">主旨 <span style="color:red">*</span></label>
      <input id="report-subject" class="report-form-input" placeholder="請輸入主旨（最多 120 字）" maxlength="120">
      <label class="report-form-label" for="report-detail">補充說明 <span class="report-form-optional">（選填，最多 1000 字）</span></label>
      <textarea id="report-detail" class="report-form-textarea" placeholder="請描述詳細情況" maxlength="1000"></textarea>
    `,showCancelButton:!0,confirmButtonText:"送出檢舉",cancelButtonText:"取消",focusConfirm:!1,preConfirm:()=>{const e=document.getElementById("report-category").value,u=document.getElementById("report-subject").value.trim(),b=document.getElementById("report-detail").value.trim();return e?u?{category:e,subject:u,detail:b}:(Swal.showValidationMessage("請填寫主旨"),!1):(Swal.showValidationMessage("請選擇檢舉類型"),!1)}});if(!(!m||!l))try{if(r){const e=new FormData;e.append("reportedUserId",r),e.append("category",l.category),e.append("subject",l.subject),l.detail&&e.append("detail",l.detail),await $.submitReport(e)}else if(s){const e=new FormData;e.append("reviewId",s),e.append("category",l.category),e.append("subject",l.subject),l.detail&&e.append("detail",l.detail),await $.submitReport(e)}N.fire({icon:"success",title:"檢舉已送出",text:"我們會盡快處理，謝謝你的回報。",timer:2e3,showConfirmButton:!1})}catch{N.fire({icon:"error",title:"送出失敗",text:"請稍後再試"})}}function W(t){t.addEventListener("click",i=>{const r=i.target.closest("[data-report-review-id]");if(r){k({title:"檢舉評價",targetLabel:r.dataset.reportReviewerName,reviewId:r.dataset.reportReviewId,userId:null});return}const s=i.target.closest("[data-report-user-id]");if(s){k({title:"檢舉用戶",targetLabel:s.dataset.reportUserName,userId:s.dataset.reportUserId,reviewId:null});return}const c=i.target.closest("[data-reviewer-id]");if(!c)return;const p=c.dataset.reviewerId,m=c.dataset.reviewerName,l=c.dataset.reviewerPhoto;p&&Y(p,m,l)})}async function Y(t,i,r){var L,T,U,x;await H();let s=null,c=[],p=[],m="",l="NONE",g=0,e="",u=[],b=null;try{const[n,f,v]=await Promise.all([$.getUserReviews(t),$.getPublicUserProfile(t).catch(()=>null),$.getUserCommodities(t).catch(()=>null)]),d=(L=n==null?void 0:n.data)==null?void 0:L.data,o=(T=f==null?void 0:f.data)==null?void 0:T.data;if(s=(d==null?void 0:d.stats)??null,c=(d==null?void 0:d.sellerReviews)??[],p=(d==null?void 0:d.buyerReviews)??[],m=(o==null?void 0:o.introduction)??"",l=(o==null?void 0:o.suspensionLevel)??"NONE",g=(o==null?void 0:o.lowScoreStrikeCount)??0,u=((x=(U=v==null?void 0:v.data)==null?void 0:U.data)==null?void 0:x.commodities)??[],b=Number.isFinite(+(o==null?void 0:o.rate))?+o.rate:null,o!=null&&o.createdAt){const A=new Date(o.createdAt);e=`${A.getFullYear()}年${A.getMonth()+1}月加入`}!r&&(o!=null&&o.photoURL)&&(r=o.photoURL)}catch{}const y=Number((s==null?void 0:s.reviewCount)??0),h=b??"-",C=y>0?`${y} 則評價 · 信譽積分 ${h}`:`信譽積分 ${h}`,_=l&&l!=="NONE"?'<span class="rp-badge rp-badge--danger">可疑帳號</span>':"",B=g?`<span class="rp-badge rp-badge--warn">低分紀錄 ${g} 次</span>`:"",w=[...c.map(n=>E(n,"seller")),...p.map(n=>E(n,"buyer"))].join(""),I=w?`<div class="review-list">${w}</div>`:'<div class="review-empty rp-empty"><i class="ti ti-message-circle" style="font-size:1.8rem;display:block;margin-bottom:6px;opacity:0.4;"></i>目前尚無評價紀錄</div>',D=u.map(n=>{const f=n.id??n._id??"",v=z(n.mainImage)||"",d=Number(n.stock)<=0;return`
      <div class="rp-commodity-card" data-product-id="${a(f)}">
        <div class="rp-commodity-thumb">
          ${v?`<img src="${a(v)}" alt="${a(n.name)}" onerror="this.parentElement.classList.add('rp-commodity-thumb--empty');this.remove();">`:""}
          ${d?'<span class="rp-commodity-sold">已售完</span>':""}
        </div>
        <div class="rp-commodity-name">${a(n.name??"未命名商品")}</div>
        <div class="rp-commodity-price">NT$ ${Number(n.price??0).toLocaleString("zh-TW")}</div>
      </div>`}).join(""),P=u.length?`<div class="rp-section-title">在售商品 · ${u.length}</div><div class="rp-commodities">${D}</div>`:"",M=localStorage.getItem("uid"),O=t&&String(t)!==String(M)?`<button class="rp-report-btn" data-report-user-id="${t}" data-report-user-name="${a(i)}">
         <i class="ti ti-flag"></i>檢舉此用戶
       </button>`:"";N.fire({title:!1,customClass:{htmlContainer:"swal-left-body",popup:"rp-modal-popup"},html:`
      <div class="rp-profile">
        <img src="${a(r||j)}" class="rp-avatar" alt="${a(i)}頭像"
          onerror="this.src='${j}'">
        <div class="rp-info">
          <div class="rp-name">${a(i)}${_}${B}</div>
          <div class="rp-stats">${C}${e?` · ${a(e)}`:""}</div>
          ${m?`<div class="rp-intro">${a(m)}</div>`:""}
        </div>
        ${O}
      </div>
      ${P}
      <div class="rp-divider"></div>
      <div class="rp-reviews">${I}</div>
    `,confirmButtonText:"關閉",width:520,didOpen:n=>{W(n),n.querySelectorAll("[data-product-id]").forEach(f=>{const v=f.dataset.productId;v&&f.addEventListener("click",()=>{location.href=`../product/product.html?id=${v}`})})}})}export{W as b,Y as o};
