import MagicVue from "MV_CORE/base/main.js";
import RootMagic from "MG_CORE/build.js";

import ConfigUI from "MV_UIKIT/base/config.js";
import {uiConfig, uiAddClass} from "MG_UIKIT/base/tools.js";
import {value, tryWatchCall, tryValueRead} from "MV_UIKIT/base/tools.js";

var CFG = ConfigUI.input = uiConfig({
    class: "input-group",
    clear: false,
});

MagicVue.component("mgInput", {
    name: "mg-input",
    template:
        '<div>'+
            '<i v-show="icon" :class="\'icon-\'+icon"></i>'+
            '<input :type="type" :disabled="currentDisabled" ' +
                ':value="currentValue" @input="handleInput" '+
                ':placeholder="placeholder" />'+
            '<i v-show="currentClear" class="clear"></i>'+
            '<slot></slot>'+
        '</div>',

    props: {
        placeholder: {},            // string
        clear: {},                  // boolean
        disabled: {},               // boolean
        icon: {},                   // string
        value: {},                  // @sync-input
        type: {default: "text"},    // "text" || "password" || "email"

        change: {},                 // function
    },

    data: {
        currentClear: "",
        currentValue: "",
        currentDisabled: false,
    },

    mounted: renderCall,
    updated: renderCall,

    methods: {
        handleInput: function(event) {
            var value = event.target.value;

            this.$emit("input", value);
            this.currentValue = value;
            this.$emit("change", value);
        }
    }
});

function renderCall() {
    var self = this, $el = RootMagic(self.$el);

    $el.addClass(CFG.class);

    self.currentClear = value(self.clear, CFG.clear);
    self.currentValue = self.value;

    self.currentDisabled = value(tryValueRead(self, "disabled"));
    tryWatchCall(self, "disabled", function(value) {
        self.currentDisabled = value;
    });

    $el.find(".clear").off("tap.clear").on("tap.clear", function() {
        self.$emit("input", "");
        self.currentValue = "";
    });
}
