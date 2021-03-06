import MagicVue from "MV_CORE/base/main.js";

var VIEW_CACHE = [], CFG = MagicVue.config; CFG.maxViewCache = 5;

export function pushView(adds, noDelID) {
    if (adds && adds.id && adds.scope) {
        VIEW_CACHE.push(adds);

        var len = VIEW_CACHE.length;

        if (len > CFG.maxViewCache) {
            return popView(noDelID, true);
        }
    }
}

export function popView(delID, noDelType) {
    var len = VIEW_CACHE.length;

    for(var i=0; i<len; i++) {
        var del = VIEW_CACHE[i], candel;

        if (del && ( (noDelType && del.id !== delID)
            || del.id === delID) ) {
            candel = true;
        }

        if (!!candel) {
            VIEW_CACHE.splice(i, 1);
            return del;
        }
    }

    return null;
}

export function findView(id) {
    var len = VIEW_CACHE.length;

    for(var i=0; i<len; i++) {
        var find = VIEW_CACHE[i];

        if (find && find.id === id) {
            return find;
        }
    }

    return null;
}
