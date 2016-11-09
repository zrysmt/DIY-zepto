var Zepto = (function() {
    var emptyArray = [],
        concat = emptyArray.concat,
        filter = emptyArray.filter,
        slice = emptyArray.slice,
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rootNodeRE = /^(?:body|html)$/i,
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': document.createElement('div')
        },
        class2type = {},
        toString = class2type.toString,
        zepto = {};

    function type(obj) {
        return obj == null ? String(obj) :
            class2type[toString.call(obj)] || "object"
    }

    function isWindow(obj) {
        return obj != null && obj == obj.window
    }

    function isObject(obj) {
        return type(obj) == "object";
    }

    function likeArray(obj) {
        var length = !!obj && 'length' in obj && obj.length,
            type = $.type(obj)

        return 'function' != type && !isWindow(obj) && (
            'array' == type || length === 0 ||
            (typeof length == 'number' && length > 0 && (length - 1) in obj)
        )
    }

    function Z(dom, selector) {
        var i, len = dom ? dom.length : 0;
        console.log(dom);
        for (i = 0; i < len; i++) {
            this[i] = dom[i];
            this.length = len;
            this.selector = selector || '';
        }
    }
    zepto.Z = function(dom, selector) {
        return new Z(dom, selector);
    }
    zepto.isZ = function(object) {
            return object instanceof zepto.Z;
        }
        /**
         * [fragment 内部函数 HTML 转换成 DOM]
         * @param  {[String]} html       [html片段]
         * @param  {[String]} name       [容器标签名]
         * @param  {[Object]} properties [附加的属性对象]
         * @return {[*]}           
         */

    zepto.fragment = function(html, name, properties) {
        var dom, nodes, container;
        if (singleTagRE.test(html)) {
            dom = $(document.createElement(RegExp.$1));
        }
        if (!dom) {
            //修正自闭合标签<input/>转换为<input></input>
            if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>");
            if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;
            //设置容器名，如果不是tr,tbody,thead,tfoot,td,th，则容器名为div
            if (!(name in containers)) name = "*";
            container = containers[name]; //创建容器
            container.innerHTML = '' + html; //生成DOM
            //取容器的子节点
            dom = $.each(slice.call(container.childNodes), function() {
                container.removeChild(this);
            });
            //TODO 第三个参数properties带有属性
        }
        return dom;
    }
    zepto.init = function(selector, context) {
        var dom;
        //未传参，返回空Zepto对象
        if (!selector) {
            console.log("未传参数");
            return zepto.Z();
        } else if (typeof selector == 'string') {
            selector = selector.trim();
            //如果是“<>”,基本的html代码时
            if (selector[0] == '<' && fragmentRE.test(selector)) {
                console.log(selector, RegExp.$1);
                //调用片段生成dom
                dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
            }
            //TODO:带有上下文和css查询
            
        } //如果selector是一个Zepto对象，返回它自己
        else if (zepto.isZ(selector)) {
            return selector;
        } else {
            if (isObject(selector)) {
                dom = [selector], selector = null;
            }
        }
        return zepto.Z(dom, selector);
    }

    $ = function(selector, context) {
        return zepto.init(selector, context)
    }
    $.trim = function(str) {
        return str == null ? "" : String.prototype.trim.call(str);
    }
    $.each = function(elements, callback) {
        var i, key;
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false) return elements;
        } else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false) return elements;
        }

        return elements
    }
    $.type = type;
    return $; //Zepto = $;
})();

window.Zepto = Zepto;
window.$ === undefined && (window.$ = Zepto);
