import MagicVue from "MV_CORE/base/main.js";
import {extend, element} from "LIB_MINJS/utils.js";
import {getValue} from "MV_CORE/base/tools.js";
import {uuid} from "MG_STATIC/utils/main.js";
import {isFunction, isObject, isTrueString,
    isElement, isArray} from "LIB_MINJS/check.js";

import * as Cache from "MV_CORE/utils/cache.js";
import bindEvents from "MV_CORE/utils/event.js";
import ConfigMG from "MG_UIKIT/base/config.js";
import {tryBindCtrl} from "MV_UIKIT/base/tools.js";

var viewMixins, $CACHE_SHOW = null,
    RootVue = MagicVue.RootVue, RootEmitter = MagicVue.RootEmitter;

export function nameTrans(name, tag) {
    var ret = "ma-"+name;

    ret = ret.replace(/[\-|\\|\/]/g, "-");

    return tag ? "<"+ret+"></"+ret+">" : ret;
}

function createWraper(dom) {
    var $wrap = element(dom);

    if (!isElement($wrap)) {
        $wrap = document.createElement("div");
        $wrap.innerHTML = "<div></div><div></div>";
        $wrap.className = ConfigMG.prefix+"view";

        MagicVue.$root.appendChild($wrap);

        MagicVue.emit("mgWrapCreated", $wrap);
        return $wrap.childNodes[0];
    } else {
        return $wrap;
    }
}

function createEmitBind(hash, type) {
    return function(eve /* args... */) {
        var args = extend([], arguments);

        args[0] = createEmitName(hash, eve);
        RootEmitter[type].apply(RootEmitter, args);
    }
}

function createEmitName(hash, eve) {
    return hash+"_"+eve;
}

function viewEmitInit(hash, $render) {
    $render.$$on   = createEmitBind(hash, "on");
    $render.$$once = createEmitBind(hash, "once");
    $render.$$off  = createEmitBind(hash, "off");

    return $render;
}

function viewEmitCall($scope, eve /* args... */) {
    var $opt = $scope.$options, hash, args;

    if ((hash = $scope.$$hash)) {
        args = extend([], arguments);
        eve  = createEmitName(hash, eve);
        args.splice(1, 1); args.unshift(eve);

        RootEmitter.emit.apply(RootEmitter, args);
    }
}

export function renderView(name, params, $wrap) {
    if (!name.match(/^ma/)) name = nameTrans(name);

    var com = MagicVue.component(name), $parent,
        $render, $wraper = createWraper($wrap),
        hash = name+"_"+uuid();

    if ($wraper != $wrap && $wraper.parentNode) {
        $parent = $wraper.parentNode;
        $parent.setAttribute("view", name);
    }

    $render = new com({
        el: $wraper, name: name,

        $$hash: hash,
        $$render: $parent,
        $$params: params || {}
    });

    // 保存到返回对象上，用于同步插件调用
    $render.$$render = $parent;
    $render.$$hash   = hash;
    $render.$$name   = name;
    $render.$$params = params || {};

    // 保存到渲染元素上，用于异步组件获取参数
    $wraper.$$hash   = hash;
    $wraper.$$name   = name;
    $wraper.$$render = $parent;
    $wraper.$$params = params || {};

    return viewEmitInit(hash, $render);
}

/**========================================================
 * view 对象核心扩展属性
 * ======================================================== */
function viewFactory(view) {
    var oldData = view.data, mixins;

    if (!isFunction(oldData)) {
        view.data = function() {
            return extend(true, {}, oldData);
        }
    }

    if (!view.props) {
        view.props = ["params", "viewCtrl"];
    } else if (isArray(view.props)) {
        view.props = view.props.concat(["params", "viewCtrl"]);
    } else if (typeof view.props == "object") {
        view.props.params = {default: null};
        view.props.viewCtrl = {default: null};
    }

    if (isArray(view.mixins)) {
        view.mixins.push(viewMixins);
    } else {
        view.mixins = [viewMixins];
    }

    return view;
}

function viewParentFix(vueView) {
    var find = vueView.$el.parentNode, $parent;

    vueView.$el.$$scope = vueView;

    do {
        if (find && find.$$scope) {
            $parent = find.$$scope; break;
        }

        find = find.parentNode;
    } while(find && find != MagicVue.$root);

    if (!$parent) $parent = MagicVue.RootVue;
    vueView.$parent = $parent;
}

