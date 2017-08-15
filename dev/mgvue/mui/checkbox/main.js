import MagicVue from "MV_CORE/base/main.js";
import RootMagic from "MG_CORE/build.js";
import {throttle} from "LIB_MINJS/utils.js";

import ConfigUI from "MV_UIKIT/base/config.js";
import ConfigMG from "MG_UIKIT/base/config.js";
import {uiConfig} from "MG_UIKIT/base/tools.js";
import {value} from "MV_UIKIT/base/tools.js";

var CFG = ConfigUI.checkbox = uiConfig({
    class: "checkbox",
    wrapClass: ConfigMG.prefix+"input-box",
    circleClass: "circle",
});

MagicVue.component("mgCheckbox", {
    name: "mg-checkbox",
    template:
        '<label @change="handleChange">'+
            '<input :disabled="currentDisabled" type="checkbox"/>'+
            '<span class="label"><slot></slot></span>'+
        '</label>',

    model: { prop: 'checked', event: 'change' },

    props: {
        "value"   : null,
        "checked" : null,
        "circle"  : false,
        "disabled": false,
        "scope"   : null,
    },

    data: {
        $checkHandle: null,
        currentValue: false,
        currentDisabled: false,
    },

    methods: {
        setValue: function(value) {
            if (value !== undefined) {
                value = !!value;

                this.syncModel(value);
                this.emitSwitch(value);
            }
        },

        emitSwitch: throttle(function(val) {
            var scope = this.scope,
                value = val || this.currentValue;

            this.$emit("switch", value, scope);
        }, 200),

        syncModel: function(value) {
            this.currentValue = value;
            this.$checkHandle.val(value);
            this.$emit("change", value);
        },

        handleChange: function(e) {
            var value = this.$checkHandle.val();

            this.setValue(value == "on");
        }
    },

    watch: {
        checked: function(newVal) {
            this.syncModel(newVal);
        }
    },

    mounted: function() {
        var self = this, $el = RootMagic(self.$el),
            addCls = CFG.wrapClass;

        if (value(self.circle)) addCls += " "+CFG.circleClass;

        $el.addClass(addCls);

        self.$checkHandle = $el.find("input");
        self.$checkHandle.addClass(CFG.class);

        self.syncModel(value(self.checked));
    }
});
