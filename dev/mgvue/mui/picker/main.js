import MagicVue from "MV_CORE/base/main.js";
import RootMagic from "MG_CORE/build.js";
import Popup from "MG_UIKIT/popup/main.js";
import Picker from "MG_UIKIT/picker/main.js";

import ConfigUI from "MV_UIKIT/base/config.js";
import {uiConfig} from "MG_UIKIT/base/tools.js";
import {getVmScope} from "MV_CORE/base/tools.js";
import {value, tryBindCtrl, tryValueRead} from "MV_UIKIT/base/tools.js";

var CFG = ConfigUI.picker = uiConfig({
    class: "picker",
    bodyClass: "picker-body",
    itemClass: "picker-item",
});

MagicVue.component("mgPicker", {
    name: "mg-picker",
    template: '<div><slot></slot></div>',

    props: {
        data : {default: []},
        ctrl : {default: ""},
        snap : {default: 3},
        modal: {default: true},
        scroll:{default: true},
    },

    mounted: function() {
        var self = this, $el = RootMagic(self.$el),
            $ctrl, $modal, tmp, vmScope;

        vmScope = getVmScope(self);

        if ((tmp = $el.html()).match("{")) {
            tmp = tmp.replace(/{/g, "{{").replace(/}/g, "}}");
            $el.html("");               // 清空无用 DOM 元素
        } else {
            tmp = null;
        }

        $ctrl = new Picker($el, {
            snap  : value(self.snap),
            scroll: value(self.scroll),
            template: tmp,

            onSelect: function(value, select) {
                self.$emit("select", value, select);
            }
        }).init();

        tryBindCtrl(self, $ctrl);

        self.$watch("data", function(newVal) {
            $ctrl.data = newVal; $ctrl.render();
        });
    }
})
