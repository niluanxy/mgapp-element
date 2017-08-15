import MagicVue from "public/magic/build.js";

MagicVue.Store("AUTH", {
    state: {
        login: false,
        token: null,
    },

    mutations: {
        SET_LOGIN: function(state, stat) {
            state.login = !!stat;
        },

        SET_TOKEN: function(state, token) {
            state.token = token;
        }
    },

    actions: {
        setLogin: "SET_LOGIN",
        getLogin: function(store) {
            var state = store.state;

            return state.login;
        },

        setToken: "SET_TOKEN",
        getToken: function(store) {
            var state = store.state;

            return state.token;
        }
    }
});