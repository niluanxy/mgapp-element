import MagicVue from "PUBLIC/magic/build.js";
import ElementUI from 'element-ui';

MagicVue.Vue.use(ElementUI);    // 注册 ElementUI 框架

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
