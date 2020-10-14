
import * as YAML from "yaml"
import Vue from "vue"
import route from "route-parser"
import * as ao from "../util"

// console.log(route);

var env = {
    exit: "/exit",
    que: "/index",
    selected: [],
    answer: [],
    ending: false,
    tem: 0,
    filters: null
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
            env.answer.splice(env.answer.length - 1, 1);
            env.selected = message[env.que]
        }

        // 刷新恢复当前页面url
        // env.que = history.state != null ? history.state : env.que
        // env.selected = message[env.que]
        // history.state == null && history.pushState(env.que, "", env.que);
    }

    env.selected = message[env.que]
    // env.selected.actions != null && env.selected.actions.forEach(ac => {
    //     ac.select = false;
    // });
    env.selected.prompt != null && env.answer.push(...env.selected.prompt)
    history.replaceState(env.que, "", env.que);

    new Vue({
        el: "#app",
        data: { env, message },
        methods: {
            // button 选择后
            select(v) {
                // 清空输入框
                this.$refs.input.value = "";

                // 问答列表新增，history增加， 开启滚动
                env.que = v;
                this.add_answer(this.message[v]) 
                history.pushState(env.que, env.que, env.que)
            },
            // 索引 模糊查询
            filter_index() {
                let value = this.$refs.input.value
                if (value == "") {
                    env.filters = null;
                    return;
                };
                if (env.selected.actions != null) {
                    let d = env.selected.actions;
                    for (let i = 0; i < d.length; i++) {
                        if (d[i].title.indexOf(value) > -1) {
                            env.filters = this.message[d[i].target]
                            return;
                        }
                    }
                    if (!env.filters) all(this.message);
                } else {
                    all(this.message);
                }
                function all(d) {
                    for (let key in d) {
                        if (d[key].name.indexOf(value) > -1) {
                            env.filters = d[key]
                            return;
                        }
                    }
                    env.filters = null;
                }
            },
            // button 提交
            input_commit() {
                let value = this.$refs.input.value;
                if (value == "") return;
                if (env.filters != null) {
                    this.add_answer(env.filters) 
                    env.filters = null;
                } else {
                    // TODO 猜你喜欢
                    this.$refs.input.placeholder = "no result"
                }
                this.$refs.input.value = ""
            },
            // 问题列表新增
            add_answer(obj) {
                env.selected = obj 
                env.answer.push({ // 新增回答
                    type: "text",
                    msg: env.selected.name,
                    dir: "right"
                })
                env.answer.push(...env.selected.prompt) // 新增新问题
                if (env.selected.actions == null) { // 判断终点
                    env.selected = this.message[env.exit] 
                    env.answer.push(...env.selected.prompt)
                }
                env.ending = false;
            }
        },
        mounted() {
            // 手部滑动，问答列表滚动暂停
            this.$refs.oldlist.addEventListener("touchmove", function (e) {
                env.ending = true
            })
            ao.looperStart();
            ao.loop(() => {
                // 问答列表滚动
                if (!env.ending) {
                    env.tem = ao.ease(env.tem, this.$refs.oldlist.scrollHeight, 0.01, 0.1);
                    this.$refs.oldlist.scrollTop = ao.ease(this.$refs.oldlist.scrollTop, this.$refs.oldlist.scrollHeight, 0.01, 0.1);
                    if ((this.$refs.oldlist.scrollHeight - env.tem) < 2) {
                        env.ending = true;
                    }
                }
            })
        }
    })
}
