import {each} from "LIB_MINJS/utils.js";

// 页面添加 events 属性，可以直接定义事件
export default function bindEvents(self) {
    var arrs = self.$options;

    if ((arrs = arrs["events"])) {
        each(arrs, function(key, callback) {
            self.$on(key, callback);
        });
    }
}
