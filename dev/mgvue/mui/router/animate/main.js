import MagicVue from "MV_CORE/base/main.js";
import RootMagic from "MG_CORE/build.js";

import ConfigUI from "MV_UIKIT/base/config.js";

var CFG = ConfigUI.view = {
    hidden : "hidden",
    animate: "animate",
    display: "display",
};

MagicVue.on("mgViewChange.viewAnimate", function(viewGo, viewLast, routeType, routeGo, routeLast) {
    var $goView = RootMagic(viewGo.$$render), $laView;

    if (viewLast && viewLast.$$render && viewLast != viewGo) {
        $laView = RootMagic(viewLast.$$render);

        $goView.removeClass(CFG.hidden).addClass(CFG.display);
        $laView.removeClass(CFG.hidden+" "+CFG.display).addClass(CFG.hidden);
        if (viewLast && viewLast.$emit) viewLast.$emit("mgViewHide");
    } else {
        $goView.removeClass(CFG.hidden).addClass(CFG.display);
    }
});
