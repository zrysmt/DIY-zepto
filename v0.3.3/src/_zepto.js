/**
 * 基础模块
 */
// var Zepto = (function() {
var emptyArray = [],
    concat = emptyArray.concat,
    filter = emptyArray.filter,
    slice = emptyArray.slice,
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i, //body或者html
    simpleSelectorRE = /^[\w-]*$/, //匹配包括下划线的任何单词字符或者 - 
    readyRE = /complete|loaded|interactive/,
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
    zepto = {},
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
    isArray = Array.isArray ||
    function(object) {
        return object instanceof Array;
    };



window.Zepto = zepto;
window.$ === undefined && (window.$ = zepto);
/**
 * [matches 元素element是否在selector中]
 * @param  {[元素]} element  [元素，被查询的元素]
 * @param  {[String]} selector [CSS选择器]
 * @return {[Boolean]}          [/true/false]
 */
zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
        element.mozMatchesSelector || element.oMatchesSelector ||
        element.matchesSelector;
    //如果当前元素能被指定的css选择器查找到,则返回true,否则返回false.
    //https://developer.mozilla.org/zh-CN/docs/Web/API/Element/matches
    if (matchesSelector) return matchesSelector.call(element, selector);
    //如果浏览器不支持MatchesSelector方法，则将节点放入一个临时div节点
    var match, parent = element.parentNode,
        temp = !parent;
    //当element没有父节点(temp)，那么将其插入到一个临时的div里面
    //目的就是为了使用qsa函数
    if (temp)(parent = tempParent).appendChild(element);
    ///将parent作为上下文，来查找selector的匹配结果，并获取element在结果集的索引
    //不存在时为－1,再通过~-1转成0，存在时返回一个非零的值
    match = ~zepto.qsa(parent, selector).indexOf(element);
    //将插入的节点删掉(&&如果第一个表达式为false,则不再计算第二个表达式)
    temp && tempParent.removeChild(element);
    return match;
}

function type(obj) {
    return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
}

function isFunction(value) {
    return type(value) == "function";
}

function isWindow(obj) {
    return obj != null && obj == obj.window;
}

function isDocument(obj) {
    return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
}

function isObject(obj) {
    return type(obj) == "object";
}

function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
}

function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
        type = $.type(obj);

    return 'function' != type && !isWindow(obj) && (
        'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
    );
}

//清除包含的null undefined
function compact(array) {
    return filter.call(array, function(item) {
        return item != null;
    });
}
//得到一个数组的副本
function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array;
}

function Z(dom, selector) {
    var i, len = dom ? dom.length : 0;
    for (i = 0; i < len; i++) {
        this[i] = dom[i];
        this.length = len;
        this.selector = selector || '';
    }
    /*        console.info(Zepto);
            console.info(Zepto.prototype);
            console.info(zepto.Z);
            console.info(zepto.Z.prototype);
            console.info(Z);
            console.info(Z.prototype);*/
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
    }
    //TODO 第三个参数properties带有属性
    if (isPlainObject(properties)) {
        nodes = $(dom);
        $.each(properties, function(key, value) {
            // 优先获取属性修正对象，通过修正对象读写值
            // methodAttributes包含'val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'
            if (methodAttributes.indexOf(key) > -1) {
                nodes[key](value);
            } else {
                nodes.attr(key, value)
            }
        });
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
            //TODO:带有上下文和css查询
        } else if (context !== undefined) {
            return $(context).find(selector);
        } else {
            dom = zepto.qsa(document, selector)
        }
    } //如果selector是个函数
    else if (isFunction(selector)) {
        return $(document).ready(selector);
    } //如果selector是一个Zepto对象，返回它自己
    else if (zepto.isZ(selector)) {
        return selector;
    } else {
        //如果selector是一个数组，则将其里面的null,undefined去掉
        if (isArray(selector)) {
            dom = compact(selector);
        } else if (isObject(selector)) {
            dom = [selector], selector = null;
        } else if (fragmentRE.test(selector)) {
            dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
        } else if (context !== undefined) {
            return $(context).find(selector);
        } else {
            dom = zepto.qsa(document, selector);
        }
    }
    return zepto.Z(dom, selector);
}

$ = function(selector, context) {
        return zepto.init(selector, context);
    }
    /**
     * [extend]
     * @param  {[Object]} target [目标对象]
     * @param  {[Object]} source [原对象]
     * @param  {[Boolean]} deep   [true表示深复制，默认为浅复制]
     * @return 
     */
function extend(target, source, deep) {
    var key;
    for (key in source)
    // deep=true深拷贝 source[key]是数组，一层一层剥开
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
            target[key] = {}; //target[key]不是对象的时候，返回空
        // source[key]是数组，target[key]不是数组
        if (isArray(source[key]) && !isArray(target[key]))
            target[key] = [];
        extend(target[key], source[key], deep); //递归
    } else if (source[key] !== undefined) { //递归结束，source[key]不是数组
        target[key] = source[key];
    }
}
//扩展
$.extend = function(target) {
        var deep, args = slice.call(arguments, 1);
        if (typeof target == 'boolean') {
            deep = target;
            target = args.shift();
        }
        args.forEach(function(arg) { extend(target, arg, deep); });
        return target
    }
    /**
     * [qsa CSS选择器]
     * @param  {[ELEMENT_NODE]} element  [上下文，常用document]
     * @param  {[String]} selector [选择器]
     * @return {[NodeList ]}   [查询结果]
     */
