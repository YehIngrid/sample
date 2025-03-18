axios.get('https://hexschool.github.io/ajaxHomework/data.json')
  .then(function (response) {
    let ary = response.data;
    const title = document.querySelector(".title");
    title.textContent = ary[0].name;
  });


const account = document.querySelector('.account');
const password = document.querySelector('.password');
const send = document.querySelector(".send");

send.addEventListener("click", function(e){
    callSignUp();
})


function callSignUp(){
    // email: 'ingrid171171@gmail.com',
    //     password: '12345678'
    if (account.value == ""||password.value == ""){
        alert("請填寫正確資訊");
        return;
    }
    let obj = {};
    obj.email = account.value;
    obj.password = password.value;
    console.log(obj);
    
    // axios post 範例
    
    axios.post('https://escape-room.hexschool.io/api/user/signup', obj)
      .then(function (response) {
        if(response.data.message =="帳號註冊成功"){
            alert("恭喜帳號註冊成功");
        } else {
            alert("此帳號已被註冊");
        }
      })
      .catch(function (error) {
        console.log(error);
      });
}
// const list = document.querySelector(".list");
// function renderData(){
//     let str = '';
//     data.forEach(function(item,index){
//         str += `<li>${item.content}<input type="button" data-num="${index}" class="delete" value="刪除待辦"></li>`
//     })
//     const list = document.querySelector(".list");
//     list.innerHTML = str;    
// }
// list.addEventListener('click', function(e){
//     if (e.target.getAttribute('class')!=="delete"){
//         return;
//     }
//     let num = e.target.getAttribute('data-num');
//     data.splice(num,1);
//     renderData();
// })
// const txt = document.querySelector(".txt");
// const save = document.querySelector(".save");
// save.addEventListener("click", function(e){
//     let obj={};
//     obj.content = txt.value;
//     data.push(obj);
//     renderData();
//     txt.value="";
// })
// let data = [];

