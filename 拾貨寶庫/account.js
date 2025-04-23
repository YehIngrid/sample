//TODO 當頁面載入完畢後隱藏 loader，顯示內容
window.onload = function() {
  var loader = document.getElementById('loader');
  var content = document.getElementById('whatcontent');
  if (loader && content) {
    loader.style.setProperty('display', 'none', 'important');
    content.style.setProperty('display', 'block', 'important');
  }
};

// DOMContentLoaded 事件：設定手機版搜尋功能
document.addEventListener('DOMContentLoaded', function() {
  const mobileSearchIcon = document.getElementById('mobileSearchIcon');
  const searchForm = document.getElementById('searchForm');
  
  if (mobileSearchIcon && searchForm) {
    mobileSearchIcon.addEventListener('click', function() {
      mobileSearchIcon.style.display = 'none';
      searchForm.style.display = 'flex';
      
      // 將游標自動移至搜尋輸入框
      const input = searchForm.querySelector('input');
      if (input) {
        input.focus();
      }
    });
  }
});


const signbtn = document.getElementById('sign');
signbtn.addEventListener('click', function(e){
  e.preventDefault();
  console.log("hi");
  callSignUp();
})
const signup = document.getElementById('signupLink');
const backlogin = document.getElementById('backlogin');
const signuppage = document.getElementById('signuppage');
const loginpage = document.getElementById('loginModal');
signup.addEventListener('click', function(e){

  if (signuppage && loginpage) {
    signuppage.style.setProperty('display', 'block', 'important');
    loginpage.style.setProperty('display', 'none', 'important');
  }
})
backlogin.addEventListener('click', function(e){
  if (signuppage && loginpage) {
    signuppage.style.setProperty('display', 'none', 'important');
    loginpage.style.setProperty('display', 'block', 'important');
  }
})

// 切換密碼顯示/隱藏（點擊眼睛圖示）
$("#checkEye").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#floatingPassword").attr('type', 'text');
  } else {
     $("#floatingPassword").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});
$("#checkEye1").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#password1").attr('type', 'text');
  } else {
     $("#password1").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});
$("#checkEye2").click(function () {
  if($(this).hasClass('fa-eye')){
     $("#password2").attr('type', 'text');
  } else {
     $("#password2").attr('type', 'password');
  }
  $(this).toggleClass('fa-eye').toggleClass('fa-eye-slash');
});

  function handleScroll() {
    const scrollY = window.scrollY;
    document.querySelectorAll('.parallax').forEach(el => {
      el.style.setProperty('--scroll', `${scrollY * 0.1}px`);
    });
  }
  window.addEventListener('scroll', handleScroll);

