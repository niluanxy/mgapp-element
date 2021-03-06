var moment      = require("moment"),
    path        = require("path"),
    ip          = require("ip"),
    Q           = require("q"),
    portscanner = require('portscanner');


var DIR_BASE   = path.resolve(__dirname, "../")+"/",
    CONCAT_PRE = "_concat_";

var DIR = {
    BASE: DIR_BASE,
    TASK: DIR_BASE+"task/",

    APP : DIR_BASE + "app/",
    DEV : DIR_BASE + "dev/",

    MIXIN: DIR_BASE + "dev/mixin/",
    MINJS: DIR_BASE + "dev/minjs/",
    MAGIC: DIR_BASE + "dev/magic/",
    MGVUE: DIR_BASE + "dev/mgvue/",

    CONCAT: DIR_BASE + "dev/concat/",

    APP_PUBLIC: DIR_BASE + "app/public/",
    APP_ASSETS: DIR_BASE + "app/assets/",
    APP_MODULE: DIR_BASE + "app/module/",

    APP_DIST: DIR_BASE + "dist/",
};

var CONCAT = {
    MIXIN_CORE : CONCAT_PRE + "mixin-core.scss",
    MIXIN_VARS : CONCAT_PRE + "mixin-vars.scss",
    MIXIN_UIKIT: CONCAT_PRE + "minix-uikit.scss",
    MIXIN_BUILD: "mixin.scss",

    MAGIC_BASE : CONCAT_PRE + "magic.js",
    MAGIC_UIKIT: CONCAT_PRE + "magic.ui.js",

    MGVUE_STYLE_VARS : CONCAT_PRE + "mgvue-vars.scss",
    MGVUE_STYLE_UIKIT: CONCAT_PRE + "mgvue-uikit.scss",
    MGVUE_STYLE_BUILD: "mgvue.scss",

    MGVUE_BASE : CONCAT_PRE + "mgvue.js",
    MGVUE_UIKIT: CONCAT_PRE + "mgvue.ui.js",
};

var DIR_ALIAS = {
    LIB_MINJS: DIR.MINJS,

    MG_CORE  : DIR.MAGIC+"core",
    MG_UIKIT : DIR.MAGIC+"mui",
        MG_MAGIC : DIR.MAGIC+"core/magic",
        MG_MODULE: DIR.MAGIC+"core/module",
        MG_STATIC: DIR.MAGIC+"core/static",

    MV_CORE  : DIR.MGVUE+"core",
    MV_UIKIT : DIR.MGVUE+"mui",
        MV_MODULE: DIR.MGVUE+"core/module",
    MV_HOTFIX: DIR.MGVUE+"hotfix",

    // magic app 相关目录常量
    assets: DIR.APP_ASSETS,
    public: DIR.APP_PUBLIC,
    pages : DIR.APP+"pages",
    module: DIR.APP_MODULE,
        style: DIR.APP_MODULE+"style",
        store: DIR.APP_MODULE+"store",
        component: DIR.APP_MODULE+"component",

    dist  : DIR.APP_DIST,
};

var SASS_ALIAS = [
    { match: /([\"\'])public\//g, value: "$1"+DIR_ALIAS.public },
    { match: /([\"\'])assets\//g, value: "$1"+DIR_ALIAS.assets },
    { match: /([\"\'])module\//g, value: "$1"+DIR_ALIAS.module },
    { match: /\.\/fonts\/icomoon/g, value: DIR_ALIAS.assets+"icons/fonts/icomoon" }
];

// 修复 Win 下路劲格式导致 SASS 引入文件失败问题
function SASS_ALIAS_FIX(arrs) {
    var result = [];

    arrs.forEach(function(item) {
        result.push({
            match: item.match,
            value: item.value.replace(/\\/g, '/')
        });
    });

    return result;
}

var colors = require("colors");
colors.setTheme({ silly: 'rainbow', input: 'grey', verbose: 'cyan',
    prompt: 'red', info: 'green', data: 'blue', help: 'cyan',
    warn: 'yellow', debug: 'magenta', error: 'red', time: 'gray'
});

function log(str, style) {
    style = style || "info";

    var _time = moment().format("HH:mm:ss").time;

    console.log("["+_time+"] "+str.toString()[style]);
}

function createPort(port, adds, addr) {
    var result = Q.defer(), arrs = [];

    adds = adds || 2;
    port = port || 3000;
    addr = addr || ip.address() || "localhost";

    for(var i=0; i<30; i++) {
        arrs.push(port+i*adds);
    }

    portscanner.findAPortNotInUse(arrs, addr, function(error, port) {
        result.resolve(port);
    });

    return result.promise;
}

function localAddress(type, port, adds) {
    var isFind = false, result = Q.defer(),
        address = ip.address() || "localhost";

    createPort(port, adds).then(function(port) {
        result.resolve(type+"://"+address+":"+port);
    });

    return result.promise;
}

module.exports = {
    log: log,
    address: localAddress,

    DIR: DIR,
    CONCAT: CONCAT,
    ALIAS: DIR_ALIAS,
    SASS_ALIAS: SASS_ALIAS,
    SASS_ALIAS_FIX: SASS_ALIAS_FIX,
};
