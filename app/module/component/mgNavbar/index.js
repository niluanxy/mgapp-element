import MagicVue from "public/magic/build.js";

var AUTH = MagicVue.Store.AUTH;

MagicVue.component("mgNavbar", {
    template: require("./template.html"),

    data: {
        navList: [],
    },

    computed: {
        isLogin: MagicVue.mapState("login", "AUTH"),
    },
    
    methods: {
        getNavList: function() {
            this.navList = [
                {
                    label: "用户管理",
                    link : "#",
                    children: [
                        {label: "新增用户", link: "#"},
                        {label: "删除用户", link: "#"},
                    ]
                },
                {
                    label: "设备管理",
                    link : "#",
                    children: [
                        {label: "新增设备", link: "#"},
                        {label: "删除设备", link: "#"},
                    ]
                },
                {
                    label: "账单管理",
                    link : "#",
                    children: [
                        {label: "查询账单", link: "#"},
                        {label: "确认账单", link: "#"},
                    ]
                }
            ];
        },

        navSelect: function(menu, path) {
            $$.location.go(menu.link);
        },
    },

    mounted: function() {
        this.getNavList();
    },
});

var com = MagicVue.component("mgNavbar"); new com({el: "#mg-navbar"});
