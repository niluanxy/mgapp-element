import MagicVue from "public/magic/build.js";

var AUTH = MagicVue.Store.AUTH;

MagicVue.component("mgHeader", {
    template: require("./template.html"),

    data: {
        pathList: ["用户管理", "新增用户"],
    },

    computed: {
        isLogin: MagicVue.mapState("login", "AUTH"),
    },

    mounted: function() {
        var that = this;

        window.setHeaderTitle = function(path) {
            that.pathList = path;
        }
    }
});

var com = MagicVue.component("mgHeader"); new com({el: "#mg-header"});
