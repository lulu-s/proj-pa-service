
import * as YAML from "yaml"
import Vue from "vue"

var env = {
    que: "/index",
    answer: null,
    old_answer: [],

}
window.env = env;

fetch("../assets/content/ctx.yaml")
    .then(v => v.text())
    .then(v => YAML.parse(v))
    .then(v => init(v))


function init(message) {

    // 默认事件配置
    {
        window.onpopstate = function (e) {
            env.que = e.state;
            env.old_answer.splice(env.old_answer.length - 1, 1);
            env.answer = message[env.que]
        }

        document.body.addEventListener('touchmove', function (e) {
            e.preventDefault(); //阻止默认的处理方式(阻止下拉滑动的效果)
        }, { passive: false }); //passive 参数不能省略，用来兼容ios和android 
    }

    env.que = history.state != null ? history.state : env.que
    env.answer = message[env.que]
    history.state == null && history.pushState(env.que, "", env.que);

    new Vue({
        el: "#app",
        data: { env, message },
        methods: {
            select(v) {
                this.env.que = v;
                this.env.old_answer.push(...this.env.answer.prompt)
                this.env.old_answer.push({
                    type: "text",
                    msg: this.env.answer.name,
                    dir: "right"
                })
                this.env.answer = this.message[v]
                history.pushState(this.env.que, this.env.que, this.env.que)
            }
        },
        mounted(){ }
    })


}