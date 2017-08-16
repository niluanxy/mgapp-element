var gulp                = require("gulp-param")(require("gulp"), process.argv),
    chokidar            = require('chokidar'),
    Q                   = require("q"),
    open                = require("opn"),
    webpack             = require("webpack"),
    webpackDevServer    = require("webpack-dev-server"),
    webSocket           = require("ws"),
    browserSync         = require("browser-sync");


var DIR         = require("./base").DIR,
    ALIAS       = require("./base").ALIAS,
    CONCAT      = require("./base").CONCAT,

    log         = require("./base").log,
    getAddress  = require("./base").address,

    task_mixin_build = require("./mixin").build,

    task_minjs_build = require("./minjs").build,

    task_magic_build = require("./magic").build,

    task_mgvue_main_build  = require("./mgvue").buildMain,
    task_mgvue_style_build = require("./mgvue").buildStyle,

    task_mgapp_build       = require("./mgapp").build,
    task_mgapp_main_build  = require("./mgapp").buildMain,
    task_mgapp_page_build  = require("./mgapp").buildPage,
    task_mgapp_style_build = require("./mgapp").buildStyle,
    task_mgapp_assets_build= require("./mgapp").buildAssets,
    task_mgapp_main_fix    = require("./mgapp").fix,
    task_mgapp_config      = require("./mgapp").config,
    task_mgapp_callback    = require("./mgapp").callback;


function startDebugWatch() {
    gulp.watch([DIR.MIXIN+"**/*"]).on("change", task_mixin_build);
    gulp.watch([DIR.MINJS+"**/*.js"]).on("change", task_minjs_build);

    gulp.watch([DIR.MAGIC+"**/*.js", DIR.MINJS+"**/*.js"])
            .on("change", task_magic_build);

    gulp.watch([DIR.MIXIN+"**/*", DIR.MGVUE+"style/**/*"])
            .on("change", task_mgvue_style_build);
    gulp.watch([DIR.MAGIC+"**/*.js", DIR.MINJS+"**/*.js",
                DIR.MGVUE+"**/*.js", DIR.MINJS+"**/*.js"])
            .on("change", task_mgvue_main_build);
}

function startDevWatch(port) {
    port = port || 3001;    // 设置 socket 监听端口

    var wss = new webSocket.Server({ port: port }),
        APP_PUB = DIR.APP_PUBLIC, APP_MOD = DIR.APP_MODULE,
        watchOpt = {
            interval: 1,
            binaryInterval: 200,
            ignoreInitial: true,
        };

    wss.broadcast = function(data) {
        wss.clients.forEach(function(client) {
            if (client.readyState === webSocket.OPEN) {
                client.send(data);
            }
        });
    };


    chokidar.watch([DIR.APP+"index.html", DIR.APP_ASSETS+"**/*",
        "!"+DIR.APP_ASSETS+"debug/**/*"], watchOpt)
    .on("all", function() {
        task_mgapp_assets_build(port).then(function() {
            wss.broadcast("_MG_RELOAD_");
        });
    })


    chokidar.watch([DIR.MIXIN+"**/*", DIR.MGVUE+"style/**/*",
        DIR.APP_MODULE+"**/*.scss", APP_PUB+"**/*.scss",
        "!"+APP_PUB+"style/mixin.scss"], watchOpt)
    .on("all", task_mgapp_style_build);


    chokidar.watch([DIR.APP+"pages/**/style.scss", APP_PUB+"style/mixin.scss",
        APP_MOD+"style/**/*.scss"], watchOpt)
    .on("all", function(type, file) {
        if (file.match(/style.*mixin\.scss$/)) {
            task_mgapp_page_build();
        } else {
            task_mgapp_page_build(file);
        }
    });


    chokidar.watch([DIR.MINJS+"**/*.js", DIR.MAGIC+"**/*.js", DIR.MGVUE+"**/*.js",
                    APP_PUB+"**/*.js", APP_MOD+"**/*.js", APP_MOD+"**/*.html",
                    "!"+APP_PUB+"main.dev.js"], watchOpt)
    .on("all", function() {
        task_mgapp_main_build(port-1).then(function() {
            wss.broadcast("_MG_RELOAD_");
        });
    });
}

function startServer(d, r) {
    var args = arguments, address, compile, DEBUG, RELEASE,
        defer_build = Q.defer(), defer_assets = Q.defer();

    DEBUG = args[0] ? true : false;
    RELEASE = args[1] ? true : false;
    process.env.NODE_ENV = args[1] ? 'production' : 'development';

    if (DEBUG === true) startDebugWatch();

    if (RELEASE === false) {
        task_mgapp_config().then(function(config) {
            compile = webpack(config);
            address = config.entry[0].match(/client\?(.*)$/);
            address = {
                base: address[1].match(/https?:\/\/(.*)(:\d*)/)[1],
                addr: address[1],
                port: parseInt(address[1].match(/:(\d*)$/)[1])
            };

            Q.all([
                task_mgapp_style_build(),
                task_mgapp_assets_build(address.port+1)
            ]).then(function() {
                return task_mgapp_page_build();
            }).then(function() { defer_assets.resolve() });

            return defer_assets.promise;
        }).then(function() {
            compile.run(task_mgapp_callback(function(error) {
                if (!error) defer_build.resolve();
            }));

            return defer_build.promise;
        }).then(function() {
            task_mgapp_main_fix().then(function() {
                log("--- mgapp main build finish");

                var server = new webpackDevServer(compile, {
                        public: address.base,
                        hot: true, noInfo: true, quiet: true,
                        publicPath: '/pages/', contentBase: DIR.APP_DIST,
                    });

                server.listen(address.port, address.base, function() {
                    log("----------------------------------------------", "verbose");
                    log("Server has run on "+address.addr, "verbose");
                    log("----------------------------------------------", "verbose");
                    open(address.addr);
                });
            });

            startDevWatch(address.port+1);    // 开启自动刷新功能
        });
    } else {
        task_mgapp_build().then(function() {
            browserSync.init({
                server: { baseDir: DIR.APP_DIST }
            });
        });
    }
}

function devServer() {
    var reload = browserSync.reload;

    Q.all([
        task_mixin_build(),
        task_minjs_build(),
        task_magic_build()
    ]).then(function() {
        browserSync.init({
            server: { baseDir: DIR.APP }
        });
    })

    gulp.watch([DIR.MIXIN+"**/*.scss"]).on("change", function() {
        task_mixin_build().then(function() { reload() });
    });

    gulp.watch([DIR.MINJS+"**/*.js"]).on("change", function() {
        task_minjs_build().then(function() { reload() });
    });

    gulp.watch([DIR.MAGIC+"**/*.js"]).on("change", function() {
        task_magic_build().then(function() { reload() });
    });
}

module.exports = {
    server: startServer,
    devServer: devServer,
};
