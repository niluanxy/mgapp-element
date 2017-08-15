import templayed from "LIB_MINJS/templayed.js";
import Defer from "LIB_MINJS/promise.js";
import {isTrueString} from "LIB_MINJS/check.js";
import emitterBase from "LIB_MINJS/emitter.js";
import {uuid as uuidBase} from "LIB_MINJS/utils.js";

export var emitter = emitterBase;

export function tpl(template, data) {
    if (isTrueString(template) && data) {
        return templayed(template)(data);
    } else {
        return "";
    }
}

export var defer = Defer;

export function random(min, max) {
    if (min && max && min != max) {
        return parseInt(Math.random()*(max-min+1)+min,10);
    } else {
        return (''+Math.random()).replace(/\D/g, '').replace(/^0*/, '');
    }
}

export var uuid = uuidBase;

export function time() {
    return new Date().getTime();
}

export function timeDate(date) {
    var ret = null, argv;

    if (typeof date == "number") {
        ret = new Date(date);
    } else if (date && typeof date == "string") {
        argv = date.replace(/[\-|\s|:|\/|\\]/g, ",");
        argv = argv.split(",");     // 转为数组格式

        for(var i=0; i<argv.length; i++) {
            argv[i] = parseInt(argv[i]);
        }

        ret = new Date(argv[0] || 0, (argv[1]-1) || 0, argv[2] || 0,
                        argv[3] || 0, argv[4] || 0, argv[5] || 0);
    } else if (date instanceof Date) {
        ret = date;
    }

    return ret;     // 返回 时间对象 或者 null
}

export function timeFormat(time, format) {
    if (typeof time == "number") time = timeDate(time);
    format = format || "YYYY-MM-DD hh:mm:ss";

    if (time != null) {
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
                    (RegExp.$1.length == 1) ? (("000"+old[k]).match(/\d{3}$/)[0]) :
                        (("00" + old[k]).substr(("" + old[k]).length)));
            }
        }

        return format;
    } else {
        return "";
    }
}
