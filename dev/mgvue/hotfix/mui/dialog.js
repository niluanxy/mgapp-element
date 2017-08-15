import {addMixins, findView} from "MV_HOTFIX/base/tools.js";

addMixins("Dialog", {
    mounted: function() {
        var that = this;

        that.$watch("visible", function(newVal) {
            var view = findView(that);

            for(var i=0; i<view.length; i++) {
                if (newVal == true) {
                    view[i].$emit("mgViewShow", view[i].$$params);
                } else {
                    view[i].$emit("mgViewHide", view[i].$$params);
                }
            }
        });
    }
});