zepto.qsa = function(element, selector) {
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly); //匹配包括下划线的任何单词字符或者 - 
    return (element.getElementById && isSimple && maybeID) ? //Safari DocumentFragment 没有 getElementById
        //根据id号去查，有返回[found],无返回[]
        ((found = element.getElementById(nameOnly)) ? [found] : []) :
        //不是元素(ELEMENT_NODE)，DOCUMENT_NODE,DOCUMENT_FRAGMENT_NODE,返回空[]
        (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
        //是上述类型，转化为数组
        slice.call(
            //DocumentFragment 没有getElementsByClassName/TagName
            isSimple && !maybeID && element.getElementsByClassName ?
            maybeClass ? element.getElementsByClassName(nameOnly) : //通过类名获得
            element.getElementsByTagName(selector) : //通过tag标签名获得
            element.querySelectorAll(selector) //不支持getElementsByClassName/TagName的
        );
};
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

        return elements;
    }
    //Document.documentElement 是一个只读属性，返回文档对象
    //（document）的根元素（例如，HTML文档的 <html> 元素）
    //Node.contains()返回一个布尔值来表示是否传入的节点是，该节点的子节点
$.contains = document.documentElement.contains ?
    function(parent, node) {
        return parent !== node && parent.contains(node);
    } :
    function(parent, node) {
        while (node && (node = node.parentNode))
            if (node === parent) return true;
        return false;
    }
$.map = function(elements, callback) {
    var value, values = [],
        i, key;
    if (likeArray(elements)) {
        for (var i = 0; i < elements.length; i++) {
            value = callback(elements[i], i);
            if (value != null) values.push(value);
        }
    } else {
        for (key in elements) {
            value = callback(elements[key], key);
            if (value != null) values.push(value);
        }
    }
    return flatten(values);
}
$.type = type;
$.isFunction = isFunction;
$.isArray = isArray;
$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});
//$.fn扩展函数
$.fn = {
    constructor: zepto.Z,
    length: 0, //为了链式调用能够return this;
    forEach: emptyArray.forEach,
    //fiter函数其实可以说是包装原生的filter方法
    filter: function(selector) {
        if (isFunction(selector)) {
            //this.not(selector)取到需要排除的集合，
            //第二次再取反(这个时候this.not的参数就是一个集合了)，得到想要的集合
            return this.not(this.not(selector));
        } //下面一句的filter是原生的方法
        //过滤剩下this中有被selector选择的
        return $(filter.call(this, function(element) {
            return zepto.matches(element, selector);
        }));
    },
    ready: function(callback) {
        if (readyRE.test(document.readyState) && document.body) {
            callback($);
        } else {
            document.addEventListener('DOMContentLoaded', function() { callback($) }, false);
        }
        return this;
    },
    not: function(selector) {
        var nodes = [];
        //当selector为函数时，safari下的typeof NodeList也是function，
        //所以这里需要再加一个判断selector.call !== undefined
        if (isFunction(selector) && selector.call !== undefined)
            this.each(function(idx) {
                if (!selector.call(this, idx)) nodes.push(this);
            })
        else {
            var excludes = typeof selector == 'string' ? this.filter(selector) :
                //当selector为nodeList时执行slice.call(selector),
                //注意这里的isFunction(selector.item)是为了排除selector为数组的情况
                (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector);
            this.forEach(function(el) {
                if (excludes.indexOf(el) < 0) nodes.push(el);
            })
        }
        //上面得到的结果是数组，需要转成zepto对象，以便继承其它方法，实现链写
        return $(nodes);
    },
    find: function(selector) {
        var result, $this = this;
        if (!selector) {
            result = $();
        } //1-如果selector为node或者zepto集合时
        else if (typeof selector == 'object') {
            //遍历selector，筛选出父级为集合中记录的selector
            result = $(selector).filter(function() {
                var node = this;
                //如果$.contains(parent, node)返回true，则emptyArray.some
                //也会返回true,外层的filter则会收录该条记录
                return emptyArray.some.call($this, function(parent) {
                    return $.contains(parent, node);
                })
            })
        } else if (this.length == 1) { //2-NodeList对象，且length=1
            result = $(zepto.qsa(this[0], selector));
        } else {
            result = this.map(function() { //3-NodeList对象，且length>1
                return zepto.qsa(this, selector);
            });
        }
        return result;
    },
    //从元素本身开始，逐级向上级元素匹配，并返回最先匹配selector的元素
    closest: function(selector, context) {
        var nodes = [],
            collection = typeof selector == 'object' && $(selector);
        this.each(function(_, node) {
            //当selector是node或者zepto集合时，如果node不在collection集合中时需要取node.parentNode进行判断
            //当selector是字符串选择器时，如果node与selector不匹配，则需要取node.parentNode进行判断
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
            //当node 不是context,document的时候，取node.parentNode
                node = node !== context && !isDocument(node) && node.parentNode;
            if (node && nodes.indexOf(node) < 0) nodes.push(node);
        })
        return $(nodes);
    },
    get: function(idx) {
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
    },
    toArray: function() {
        return this.get();
    },
    map: function(fn) {
        return $($.map(this, function(el, i) {
            return fn.call(el, i, el);
        }));
    },
    concat: function() {
        var i, value, args = [];
        for (i = 0; i < arguments.length; i++) {
            value = arguments[i];
            args[i] = zepto.isZ(value) ? value.toArray() : value;
        }
        return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
    },
    slice: function() {
        return $(slice.apply(this, arguments));
    },
    eq: function(idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
    },
    clone: function() {
        return this.map(function() {
            return this.cloneNode(true)
        })
    },
    each: function(callback) {
        emptyArray.every.call(this, function(el, idx) {
            return callback.call(el, idx, el) !== false;
        })
        return this;
    },
};
/*['width','height'].forEach(function(dimension){
    var dimensionProperty =
  dimension.replace(/./, function(m){ return m[0].toUpperCase() });//全部转为大写
  
});*/

zepto.Z.prototype = Z.prototype = $.fn;

/*     return $; //Zepto = $;
     })();
*/


export { zepto, $ };
