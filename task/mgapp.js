var gulp                = require("gulp-param")(require("gulp"), process.argv),
    extend              = require("extend"),
    Q                   = require("q"),
    extend              = require("extend"),
    source              = require("vinyl-source-stream"),
    rollup              = require("rollup-stream"),
    replace             = require("gulp-replace-plus"),
    rollupReplace       = require("rollup-plugin-replace"),
    rollupAlias         = require("rollup-plugin-alias"),
    rollupUglify        = require("rollup-plugin-uglify"),
    del                 = require("del"),
    rename              = require("gulp-rename"),
    concat              = require("gulp-concat"),
    px2rem              = require("gulp-px2rem"),
    gulpif              = require("gulp-if"),
    autoprefixer        = require("gulp-autoprefixer"),
    sass                = require("gulp-sass"),
    cssImport           = require("gulp-cssimport"),
    fs                  = require("fs"),
    htmlmin             = require('gulp-htmlmin'),
    hashint             = require("hash-int"),
    ip                  = require("ip"),
    webpack             = require("webpack"),
    webpackUglifyJS     = require('uglifyjs-webpack-plugin');


var log        = require("./base").log,
    getAddress = require("./base").address,

    DIR        = require("./base").DIR,
    CONCAT     = require("./base").CONCAT,
    ALIAS      = require("./base").ALIAS,
    SASS_ALIAS = require("./base").SASS_ALIAS,
    SASS_FIX   = require("./base").SASS_ALIAS_FIX,

    px2remConfig = require("./mixin").config,
    task_mgvue_style_concat = require("./mgvue").concat;

var HOT_KEY = '"__HOT_MG_VUE_HASH__"';

function task_mgapp_style_concat() {
    var defer_concat = Q.defer(), STYLE_PATH = DIR.APP_PUBLIC+"style/";

    task_mgvue_style_concat().then(function() {
        gulp.src([DIR.CONCAT+CONCAT.MIXIN_CORE,
                  DIR.CONCAT+CONCAT.MIXIN_VARS,
                  DIR.CONCAT+CONCAT.MGVUE_STYLE_VARS,
            STYLE_PATH+"varible/*.scss",
                  DIR.CONCAT+CONCAT.MIXIN_UIKIT,
                  DIR.CONCAT+CONCAT.MGVUE_STYLE_UIKIT,
            STYLE_PATH+"component/*.scss"
        ])
        .pipe(concat("mixin.scss"))
        .pipe(gulp.dest(STYLE_PATH))
        .on("finish", function() { defer_concat.resolve() })
    });

    return defer_concat.promise;
}

function task_mgapp_style_old() {
    var defer_build = Q.defer(), RELEASE;

    RELEASE = process.env.NODE_ENV == 'production';

    task_mgapp_style_concat().then(function() {
        log("--- mgapp style concat finish");

        gulp.src([DIR.APP_PUBLIC+"style/mixin.scss",
                  DIR.APP_PUBLIC+"main.scss"])
        .pipe(concat("main.scss"))
        .pipe(replace(SASS_FIX(SASS_ALIAS)))
        .pipe(sass.sync({
            outputStyle: RELEASE ? "compressed" : "nested",
        }).on('error', sass.logError))
        .pipe(cssImport())
        .pipe(autoprefixer())
        .pipe(px2rem(px2remConfig))
        .pipe(gulpif(!RELEASE, gulp.dest(DIR.APP_PUBLIC)))
        .pipe(gulpif(RELEASE,  gulp.dest(DIR.APP_DIST+"assets/")))
        .on("finish", function() {
            log("--- mgapp style build finish");
            defer_build.resolve();
        });
    });

    return defer_build.promise;
}

