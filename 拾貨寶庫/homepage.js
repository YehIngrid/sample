
// function init() {
//     const uni = document.querySelector(".uni");
//     let str = "";
//     data.forEach(function(item){
//         let content = `<a href="#"><img src=${item.imageURL}><h2>${item.name}</h2><p>${item.category}</p><p>${item.age}</p><p class="price">NT$ ${item.price}</p></a>`;
//         str += content;
//     })
//     uni.innerHTML = str;
// }
// init();
axios.post('http://localhost:3000')
    .then(function (response) {
        let ary = response.data;
        let str = "";
        const uni = document.querySelector(".uni");
        ary.forEach(function(ary){
            let content = `<a class="hvr-glow"><img src=${ary.imageURL}><h2>${ary.name}</h2><p>${ary.category}/${ary.age}</p><p class="price">NT$ ${ary.price}</p></a>`;
            str += content;
        })
        uni.innerHTML = str;
    });

// js array Map
// 1.能將原始陣列運算後，重新組合回傳一個新陣列。
// 2.不會改變原始陣列。

const arr=[1,5,10];
const newarr=arr.map(function(item){
    return item*item;
})
console.log(newarr);
console.log(arr);
