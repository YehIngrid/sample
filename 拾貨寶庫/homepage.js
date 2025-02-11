let data = [
    {
        image:
        merName:"中興國文課本第五版",
        state:"全新",
        sort:"教科書",
        price:"300"
    },
    {
        image:
        merName:"中興鵝娃娃",
        state:"第五年、有黃漬",
        sort:"宿舍用品",
        price:"150"
    },
    {
        image:
        merName:"中興紀念棒球外套",
        state:"只穿過一次",
        sort:"宿舍用品",
        price:"1000"
    },
    {
        merName:"二手長褲",
        state:"全新",
        sort:"宿舍用品",
        price:"600"
    },
];

function init() {
    const uni = document.querySelectorAll(".uni");
    let str = "";
    data.forEach(function(item,index){
        let content = ``;
        str += content;
    })
    uni.innerHTML = str;
}