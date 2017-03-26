    <script type="text/javascript">
        (function(win, doc) {
            // ========================================================
            // 页面缩放修改
            // ========================================================
            var ratio = window.devicePixelRatio,
                width = screen.width, dwidth, isPhone,
                scale = 1, html, meta, head = document.head,
                agent = window.navigator.userAgent.toLowerCase();

            // 检测是运行在移动端还是桌面端环境
            isPhone = /iP(hone|od|ad)/ig.test(agent)
                        || /Android/ig.test(agent) || false;

            // 如果检测到是移动端才执行设置，PC端忽略设置
            if (isPhone) {
                if (ratio !== undefined) {
                    scale  = 1/ratio;
                    dwidth = ratio * width;
                } else {
                    scale  = 1;
                    dwidth = "device-width";
                }
            } else {
                scale  = 1;
                dwidth = "device-width";
            }

            meta = document.createElement("meta");
            meta.setAttribute("name", "viewport");
            content  = 'initial-scale=' + scale;
            content += ', maximum-scale='+scale;

            if (width > 440 && ratio >= 2) {
                // screen 默认就为真实分辨率的时候，不要修正 width
            } else {
                content += ', user-scalable=no, width='+dwidth;
            }

            meta.setAttribute("content", content);
            head.appendChild(meta); // 插入到页面中

            // ========================================================
            // 初始化根字体设置，font 和 width 参数，默认为 5S
            // ========================================================
            var font = 20, width = 375, docEl = doc.documentElement,
                resizeEvt = 'orientationchange' in win ? 'orientationchange' : 'resize',
                ratio = win.devicePixelRatio,
                recalc = function () {
                    var clientWidth = docEl.clientWidth, base, change;

                    change = Math.abs(clientWidth-screen.width);
                    if (!clientWidth) return;

                    base = isPhone ? win.devicePixelRatio || (clientWidth / width) : 1;

                    // 如果浏览器视窗大小没变化，则应用默认字体大小
                    if (change < 20) {
                        docEl.style.fontSize = font + 'px';
                    } else {
                        docEl.style.fontSize = font * base + 'px';
                    }
                };

            if (!doc.addEventListener) return;
            win.addEventListener(resizeEvt, recalc, false);
            doc.addEventListener('DOMContentLoaded', recalc, false);
        })(window, document);
    </script>
