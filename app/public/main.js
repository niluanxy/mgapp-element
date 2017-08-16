import MagicVue from "public/magic/build.js";
import ElementUI from 'element-ui';

MagicVue.hotfix(ElementUI);         // 框架打上适配补丁
MagicVue.Vue.use(ElementUI);        // 注册 ElementUI 框架
require("dist/assets/main.css");    // 全局公用样式文件加载

MagicVue.$mount("#mgapp", function() {
    var load = MagicVue.loadView, init = MagicVue.initView;

    require("component/mgAuth/index.js");       // 权限 Store

    require("component/mgHeader/index.js");     // 公用 header
    require("component/mgNavbar/index.js");     // 公用 navbar

    MagicVue.route({
        "/home": {
            title: "首页",
            on: load("home", function(defer, name) {
                require(["pages/home"], init(defer, name));
            }),
        },

        "/login": {
            title: "登陆",
            on: load("login", require("pages/login")),
        }
    }).init({
        home: "login",
    }, true);
});

export default MagicVue;
