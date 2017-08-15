import MagicVue from "MV_CORE/base/main.js";
import Vuex from "vuex";
import {extend} from "LIB_MINJS/utils.js";
import {isTrueString} from "LIB_MINJS/check.js";

MagicVue.Vuex = Vuex;
MagicVue.Vue.use(Vuex);

var oldCommit = Vuex.Store.prototype.commit;
Vuex.Store.prototype.commit = function(_type) {
    var pays = {}, args = [_type, pays];

    for(var i=1; i<arguments.length; i++) {
        pays[i-1] = arguments[i];
    }

    return oldCommit.apply(this, args);
}

var RootStore = MagicVue.Store = function(name, store) {
    if (!isTrueString(name)) {
        store = name; name = "";
    }

    var create = null;

    if (store) {
        for(var key in store.mutations) {
            (function(bindKey) {
                var mutions = store.mutations,
                    oldCall = mutions[bindKey];

                mutions[bindKey] = function(state, payload) {
                    var args = [state];

                    for(var key in payload) {
                        key = parseInt(key);
                        args[key+1] = payload[key];
                    }

                    oldCall.apply(null, args);
                }
            })(key);
        }

        for(var key in store.actions) {
            (function(bindKey) {
                var actions = store.actions,
                    oldCall = actions[bindKey];

                if (isTrueString(oldCall)) {
                    var _callName = oldCall;

                    actions[bindKey] = function(store) {
                        var args = [_callName];

                        for(var i=1; i<arguments.length; i++) {
                            args[i] = arguments[i];
                        }

                        store.commit.apply(store, args);
                    }
                }

                oldCall = actions[bindKey];
                actions[bindKey] = function(store, payload) {
                    var args = [store];

                    for(var key in payload) {
                        key = parseInt(key);
                        args[key+1] = payload[key];
                    }

                    return oldCall.apply(store, args);
                }
            })(key);
        }

        create = new Vuex.Store(store);
        if (name) RootStore[name] = create;

        for(var key in store.actions) {
            (function(bindKey) {
                var actionBind = store.actions[bindKey];

                create[bindKey] = function() {
                    var opts = {}, args = [bindKey, opts];

                    for(var i=0; i<arguments.length; i++) {
                        opts[i] = arguments[i];
                    }

                    return create.dispatch.apply(create, args);
                }
            })(key);
        }
    }

    return create;
}

MagicVue.mapState = function(key, store) {
    return function() {
        var $store = null;

        if (isTrueString(store)) {
            $store = RootStore[store];
        } else {
            $store = this.$store;
        }

        $store = $store || {state: {}};
        return $store.state[key];
    }
}

MagicVue.mapGetters = Vuex.mapGetters;
MagicVue.mapActions = Vuex.mapActions;
MagicVue.mapMutations = Vuex.mapMutations;

export default MagicVue.Store;
