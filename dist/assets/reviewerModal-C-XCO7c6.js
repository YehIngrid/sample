import{B as j}from"./default-DE5-m0YA.js";const f=new j,R={},_={},B="../webP/default-avatar.webp";function o(e){return e==null?"":String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function T(e){return R[e]??e}function k(e){if(!e)return!0;const s=_[e]??_[e.toLowerCase()];return s!==void 0?s:!0}async function E(){var e,s;if(!(Object.keys(R).length>0))try{const r=await f.getReviewTags();(((s=(e=r==null?void 0:r.data)==null?void 0:e.data)==null?void 0:s.tags)??[]).forEach(a=>{R[a.tag]=a.description??a.meaning,_[a.tag]=a.positive})}catch{}}function N(e,s){var y,b,w,h;const r=((y=e==null?void 0:e.reviewer)==null?void 0:y.name)??(e==null?void 0:e.reviewerName)??"評價者",a=((b=e==null?void 0:e.reviewer)==null?void 0:b.photoURL)??((w=e==null?void 0:e.reviewerUser)==null?void 0:w.photoURL)??B,n=((h=e==null?void 0:e.reviewer)==null?void 0:h.accountId)??"",c=(e==null?void 0:e.id)??"",d=e!=null&&e.createdAt?new Date(e.createdAt).toLocaleDateString("zh-TW"):"",i=(e==null?void 0:e.comment)??"",u=(e==null?void 0:e.commodityName)??"",t=Array.isArray(e==null?void 0:e.tags)?e.tags:[],g=s==="seller"?"賣":s==="buyer"?"買":"",v=s==="seller"?"reviewer-role-badge--seller":"reviewer-role-badge--buyer",$=t.map(C=>`<span class="review-display-chip ${k(C)?"positive":"negative"}">${o(T(C))}</span>`).join("");return`
    <div class="review-card">
      <div class="review-card__header">
        <div class="reviewer-avatar-wrap">
          <img src="${o(a)}" alt="${o(r)}" class="reviewer-avatar reviewer-avatar--clickable"
            data-reviewer-id="${n}" data-reviewer-name="${o(r)}" data-reviewer-photo="${o(a)}"
            title="查看 ${o(r)} 的評價">
          ${g?`<span class="reviewer-role-badge ${v}">${g}</span>`:""}
        </div>
        <div class="review-card__meta">
          <span class="reviewerName reviewer-avatar--clickable"
            data-reviewer-id="${n}" data-reviewer-name="${o(r)}" data-reviewer-photo="${o(a)}">${o(r)}</span>
          ${u?`<span class="review-commodity-name">· ${o(u)}</span>`:""}
        </div>
        <div class="review-card__actions">
          ${d?`<span class="reviewTime">${d}</span>`:""}
          ${c?`<button class="review-report-btn" data-report-review-id="${c}"
            data-report-reviewer-id="${n}" data-report-reviewer-name="${o(r)}"
            title="檢舉此評價"><i class="ti ti-flag"></i></button>`:""}
        </div>
      </div>
      ${$?`<div class="review-card__chips">${$}</div>`:""}
      ${i?`<div class="reviewText">${o(i)}</div>`:""}
    </div>`}async function U({title:e,targetLabel:s,userId:r,reviewId:a}){var u;let n=[];try{const t=await f.getReportCategories();n=((u=t==null?void 0:t.data)==null?void 0:u.categories)??[]}catch{}const c=n.map(t=>`<option value="${o(t.category)}">${o(t.meaning)}</option>`).join(""),{isConfirmed:d,value:i}=await Swal.fire({title:e,customClass:{popup:"report-form-popup"},html:`
      ${s?`<p class="report-form-target">檢舉對象：<strong>${o(s)}</strong></p>`:""}
      <label class="report-form-label" for="report-category">檢舉類型 <span style="color:red">*</span></label>
      <select id="report-category" class="report-form-select">
        <option value="" disabled selected>請選擇檢舉類型</option>
        ${c}
      </select>
      <label class="report-form-label" for="report-subject">主旨 <span style="color:red">*</span></label>
      <input id="report-subject" class="report-form-input" placeholder="請輸入主旨（最多 120 字）" maxlength="120">
      <label class="report-form-label" for="report-detail">補充說明 <span class="report-form-optional">（選填，最多 1000 字）</span></label>
      <textarea id="report-detail" class="report-form-textarea" placeholder="請描述詳細情況" maxlength="1000"></textarea>
    `,showCancelButton:!0,confirmButtonText:"送出檢舉",cancelButtonText:"取消",focusConfirm:!1,preConfirm:()=>{const t=document.getElementById("report-category").value,g=document.getElementById("report-subject").value.trim(),v=document.getElementById("report-detail").value.trim();return t?g?{category:t,subject:g,detail:v}:(Swal.showValidationMessage("請填寫主旨"),!1):(Swal.showValidationMessage("請選擇檢舉類型"),!1)}});if(!(!d||!i))try{if(r){const t=new FormData;t.append("reportedUserId",r),t.append("category",i.category),t.append("subject",i.subject),i.detail&&t.append("detail",i.detail),await f.submitReport(t)}else if(a){const t=new FormData;t.append("reviewId",a),t.append("category",i.category),t.append("subject",i.subject),i.detail&&t.append("detail",i.detail),await f.submitReport(t)}Swal.fire({icon:"success",title:"檢舉已送出",text:"我們會盡快處理，謝謝你的回報。",timer:2e3,showConfirmButton:!1})}catch{Swal.fire({icon:"error",title:"送出失敗",text:"請稍後再試"})}}function I(e){e.addEventListener("click",s=>{const r=s.target.closest("[data-report-review-id]");if(r){U({title:"檢舉評價",targetLabel:r.dataset.reportReviewerName,reviewId:r.dataset.reportReviewId,userId:null});return}const a=s.target.closest("[data-report-user-id]");if(a){U({title:"檢舉用戶",targetLabel:a.dataset.reportUserName,userId:a.dataset.reportUserId,reviewId:null});return}const n=s.target.closest("[data-reviewer-id]");if(!n)return;const c=n.dataset.reviewerId,d=n.dataset.reviewerName,i=n.dataset.reviewerPhoto;c&&A(c,d,i)})}async function A(e,s,r){var x,L;await E();let a=null,n=[],c=[],d="",i="NONE",u=0;try{const[p,S]=await Promise.all([f.getUserReviews(e),f.getPublicUserProfile(e).catch(()=>null)]),m=(x=p==null?void 0:p.data)==null?void 0:x.data,l=(L=S==null?void 0:S.data)==null?void 0:L.data;a=(m==null?void 0:m.stats)??null,n=(m==null?void 0:m.sellerReviews)??[],c=(m==null?void 0:m.buyerReviews)??[],d=(l==null?void 0:l.introduction)??"",i=(l==null?void 0:l.suspensionLevel)??"NONE",u=(l==null?void 0:l.lowScoreStrikeCount)??0,!r&&(l!=null&&l.photoURL)&&(r=l.photoURL)}catch{}const t=Number((a==null?void 0:a.reviewCount)??0),g=(a==null?void 0:a.accountScore)??"-",v=t>0?`${t} 則評價 · 信譽積分 ${g}`:"尚無評價紀錄",$=i&&i!=="NONE"?'<span class="rp-badge rp-badge--danger">可疑帳號</span>':"",y=u?`<span class="rp-badge rp-badge--warn">低分紀錄 ${u} 次</span>`:"",b=[...n.map(p=>N(p,"seller")),...c.map(p=>N(p,"buyer"))].join(""),w=b?`<div class="review-list">${b}</div>`:'<div class="review-empty rp-empty"><i class="ti ti-message-circle" style="font-size:1.8rem;display:block;margin-bottom:6px;opacity:0.4;"></i>目前尚無評價紀錄</div>',h=localStorage.getItem("uid"),C=e&&String(e)!==String(h)?`<button class="rp-report-btn" data-report-user-id="${e}" data-report-user-name="${o(s)}">
         <i class="ti ti-flag"></i>檢舉此用戶
       </button>`:"";Swal.fire({title:!1,customClass:{htmlContainer:"swal-left-body",popup:"rp-modal-popup"},html:`
      <div class="rp-profile">
        <img src="${o(r||B)}" class="rp-avatar" alt="${o(s)}頭像"
          onerror="this.src='${B}'">
        <div class="rp-info">
          <div class="rp-name">${o(s)}${$}${y}</div>
          <div class="rp-stats">${v}</div>
          ${d?`<div class="rp-intro">${o(d)}</div>`:""}
        </div>
        ${C}
      </div>
      <div class="rp-divider"></div>
      <div class="rp-reviews">${w}</div>
    `,confirmButtonText:"關閉",width:520,didOpen:p=>I(p)})}export{I as b,A as o};
