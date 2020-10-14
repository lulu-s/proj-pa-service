
document.body.addEventListener('touchmove', function (e) {
    e.preventDefault(); //阻止默认的处理方式(阻止下拉滑动的效果)
}, { passive: false }); //passive 参数不能省略，用来兼容ios和android 

import * as YAML from "yaml"
import Vue from "vue"

var env = {
    que: "default",
    answer: null
}

fetch("./assets/content/ctx.yaml")
    .then(v => v.text())
    .then(v => YAML.parse(v))
    .then(v => init(v))


function init(v){
    console.log(v);
    let {issue, item} = v;

    env.answer = item[0].name == "default" ? item[0] : null

    new Vue({
        el: "#app",
        data: { env, issue, item },
        methods: {
            select(v){
                console.log(v);
                
                for(let i = 0; i < this.item.length; i++){
                    if(this.item[i].name == v){
                        this.env.que = this.item[i].type;
                        this.env.answer = this.item[i]
                    }
                }
            }
        }
    })
}