viewMixins = {
    created: function() {
        var self = this, $opt = self.$options, $el = $opt.el;

        // 尝试恢复 view 模式组件的渲染参数
        self.$$hash   = $opt.$$hash || ($el ? $el.$$hash : "");
        self.$$name   = $opt.$$name || ($el ? $el.$$name : $opt._componentTag);
        self.$$render = $opt.$$render || ($el ? $el.$$render : null);

        if (self.params !== undefined) {
            var params = self.params, value;

            if (isTrueString(params)) {
                value = getValue(self.$parent, params) || {};
            } else {
                value = params || {};
            }

            self.$$params = extend(true, {}, value);
        } else {
            var params = $el ? $el.$$params : $opt.$$params;
            self.$$params = extend(true, {}, self.params || params);
        }

        if (self.$$render && self.$$render.parentNode == MagicVue.$root) {
            self.$$viewMode = "view";
        } else {
            self.$$viewMode = "modal";
            self.$$defaultHide = true;
        }

        bindEvents(self);
        self.$emit("mgViewCreated");

        // 尝试调用页面回调事件
        viewEmitCall(self, "created");
    },

    mounted: function() {
        var self = this, $opt = self.$options;

        if ($opt.style && $opt.style.page) {
            if (self.$$render) {
                self.$$render.classList.add($opt.style.page);
            } else {
                self.$el.classList.add($opt.style.page);
            }
        }

        if (self.viewMode == "view") viewParentFix(self);
        self.$emit("mgViewReady", self.$$params);

        if (isTrueString(self.viewCtrl)) {
            tryBindCtrl(self, self, "viewCtrl");
        }

        // 尝试调用页面回调事件
        viewEmitCall(self, "ready");

        // 保证 mgViewMounted 事件在 mgViewChange 后执行
        setTimeout(function() {
            MagicVue.emit("mgViewMounted", self, self.$$params);
        });

        // 默认不是隐藏的页面，则立即触发 显示回调事件
        if (!self.$$defaultHide) {
            self.$emit("mgViewShow", self.$$params);
        } else {
            self.$emit("mgViewHide", self.$$params);
        }
    },

    beforeDestroy: function() {
        var self = this;

        self.$emit("mgViewHide", self.$$params);
        self.$emit("mgViewDestory");
    },
};


/**========================================================
 * 异步组件加载方法，根据 Vue 和 Webpack 的要求
 * 结合两者，具体原理链接如下：
 *
 * https://cn.vuejs.org/v2/guide/components.html#异步组件
 * ======================================================== */
export function initView(resolve, name) {
    return function(view) {
        var fixView = viewFactory(view), fixName;

        fixName = isObject(resolve) ? resolve.name : name;
        fixName && MagicVue.component(fixName, fixView);

        if (resolve && resolve.el) {
            var component = MagicVue.component(fixName);
            new component({el: resolve.el, name: fixName});
        } else {
            resolve(fixView);
        }
    }
}

/**========================================================
 * 页面注册函数，注册到全局对象中
 * ======================================================== */
export function loadView(viewName, bindView) {
    var bindName = nameTrans(viewName), fixBind;

    // 若为对象，说明为同步加载页面，则调用 工厂函数 进行包装
    if (typeof bindView == "object") {
        fixBind = viewFactory(bindView);
    } else {
        fixBind = function(resolve) {
            bindView(resolve, bindName);
        };
    }

    MagicVue.component(bindName, fixBind);

    return function(url, routeType, routeGo, routeLast) {
        var goParams = extend(true, {}, routeGo.params),
            $viewGo, $viewLast, $cache, $del;

        // 尝试从缓存中获取页面对象
        if ($viewGo = Cache.findView(bindName)) {
            $cache = $viewGo;
            $viewGo = $viewGo.scope;

            $viewGo.$$params = goParams;
            $viewGo.$emit("mgViewShow", goParams);
        } else {
            $viewGo = renderView(bindName, goParams);
            $cache = {id: bindName, el: $viewGo.$$render, scope: $viewGo};
            $del = Cache.pushView($cache, $CACHE_SHOW ? $CACHE_SHOW.id : null);

            // 如果为异步组件，则需要在组件创建后更新 scope 对象
            if (!($viewGo instanceof MagicVue.Vue)) {
                $viewGo.$$once("created", function(scope) {
                    $cache.scope = scope;
                });
            }

            // 如果有溢出页面返回，执行页面销毁动作
            if ($del && $del.id && $del.scope && $del.el) {
                $del.scope.$destroy();
            }
        }

        $viewLast = $CACHE_SHOW ? $CACHE_SHOW.scope : null;
        $CACHE_SHOW = $cache;   // 更新页面缓存对象，用于下次访问使用

        MagicVue.emit("mgViewChange", $viewGo, $viewLast, routeType, routeGo, routeLast);
    }
}

MagicVue.viewFactory = viewFactory;
MagicVue.renderView = renderView;
MagicVue.initView = initView;
MagicVue.loadView = loadView;
