
import * as YAML from "yaml"
import Vue from "vue"
import Route from "route-parser"
import * as ao from "../util"
import pinyin from "chinese-to-pinyin"
import template from "es6-template-strings";
import fuzzy from "fuzzy"

console.log(fuzzy);

window.fuzzy = fuzzy;
window.r = Route;
window.template = template;

var env = {
    exit: "/exit",
    que: "/index",
    selected: [],
    select: [],
    answer: [],
    ending: false,
    tem: 0,
    filters: [],
    filter_select: null,
    input_error: false, // 控制输入查找失败显示
    shade: false, // 控制阴影
    delay: 0.3, // 控制 整体delay
    keyboard: true, // 控制键盘缩放
    pinyins: [] // 拼音数组
}
window.env = env;

fetch("../assets/content/ctx.yaml")
    .then(v => v.text())
    .then(v => YAML.parse(v))
    .then(v => init(v))


function init(message) {
    console.log(message);

    // 默认事件配置
    {
        window.onpopstate = function (e) {
            env.que = e.state;
            env.answer.splice(env.answer.length - 1, 1);
            env.selected = env.select = message[env.que]
        }

        // 刷新恢复当前页面url
        // env.que = history.state != null ? history.state : env.que
        // env.selected = message[env.que]
        // history.state == null && history.pushState(env.que, "", env.que);
    }

    // TODO 中文拼音首字母查找。。。。 https://www.npmjs.com/package/fuzzy

    for (let key in message) {
        // 中文转换成拼音, 并存储到数组
        message[key].hasOwnProperty("name") && (message[key].pinyin = pinyin(message[key].name, { removeTone: true, removeSpace: true })) &&  env.pinyins.push(message[key].pinyin);
       
        // 遍历颜色和种类，分发到action上
        message[key].hasOwnProperty("actions") && message[key].actions.forEach(v => {
            v.color = message[v.target].color;
            v.kind = message[v.target].kind;
        })

        // 增加route
        message[key].route = new Route(key)
    }

    // 初始加载 - index
    env.selected = env.select = message[env.que]
    env.selected.hasOwnProperty("prompt") && env.selected.prompt.forEach((pro, i) => {
        pro.delay = env.delay
        env.delay += 0.3
    });
    env.selected.hasOwnProperty("prompt") && env.answer.push(...env.selected.prompt)
    history.replaceState(env.que, "", env.que);

    env.msg = message;
    new Vue({
        el: "#app",
        data: { env, message },
        methods: {
            // TODO 缩放键盘
            display_keyboard() {
                env.keyboard = false;
            },
            // TODO 右上角菜单，切换类型 / 猜你喜欢 
            cutType() {
                console.log("猜你喜欢");
            },
            // 模版解析
            ctx(v) {
                for (let url in this.message) {
                    if (this.message[url].route.match(v)) {
                        console.log(url, this.message[url].route.match(v));
                        if (url != v && this.message[v] != null && this.message[url].hasOwnProperty("prompt")) {
                            this.message[v].addlist = JSON.parse(JSON.stringify(this.message[url].prompt))
                            // TODO switch 需要兼容更多模版
                            this.message[v].addlist.forEach((pro, i) => {
                                pro.delay = 0
                                this.message[v].hasOwnProperty("name") && (pro.msg = template(pro.msg, { name: this.message[v].name }))
                            });
                        }
                        env.que = url;
                        if (!this.message[url].passThrough) break;
                    }
                }
            },
            // 选择答案
            select(v) {
                this.ctx(v);

                this.$refs.input.value = "";  // 清空输入框
                env.filters = [];  // 清空筛选器
                env.filter_select = null;

                // 清空历史记录
                // if(v == "/index") env.answer = [] 

                // 问答列表新增，history增加，开启滚动
                // env.que = v;
                this.add_answer(this.message[env.que])
                history.pushState(env.que, env.que, env.que)
            },
            // 索引 模糊查询
            filter_index() {
                let value = this.$refs.input.value.toLowerCase()
                if (value == "") {
                    env.filter_select = null;
                    env.filters = [];
                    return;
                }
                // 当前答案中查询
                if (env.selected.hasOwnProperty("actions")) {
                    env.filter_select = null;
                    let d = env.selected.actions;

                    // 汇总当前选项拼音 + name
                    let names = [];
                    d.forEach(v=>{
                        names.push(this.message[v.target].pinyin)
                        names.push(this.message[v.target].name)
                    })
                    console.log(names);

                    var results = fuzzy.filter('stq', names);
                    var matches = results.map(function(el) { return el.string; });
                    console.log(matches);



                    for (let i = 0; i < d.length; i++) {
                        if (d[i].title.indexOf(value) > -1 || this.message[d[i].target].pinyin.indexOf(value) > -1) {
                            env.filter_select = this.message[d[i].target]
                            return;
                        }
                    }
                    if (!env.filter_select) all(this.message);
                } else {
                    all(this.message);
                }
                // 全局查询
                function all(d) {
                    env.filter_select = null;
                    env.filters = [];
                    for (let key in d) {
                        if (d[key].hasOwnProperty("name") && (d[key].name.indexOf(value) > -1 || d[key].pinyin.indexOf(value) > -1)) {
                            env.filter_select == null && (env.filter_select = d[key])
                            env.filters.push({ key, ...d[key] })
                        }
                    }
                }
            },
            // 提交输入的答案
            input_commit() {
                let value = this.$refs.input.value.toLowerCase();
                if (value == "") return;
                if (env.filter_select != null) {
                    this.add_answer(env.filter_select)
                    env.filter_select = null;
                    env.filters = [];
                    this.$refs.input.value = ""
                } else {
                    // TODO 猜你喜欢
                    this.$refs.input.value = "No result"
                    env.input_error = true;
                    let _this = this;
                    setTimeout(function () {
                        _this.$refs.input.value = ""
                        env.input_error = false;
                    }, 2000)
                }
            },
            // 问题列表新增组合
            add_answer(obj) {
                env.delay = 0.3;
                env.selected = obj
                env.select = obj
                env.selected.hasOwnProperty("name") && env.answer.push({ // 新增回答
                    type: "text",
                    msg: env.selected.name,
                    dir: "right",
                    color: env.selected.color,
                    delay: env.delay
                })
                env.selected.hasOwnProperty("addlist") && env.selected.addlist.forEach((pro, i) => {
                    env.delay += 0.3;
                    pro.delay = env.delay
                });
                env.selected.hasOwnProperty("prompt") && env.selected.prompt.forEach((pro, i) => {
                    env.delay += 0.3;
                    pro.delay = env.delay
                });
                env.selected.hasOwnProperty("addlist") && env.answer.push(...env.selected.addlist) // 新增新问题
                env.selected.hasOwnProperty("prompt") && env.answer.push(...env.selected.prompt) // 新增新问题
                if (env.selected.actions == null) { // 判断终点
                    env.selected = this.message[env.exit]
                    env.selected.hasOwnProperty("prompt") && env.selected.prompt.forEach((pro, i) => {
                        env.delay += 0.3;
                        pro.delay = env.delay
                    });
                    env.selected.hasOwnProperty("prompt") && env.answer.push(...env.selected.prompt)
                }
                if (env.ending) this.$refs.answerlist.scrollTop = this.$refs.answerlist.scrollHeight + 100
                env.ending = false;
            },
            // 控制键盘移动
            keyboard_move(e) {
                let csslist = ["inputbox", "input", "input_btn", "tran", "keyboard"];
                let frag = false;
                for (let i = 0; i < csslist.length; i++) {
                    if (csslist[i] != e.target.classList[0]) {
                        frag = true
                    } else {
                        frag = false;
                        break;
                    }
                }
                env.keyboard = frag
            }
        },
        mounted() {

            // test
            window.sel = this.select

            // 控制键盘移动
            document.body.addEventListener("click", this.keyboard_move)
            document.body.addEventListener("touchstart", this.keyboard_move)

            // 手部滑动，问答列表滚动暂停
            this.$refs.answerlist.addEventListener("touchmove", function (e) {
                env.ending = true
            })
            window.addEventListener("mousewheel", function (e) {
                env.ending = true
            })
            ao.looperStart();
            ao.loop(() => {
                // 问答列表滚动
                if (!env.ending) {
                    env.tem = ao.ease(env.tem, this.$refs.answerlist.scrollHeight, 0.01, 0.1);
                    this.$refs.answerlist.scrollTop = ao.ease(this.$refs.answerlist.scrollTop, this.$refs.answerlist.scrollHeight, 0.01, 0.1);
                    if ((this.$refs.answerlist.scrollHeight - env.tem) < 200) {
                        env.ending = true;
                    }
                }

                // 控制头部阴影 - 溢出显示
                env.shade = this.$refs.answerlist.scrollTop > 0 ? true : false
            })
        }
    })
}


