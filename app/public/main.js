import MagicVue from "public/magic/build.js";
import ElementUI from 'element-ui';

MagicVue.hotfix(ElementUI);     // 框架打上适配补丁
MagicVue.Vue.use(ElementUI);    // 注册 ElementUI 框架
require("public/main.css");     // 全局公用样式文件加载

MagicVue.$mount("#mgapp", function() {
    var load = MagicVue.loadView, init = MagicVue.initView;

    MagicVue.route({
        "/home": {
            title: "首页测试",
            on: load("home", require("pages/home")),
        },
    }).init({
        home: "home",
    }, true);
});

export default MagicVue;
