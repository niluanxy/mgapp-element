var _FIX_ARRAY_ = [];  // 存放所有的修复方法

export function addBaseFix(name, call) {
    _FIX_ARRAY_.push({ name: name, call: call });
}

export function addMixins(name, mixins) {
    addBaseFix(name, function(object) {
        if (typeof object == "object") {
            object.mixins = object.mixins || [];
            object.mixins.push(mixins);
        }
    });
}

export function findView(object) {
    var result = [], find = null, name;

    if (object && object.$children && object.$children.length) {
        for(var i=0; i<object.$children.length; i++) {
            find = object.$children[i];
            name = find.$$name || find.$options.name || "";

            if (name.match("^ma\-")) result.push(find);
        }
    }

    return result;
}

export function hotfix(object) {
    for(var i=0; i<_FIX_ARRAY_.length; i++) {
        var _hotfix = _FIX_ARRAY_[i],
            _name = _hotfix.name,
            _call = _hotfix.call;

        if (object && object[_name]) {
            _call(object[_name]);
        }
    }
}
