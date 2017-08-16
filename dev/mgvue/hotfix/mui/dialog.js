import MagicVue from "MV_CORE/build.js";
import {getName} from "MV_UIKIT/base/tools.js";
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

MagicVue.on("mgViewReady", function(scope, params) {
    var parent = scope.$parent, name = getName(parent);

    if (name == "ElDialog") {
        scope.$$defaultHide = !parent.visible;
    }
});
