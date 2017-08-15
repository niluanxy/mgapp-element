import MagicVue from "MV_CORE/base/main.js";
import RootMagic from "MG_CORE/build.js";
import {isFunction} from "LIB_MINJS/check.js";
import Defer from "LIB_MINJS/promise.js";
import {toUpFirst} from "LIB_MINJS/utils.js";

import ConfigUI from "MV_UIKIT/base/config.js";
import {uiConfig} from "MG_UIKIT/base/tools.js";

var CFG = ConfigUI.timer = uiConfig({
    class: "timer",
    beforeClass: "timer-before",
    readyClass : "timer-ready",
    afterClass : "timer-after",
}, "beforeClass readyClass afterClass");

/**
 * 通过传入数据，构造一个新的时间对象
 * date 可为时间戳对象，时间字符串 "2015-12-4"
 */
function transData(data) {
    var ret = null, argv;

    if (typeof data == "number") {
        ret = new Date(data);
    } else if (data && typeof data == "string") {
        argv = data.replace(/[\-|\s|:|\/|\\]/g, ",");
        argv = argv.split(",");     // 转为数组格式

        for(var i=0; i<argv.length; i++) {
            argv[i] = parseInt(argv[i]);
        }

        ret = new Date(argv[0] || 0, (argv[1]-1) || 0, argv[2] || 0,
                        argv[3] || 0, argv[4] || 0, argv[5] || 0);
    } else if (data instanceof Date) {
        ret = data;
    }

    return ret;     // 返回 时间对象 或者 null
}