function task_mgapp_style_build() {
    var defer_main = Q.defer(), defer_font = Q.defer(),
        defer_build = Q.defer(), RELEASE,
        PATH = DIR.BASE+"node_modules/element-ui/";

    RELEASE = process.env.NODE_ENV == 'production';

    gulp.src(PATH+"lib/theme-default/index.css")
    .pipe(rename("eleui.css"))
    .pipe(gulp.dest(DIR.APP_ASSETS+"debug/"))
    .on("finish", function() { defer_main.resolve() });

    if (RELEASE) {
        gulp.src(PATH+"lib/theme-default/fonts/*")
        .pipe(gulp.dest(DIR.APP_DIST+"assets/fonts/"))
        .on("finish", function() { defer_font.resolve() });
    } else {
        gulp.src(PATH+"lib/theme-default/fonts/*")
        .pipe(gulp.dest(DIR.APP_ASSETS+"debug/fonts/"))
        .on("finish", function() { defer_font.resolve() });
    }

    Q.all([defer_main.promise, defer_font.promise])
    .then(function() {
        task_mgapp_style_old().then(function() {
            defer_build.resolve();
        });
    });

    return defer_build.promise;
}

function task_mgapp_assets_build(port) {
    var defer_all = Q.defer(), defer_assets = Q.defer(),
        defer_html = Q.defer(), defer_hoturl = Q.defer(),
        hotScript, remScript, cssString, hotUrl,
        RELEASE = process.env.NODE_ENV == 'production';

    if (port !== undefined) {
        defer_hoturl.resolve("ws://"+(ip.address() || "localhost")+":"+port);
    } else {
        getAddress("ws", 3001, 1).then(function(url) {
            defer_hoturl.resolve(url);
        });
    }

    defer_hoturl.promise.then(function(url) {
        hotUrl = { addr: url, port: parseInt(url.match(/:(\d*)$/)[1]) };

        remScript = fs.readFileSync(DIR.TASK+"template/remScript.js").toString();
        remScript = '</title>\n'+remScript.replace(/\n$/, '');

        hotScript = fs.readFileSync(DIR.TASK+"template/hotSocket.js").toString();
        hotScript = hotScript.replace(/_SOCKET_HOST_/g, url);
        hotScript = hotScript.replace(/_HOT_KEY_/g, HOT_KEY);
        hotScript = '\n'+hotScript+'</body>';

        cssString = /\s*<link href="assets\/main.css" rel="stylesheet">/;

        gulp.src(DIR.APP+"index.html")
        .pipe(replace(/\<\/title\>/, remScript))
        .pipe(gulpif(!RELEASE, replace(cssString, '')))
        .pipe(gulpif(!RELEASE, replace(/\<\/body\>/,  hotScript)))
        .pipe(gulp.dest(DIR.APP_DIST))
        .on("finish", function() { defer_html.resolve() })
    });

    gulp.src(DIR.APP+"assets/**/*")
    .pipe(gulp.dest(DIR.APP_DIST+"assets/"))
    .on("finish", function() { defer_assets.resolve() })

    Q.all([defer_html.promise, defer_assets.promise])
    .then(function() {
        log("--- mgapp assets build finish");
        defer_all.resolve(RELEASE ? hotUrl : {});
    });

    return defer_all.promise;
}

function task_mgapp_page_build() {
    var defer_build = Q.defer(), RELEASE;

    RELEASE = process.env.NODE_ENV == 'production';

    gulp.src(DIR.APP+"pages/**/style.scss")
    .pipe(replace(SASS_FIX(SASS_ALIAS)))
    .pipe(sass.sync({
        outputStyle: RELEASE ? "compressed" : "nested",
    }).on('error', sass.logError))
    .pipe(cssImport())
    .pipe(autoprefixer())
    .pipe(px2rem(px2remConfig))
    .pipe(gulp.dest(DIR.APP+"pages/"))
    .on("finish", function() {
        log("--- mgapp page style build finish");
        defer_build.resolve();
    });

    return defer_build.promise;
}

