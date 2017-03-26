import RootMagic from "MG_UIKIT/build.js";
import MagicVue from "MV_CORE/build.js";
import ConfigUI from "MV_UIKIT/base/config.js";

import "MV_UIKIT/page/main.js";
import "MV_UIKIT/router/main.js";

MagicVue.Magic = RootMagic;
MagicVue.config.ui = ConfigUI;

export default MagicVue;