/* 时间格式化方法 */
function formatDate(time, format) {
    time = transData(time);
    format = format || "YYYY-MM-DD hh:mm:ss";

    var old = {
        "M+" : time.getMonth()+1,                 //月份
        "D+" : time.getDate(),                    //日
        "h+" : time.getHours(),                   //小时
        "m+" : time.getMinutes(),                 //分
        "s+" : time.getSeconds(),                 //秒
        "q+" : Math.floor((time.getMonth()+3)/3), //季度
        "S"  : time.getMilliseconds()             //毫秒
    };

    if(/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1,
            (time.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in old) {
        if(new RegExp("("+ k +")").test(format)) {
            format = format.replace(RegExp.$1,
                (RegExp.$1.length == 1) ? (old[k]) :
                    (("00" + old[k]).substr(("" + old[k]).length)));
        }
    }

    return format;
};

function computeTime(endDate) {
    var nowDate = new Date(),
        endDate = transData(endDate || 0),
        nowTime = nowDate.getTime(),
        endTime = endDate.getTime(), result = {};

    if (endTime && nowTime && endTime > nowTime) {
        var space = endTime - nowTime;

        endDate.setHours(0, 0, 0, 0);
        nowDate.setTime(endDate.getTime()+space);

        result = {
            d : parseInt(space/1000/60/60/24),
            h : nowDate.getHours(),
            m : nowDate.getMinutes(),
            s : nowDate.getSeconds(),
            ms: nowDate.getMilliseconds()
        }

        if (result.h < 10) result.h = '0'+result.h;
        if (result.m < 10) result.m = '0'+result.m;
        if (result.s < 10) result.s = '0'+result.s;
        result.ms = parseInt(result.ms/100);

        return result;
    } else {
        return null;
    }
}

MagicVue.transData = transData;
MagicVue.formatDate = formatDate;
MagicVue.computeTime = computeTime;

MagicVue.component("mgTimer", {
    name: "mg-timer",
    template: '<div><slot></slot></div>',

    props: {
        scope: {},
        start: {}, end: {},         // 123123124123 | 2016-09-12 12:00
        update: {default: "s"},     // m s ms

        change: {type: Function, default: null},
    },

    data: {
        currentType  : 0,
        currentBefore: null,
        currentReady : null,
        currentAfter : null,
    },

    methods: {
        transType: function(type, full) {
            var result, aType = type || this.currentType;

            switch (aType) {
                case 0:
                    result = "before"; break;
                case 1:
                    result = "ready"; break;
                default:
                    result = "after"; break;
            }

            if (full === true) {
                result = "current"+toUpFirst(result);
            }

            return result;
        },

        updateCall: function(remain) {
            var fixKey = this.transType(null, true);

            if (this[fixKey] && this[fixKey].update) {
                this[fixKey].update(remain || {});
            }
        },

        changeCall: function() {
            var type = this.transType();

            this.$emit("change", type, this.scope);
        },

        toggleChild: function(show, type) {
            type = type || this.currentType;
            var fixKey = this.transType(type, true);

            if (this[fixKey] && this[fixKey].toggle) {
                this[fixKey].toggle(!!show);
            }
        },

        refreshChild: function() {
            var start = transData(this.start),
                end = transData(this.end),
                now = (new Date()).getTime(), fixKey, result;

            if (start && start.getTime() > now) {
                this.currentType = 0;
                result = computeTime(start);
            } else if (end && end.getTime() > now) {
                this.currentType = 1;
                result = computeTime(end);
            } else {
                this.currentType = 2;
            }

            for(var i=0; i<3; i++) this.toggleChild(false, i);
            this.updateCall(result); this.toggleChild(true);
            this.changeCall();
        },

        initChildren: function() {
            var list = this.$children;

            for(var i=0; i<list.length; i++) {
                var type = toUpFirst(list[i].type),
                    testKey = "current"+type;

                if (this[testKey] !== undefined) {
                    this[testKey] = list[i];
                }
            }
        }
    },

    mounted: function() {
        var self = this, $el = RootMagic(self.$el),
            space, deferFinish = new Defer(),
            timeTask = [], taskPos = 0;

        if (self.start) timeTask.push(self.start);
        if (self.end)   timeTask.push(self.end);
        $el.addClass(CFG.class); self.initChildren();

        switch(self.update) {
            case "m":
                space = 1000*60; break;
            case "s":
                space = 1000; break;
            default :
                space = 100;
        }

        if (timeTask.length == 0) {
            self.currentType = 2;
            deferFinish.resolve();
        } else {
            self.refreshChild();
            if (self.currentType >= 2) {
                deferFinish.resolve();
            } else {
                taskPos = Math.max(taskPos, self.currentType);
                self.currentHandle = setInterval(function() {
                    var result = computeTime(timeTask[taskPos]);

                    if (result == null) {
                        if (taskPos < timeTask.length) {
                            taskPos += 1;
                            self.currentType += 1;
                            this.changeCall();
                        } else {
                            deferFinish.resolve();
                        }
                    } else {
                        self.updateCall(result);
                    }
                }, space);
            }
        }

        deferFinish.then(function() {
            clearInterval(self.currentHandle);

            for(var i=0; i<3; i++) self.toggleChild(false, i);
            self.currentType = 2; self.toggleChild(true, 2);
            this.changeCall();
        });
    },
});

MagicVue.component("mgTimerItem", {
    name: "mg-timer-item",
    template:
        '<div v-show="currentShow">'+
            '<slot :time="currentTime"></slot>'+
        '</div>',

    props: {
        type: {type: String, default: ""},          // before after
        call: {type: Function, default: null},
    },

    data: {
        currentShow: false,
        currentTime: {},
    },

    methods: {
        toggle: function(show) {
            if (show !== undefined) {
                this.currentShow = !!show;
            } else {
                this.currentShow = !this.currentShow;
            }
        },

        update: function(remain) {
            this.currentTime = remain;

            if (isFunction(this.call)) {
                this.call(remain, this.type);
            }
        },
    },

    mounted: function mounted() {
        var self = this, $el = RootMagic(self.$el);

        if (self.type == "before") {
            $el.addClass(CFG.beforeClass);
        } else if (self.type == "ready") {
            $el.addClass(CFG.readyClass);
        } else {
            $el.addClass(CFG.afterClass);
        }
    }
});