function createConfig(port) {
    var plugins = [], loader, alias = extend({}, ALIAS),
        sassAlias = extend([], SASS_ALIAS),
        address = Q.defer(), config = Q.defer(),
        RELEASE = process.env.NODE_ENV == 'production';

    alias.vue = RELEASE ? "vue/dist/vue.min.js" : "vue/dist/vue.js";
    alias.vuex = RELEASE ? "vuex/dist/vuex.min.js" : "vuex/dist/vuex.js";

    sassAlias.push({
        match: /\.\/fonts/g, value: DIR.APP_ASSETS+"debug/fonts"
    });

    plugins.push(new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(RELEASE),
    }));
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

    if (RELEASE) {
        plugins.push(new webpackUglifyJS({
            beautify: false,
            comments: false,
            compress: {
                warnings: false,
                drop_console: true,
                collapse_vars: true,
                reduce_vars: true,
            }
        }));
    } else {
        plugins.push(new webpack.HotModuleReplacementPlugin());
        plugins.push(new webpack.NamedModulesPlugin());
    }

    loader = [
        { test: /\.html$/, use: [ "html-loader" ] },
        { test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/, loader: 'file-loader' },
        {
            test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
            loader: 'file-loader',
            query: { name: '[name].[ext]?[hash]' }
        },

        { test: /pages.*index\.js$/, use: [ "mgvue-loader" ] },
        { test: /\.css$/, use: [
            "style-loader", { loader: "replace-plus-loader",
              options: { replace: SASS_FIX(sassAlias) }
            }, "css-loader" ]
        }
    ];

    if (RELEASE) {
        var delcss = /require.*public.*main\.css.*\;/g;

        loader.unshift({
            test: /public[\\\/]*main\.js$/,
            use : [{
                loader : "replace-plus-loader", 
                options: {replace: {match: delcss, value: ""}} 
            }]
        });
    }

    if (port !== undefined) {
        address.resolve("http://"+(ip.address() || "localhost")+":"+port);
    } else {
        getAddress("http", 3000, 2).then(function(hotUrl) {
            address.resolve(hotUrl);
        });
    }

    address.promise.then(function(hotUrl) {
        var fname = RELEASE ? "[name].[chunkhash:8].js" : "[name].js";

        config.resolve({
            context: DIR.BASE,
            entry: RELEASE ? "./app/public/main.js" : [
                'webpack-dev-server/client?'+hotUrl,
                'webpack/hot/only-dev-server',
                "./app/public/main.js"
            ],
            output: {
                publicPath: 'pages/', path: DIR.APP_DIST+"pages/",
                filename: fname, library: 'MagicVue', libraryTarget: "umd",
            },
            module : { rules: loader },
            resolve: { alias: alias }, plugins: plugins,
        });
    });

    return config.promise;
}

