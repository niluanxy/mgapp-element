import MagicVue from "MV_CORE/base/main.js";
import Config from "MV_CORE/base/config.js";

var KeyCFG = Config.key = {
    null  : "__KEY__NULL_v0.3.0",
    prefix: "",
}

export function key(aKey, aVal) {
    var val_fix, key_fix;

    key_fix = KeyCFG.prefix + aKey;

    if (aVal !== undefined) {
        val_fix = aVal === null ? KeyCFG.null : JSON.stringify(aVal);

        localStorage.setItem(key_fix, val_fix);
        return aVal; // 返回设置的值
    } else {
        val_fix = localStorage.getItem(key_fix);
        val_fix = JSON.parse(val_fix);

        return val_fix === $$.__key_null ? null : val_fix;
    }
} MagicVue.key = key;

export function keyRemove(aKey) {
    var key_fix = KeyCFG.prefix + key;
    localStorage.removeItem(key_fix);
} MagicVue.keyRemove = keyRemove;

export function keyClear() {
    localStorage.clear();
} MagicVue.keyClear = keyClear;


/**
 * 清除 getter 和 setter 方法，输出纯净信息
 * @param  {object} obj [要输出的对象]
 */
function logClear(child) {
    var ret = {}, type, ftype;

    ftype = typeof child;

    if (ftype == "string"  ||
        ftype == "number"  ||
        ftype == "boolean" ||
        child == null || child == NaN) {

        ret = child; // 值对象直接返回
    } else {
        if (child instanceof Array) {
            ret = [];
        }

        for(var key in child) {
            type = typeof child[key];

            if (type == "function") {
                break;
            } else if (type == "object") {
                ret[key] = logClear(child[key])
            } else {
                ret[key] = child[key];
            }
        }
    }

    return ret;
}

export function log(obj, call) {
    call = call ? call : "log";
    console[call](logClear(obj));
} MagicVue.log = log;
