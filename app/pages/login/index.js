var $AUTH = $$.Store.AUTH;

module.exports = {
    style: require("./style.css"),
    template: require("./template.html"),

    data: {
        username: "admin",
        password: "x12345",
    },

    computed: {
        disLogin: function() {
            return !this.username || !this.password;
        }
    },

    methods: {
        login: function() {
            $AUTH.setLogin(true);
            $$.location.go("home");
        }
    },
}
