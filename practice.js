let data = [
    {
        Charge:"免費",
        name:"葉潔頤充電站"
    },
    {
        Charge:"投幣式",
        name:"小花充電站"
    },
    {
        Charge:"投幣式",
        name:"小名充電站"
    },
    {
        Charge:"投幣式",
        name:"小王充電站"
    }
];
function init() {
    const list = document.querySelector(".list");
    let str = "";
    data.forEach(function(item,index){
    let content = `<li>${item.name}，${item.Charge}</li>`;
    str += content;
    })
    list.innerHTML = str;
}
init();

const filter = document.querySelector(".filter");
filter.addEventListener("click",function(e){
    if (e.target.value == "undefined"){
        return;
    }
    if (e.target.value == "全部"){
        init();
        return;
    }
    let str = "";
    data.forEach(function(item,index){
        let content = `<li>${item.name}，${item.Charge}</li>`;
        if(item.Charge == e.target.value) {
            str += content;
        }
    })
const list = document.querySelector(".list");
list.innerHTML = str;
})



const stationName = document.querySelector(".stationName");
const stationCharge = document.querySelector(".stationCharge");
const btn = document.querySelector(".btn");
btn.addEventListener("click", function(e){
    let obj = {};
    obj.Charge = stationCharge.value;
    obj.name = stationName.value;
    data.unshift(obj);
    init();
    stationCharge.value = "";
    stationName.value = "";
})