function createReplace() {
    var result = {}, RELEASE = process.env.NODE_ENV == 'production';

    result.oldStr = RELEASE ? /(exports\.MagicVue)\=(\S\(\))\:(\S)\.MagicVue\=(\S\(\))/
                            : /else\s*root\[\"MagicVue\"\] = factory\(\);/;
    result.newStr = RELEASE ? 'exports.MagicVue=$2:(function(){$3.MagicVue=$3.$$$=$2.default;'+
                              '$3.Magic=$3.$=$3.$$$.Magic})()'
                            : 'else {\n\t\troot.MagicVue = root.$$$ = factory().default;'+
                              ' \n\t\troot.Magic = root.$ = root.MagicVue.Magic;\n\t}';

    result.oldHash = /var\shotCurrentHash\s\=\s(.{22});/;
    result.newHash = 'var hotCurrentHash = '+
                        'localStorage.getItem('+HOT_KEY+') || $1;'+
                        'localStorage.removeItem('+HOT_KEY+');';

    result.oldSet = "hotCurrentHash = hotUpdateNewHash;";
    result.newSet = 'window['+HOT_KEY+'] = hotCurrentHash = hotUpdateNewHash;';

    return result;
}

function task_mgapp_main_fix() {
    var defer_fix = Q.defer(), defer_css = Q.defer(),
        defer_all = Q.defer(), NAME_CSS, NAME_JS,
        DIR_ASSETS, replaceStr = createReplace(),
        RELEASE = process.env.NODE_ENV == 'production';

    DIR_ASSETS = DIR.APP_DIST+"assets/";

    gulp.src(DIR.APP_DIST+"pages/main*.js")
    .pipe(replace(replaceStr.oldStr,  replaceStr.newStr))
    .pipe(replace(replaceStr.oldSet,  replaceStr.newSet))
    .pipe(replace(replaceStr.oldHash, replaceStr.newHash))
    .pipe(gulp.dest(DIR_ASSETS))
    .on("finish", function() {
        del(DIR.APP_DIST+"pages/main*.js");

        if (RELEASE) {
            fs.readdir(DIR_ASSETS, function(erros, files) {
                for(var i=0; i<files.length; i++) {
                    var find = files[i].match(/main.*\.js/);

                    if (find) { NAME_JS = find[0]; break; }
                }

                defer_fix.resolve();
            });
        } else {
            defer_fix.resolve();
        }
    });

    if (RELEASE) {
        NAME_CSS = "main."+(hashint((new Date).getTime())+"").substr(0, 8)+".css";

        gulp.src(DIR_ASSETS+"main.css")
        .pipe(rename(NAME_CSS))
        .pipe(gulp.dest(DIR_ASSETS))
        .on("finish", function() {
            del(DIR_ASSETS+"main.css");

            defer_css.resolve();
        });

        Q.all([defer_fix.promise, defer_css.promise])
        .then(function() {
            gulp.src(DIR.APP_DIST+"index.html")
            .pipe(replace(/main\..*css/g, NAME_CSS))
            .pipe(replace(/main\..*js/g,  NAME_JS))
            .pipe(htmlmin({
                minifyJS: true,
                minifyCSS: true,
                removeComments: true,
            }))
            .pipe(gulp.dest(DIR.APP_DIST))
            .on("finish", function() {
                defer_all.resolve();
            })
        });
    } else {
        defer_fix.promise.then(function() {
            defer_all.resolve();
        });
    }

    return defer_all.promise;
}

function webpackCallback(callback) {
    return function(err, stats) {
        var error = null;

        if (err) {
            log(err.stack || err, "error");
            if (err.details) log(err.details, "error");
            error = err.details || err.stack || err;
        } else if (stats.hasErrors() || stats.hasWarnings()) {
            var info = stats.toJson(), style;

            if (stats.hasErrors()) {
                log(info.errors, "error");
            } else {
                log(info.warnings, "warn");
            }

            error = info.errors || null;
        }

        if (typeof callback === "function") {
            callback(error);
        }
    }
}

function task_mgapp_main_build(port) {
    var defer_build = Q.defer();

    createConfig(port).then(function(config) {
        webpack(config, webpackCallback(function(error) {
            if (error) {
                log(error, "error"); defer_build.reject();
            } else {
                task_mgapp_main_fix().then(function() {
                    log("--- mgapp main build finish");
                    defer_build.resolve();
                });
            }
        }));
    });

    return defer_build.promise;
}

function task_mgapp_build() {
    var defer_build = Q.defer();

    Q.all([
        task_mgapp_assets_build(),
        task_mgapp_style_build(),
    ]).then(function() {
        return task_mgapp_page_build();
    }).then(function() {
        return task_mgapp_main_build();
    }).then(function() {
        log("mgapp task all finish");
        defer_build.resolve();
    })

    return defer_build.promise;
}

function clean_mgapp_dist() {
    return del([DIR.APP_DIST+"**/*"]);
}

function clean_mgapp_assets() {
    return del([DIR.APP_ASSETS+"debug"]);
}

function clean_mgapp_style() {
    return del([
        DIR.APP_PUBLIC+"main.css",
        DIR.APP_PUBLIC+"style/mixin.scss"
    ]);
}

module.exports = {
    cleanDist  : clean_mgapp_dist,
    cleanStyle : clean_mgapp_style,
    cleanAssets: clean_mgapp_assets,

    fix     : task_mgapp_main_fix,
    config  : createConfig,
    callback: webpackCallback,

    build       : task_mgapp_build,
    buildMain   : task_mgapp_main_build,
    buildPage   : task_mgapp_page_build,
    buildStyle  : task_mgapp_style_build,
    buildAssets : task_mgapp_assets_build,
};
