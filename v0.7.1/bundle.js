(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.zepto = factory());
}(this, (function () {

/**
 * 基础模块
 */
// var Zepto = (function() {
var emptyArray = [];
var concat = emptyArray.concat;
var filter = emptyArray.filter;
var slice = emptyArray.slice;
var cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1, 'opacity': 1, 'z-index': 1, 'zoom': 1 };
var fragmentRE = /^\s*<(\w+|!)[^>]*>/;
var singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/;
var tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig;
var rootNodeRE = /^(?:body|html)$/i;
var simpleSelectorRE = /^[\w-]*$/;
var readyRE = /complete|loaded|interactive/;
var table = document.createElement('table');
var tableRow = document.createElement('tr');
var containers = {
    'tr': document.createElement('tbody'),
    'tbody': table,
    'thead': table,
    'tfoot': table,
    'td': tableRow,
    'th': tableRow,
    '*': document.createElement('div')
};
var class2type = {};
var toString = class2type.toString;
var zepto = {};
var methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'];
var adjacencyOperators = ['after', 'prepend', 'before', 'append'];
var isArray = Array.isArray || function (object) {
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
zepto.matches = function (element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false;
    var matchesSelector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector;
    //如果当前元素能被指定的css选择器查找到,则返回true,否则返回false.
    //https://developer.mozilla.org/zh-CN/docs/Web/API/Element/matches
    if (matchesSelector) return matchesSelector.call(element, selector);
    //如果浏览器不支持MatchesSelector方法，则将节点放入一个临时div节点
    var match,
        parent = element.parentNode,
        temp = !parent;
    //当element没有父节点(temp)，那么将其插入到一个临时的div里面
    //目的就是为了使用qsa函数
    if (temp) (parent = tempParent).appendChild(element);
    ///将parent作为上下文，来查找selector的匹配结果，并获取element在结果集的索引
    //不存在时为－1,再通过~-1转成0，存在时返回一个非零的值
    match = ~zepto.qsa(parent, selector).indexOf(element);
    //将插入的节点删掉(&&如果第一个表达式为false,则不再计算第二个表达式)
    temp && tempParent.removeChild(element);
    return match;
};

function type(obj) {
    return obj == null ? String(obj) : class2type[toString.call(obj)] || "object";
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

    return 'function' != type && !isWindow(obj) && ('array' == type || length === 0 || typeof length == 'number' && length > 0 && length - 1 in obj);
}

//清除包含的null undefined
function compact(array) {
    return filter.call(array, function (item) {
        return item != null;
    });
}
//得到一个数组的副本
function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array;
}
camelize = function (str) {
    return str.replace(/-+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
    });
};

function maybeAddPx(name, value) {
    return typeof value == "number" && !cssNumber[dasherize(name)] ? value + "px" : value;
}

function dasherize(str) {
    return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/_/g, '-').toLowerCase();
}

function Z(dom, selector) {
    var i,
        len = dom ? dom.length : 0;
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
zepto.Z = function (dom, selector) {
    return new Z(dom, selector);
};
zepto.isZ = function (object) {
    return object instanceof zepto.Z;
};
/**
 * [fragment 内部函数 HTML 转换成 DOM]
 * @param  {[String]} html       [html片段]
 * @param  {[String]} name       [容器标签名]
 * @param  {[Object]} properties [附加的属性对象]
 * @return {[*]}           
 */

zepto.fragment = function (html, name, properties) {
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
        dom = $.each(slice.call(container.childNodes), function () {
            container.removeChild(this);
        });
    }
    //TODO 第三个参数properties带有属性
    if (isPlainObject(properties)) {
        nodes = $(dom);
        $.each(properties, function (key, value) {
            // 优先获取属性修正对象，通过修正对象读写值
            // methodAttributes包含'val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'
            if (methodAttributes.indexOf(key) > -1) {
                nodes[key](value);
            } else {
                nodes.attr(key, value);
            }
        });
    }
    return dom;
};
zepto.init = function (selector, context) {
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
            dom = zepto.qsa(document, selector);
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
};

$ = function (selector, context) {
    return zepto.init(selector, context);
};
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
        if (isPlainObject(source[key]) && !isPlainObject(target[key])) target[key] = {}; //target[key]不是对象的时候，返回空
        // source[key]是数组，target[key]不是数组
        if (isArray(source[key]) && !isArray(target[key])) target[key] = [];
        extend(target[key], source[key], deep); //递归
    } else if (source[key] !== undefined) {
        //递归结束，source[key]不是数组
        target[key] = source[key];
    }
}
//扩展
$.extend = function (target) {
    var deep,
        args = slice.call(arguments, 1);
    if (typeof target == 'boolean') {
        deep = target;
        target = args.shift();
    }
    args.forEach(function (arg) {
        extend(target, arg, deep);
    });
    return target;
};
/**
 * [qsa CSS选择器]
 * @param  {[ELEMENT_NODE]} element  [上下文，常用document]
 * @param  {[String]} selector [选择器]
 * @return {[NodeList ]}   [查询结果]
 */
zepto.qsa = function (element, selector) {
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
        // Ensure that a 1 char tag name still gets checked
    isSimple = simpleSelectorRE.test(nameOnly); //匹配包括下划线的任何单词字符或者 - 
    return element.getElementById && isSimple && maybeID ? //Safari DocumentFragment 没有 getElementById
    //根据id号去查，有返回[found],无返回[]
    (found = element.getElementById(nameOnly)) ? [found] : [] :
    //不是元素(ELEMENT_NODE)，DOCUMENT_NODE,DOCUMENT_FRAGMENT_NODE,返回空[]
    element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11 ? [] :
    //是上述类型，转化为数组
    slice.call(
    //DocumentFragment 没有getElementsByClassName/TagName
    isSimple && !maybeID && element.getElementsByClassName ? maybeClass ? element.getElementsByClassName(nameOnly) : //通过类名获得
    element.getElementsByTagName(selector) : //通过tag标签名获得
    element.querySelectorAll(selector) //不支持getElementsByClassName/TagName的
    );
};
$.trim = function (str) {
    return str == null ? "" : String.prototype.trim.call(str);
};
$.each = function (elements, callback) {
    var i, key;
    if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++) if (callback.call(elements[i], i, elements[i]) === false) return elements;
    } else {
        for (key in elements) if (callback.call(elements[key], key, elements[key]) === false) return elements;
    }

    return elements;
};
$.inArray = function (elem, array, i) {
    return emptyArray.indexOf.call(array, elem, i);
};
//Document.documentElement 是一个只读属性，返回文档对象
//（document）的根元素（例如，HTML文档的 <html> 元素）
//Node.contains()返回一个布尔值来表示是否传入的节点是，该节点的子节点
$.contains = document.documentElement.contains ? function (parent, node) {
    return parent !== node && parent.contains(node);
} : function (parent, node) {
    while (node && (node = node.parentNode)) if (node === parent) return true;
    return false;
};
$.map = function (elements, callback) {
    var value,
        values = [],
        i,
        key;
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
};
$.type = type;
$.isFunction = isFunction;
$.isArray = isArray;
$.isWindow = isWindow;
$.isPlainObject = isPlainObject;
if (window.JSON) $.parseJSON = JSON.parse;
$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});
//$.fn扩展函数
$.fn = {
    constructor: zepto.Z,
    length: 0, //为了链式调用能够return this;
    forEach: emptyArray.forEach,
    //fiter函数其实可以说是包装原生的filter方法
    filter: function (selector) {
        if (isFunction(selector)) {
            //this.not(selector)取到需要排除的集合，
            //第二次再取反(这个时候this.not的参数就是一个集合了)，得到想要的集合
            return this.not(this.not(selector));
        } //下面一句的filter是原生的方法
        //过滤剩下this中有被selector选择的
        return $(filter.call(this, function (element) {
            return zepto.matches(element, selector);
        }));
    },
    ready: function (callback) {
        if (readyRE.test(document.readyState) && document.body) {
            callback($);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                callback($);
            }, false);
        }
        return this;
    },
    not: function (selector) {
        var nodes = [];
        //当selector为函数时，safari下的typeof NodeList也是function，
        //所以这里需要再加一个判断selector.call !== undefined
        if (isFunction(selector) && selector.call !== undefined) this.each(function (idx) {
            if (!selector.call(this, idx)) nodes.push(this);
        });else {
            var excludes = typeof selector == 'string' ? this.filter(selector) :
            //当selector为nodeList时执行slice.call(selector),
            //注意这里的isFunction(selector.item)是为了排除selector为数组的情况
            likeArray(selector) && isFunction(selector.item) ? slice.call(selector) : $(selector);
            this.forEach(function (el) {
                if (excludes.indexOf(el) < 0) nodes.push(el);
            });
        }
        //上面得到的结果是数组，需要转成zepto对象，以便继承其它方法，实现链写
        return $(nodes);
    },
    find: function (selector) {
        var result,
            $this = this;
        if (!selector) {
            result = $();
        } //1-如果selector为node或者zepto集合时
        else if (typeof selector == 'object') {
                //遍历selector，筛选出父级为集合中记录的selector
                result = $(selector).filter(function () {
                    var node = this;
                    //如果$.contains(parent, node)返回true，则emptyArray.some
                    //也会返回true,外层的filter则会收录该条记录
                    return emptyArray.some.call($this, function (parent) {
                        return $.contains(parent, node);
                    });
                });
            } else if (this.length == 1) {
                //2-NodeList对象，且length=1
                result = $(zepto.qsa(this[0], selector));
            } else {
                result = this.map(function () {
                    //3-NodeList对象，且length>1
                    return zepto.qsa(this, selector);
                });
            }
        return result;
    },
    //从元素本身开始，逐级向上级元素匹配，并返回最先匹配selector的元素
    closest: function (selector, context) {
        var nodes = [],
            collection = typeof selector == 'object' && $(selector);
        this.each(function (_, node) {
            //当selector是node或者zepto集合时，如果node不在collection集合中时需要取node.parentNode进行判断
            //当selector是字符串选择器时，如果node与selector不匹配，则需要取node.parentNode进行判断
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
            //当node 不是context,document的时候，取node.parentNode
            node = node !== context && !isDocument(node) && node.parentNode;
            if (node && nodes.indexOf(node) < 0) nodes.push(node);
        });
        return $(nodes);
    },
    get: function (idx) {
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
    },
    toArray: function () {
        return this.get();
    },
    size: function () {
        return this.length;
    },
    remove: function () {
        return this.each(function () {
            if (this.parentNode != null) this.parentNode.removeChild(this);
        });
    },
    map: function (fn) {
        return $($.map(this, function (el, i) {
            return fn.call(el, i, el);
        }));
    },
    concat: function () {
        var i,
            value,
            args = [];
        for (i = 0; i < arguments.length; i++) {
            value = arguments[i];
            args[i] = zepto.isZ(value) ? value.toArray() : value;
        }
        return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
    },
    slice: function () {
        return $(slice.apply(this, arguments));
    },
    eq: function (idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
    },
    clone: function () {
        return this.map(function () {
            return this.cloneNode(true);
        });
    },
    each: function (callback) {
        emptyArray.every.call(this, function (el, idx) {
            return callback.call(el, idx, el) !== false;
        });
        return this;
    },
    css: function (property, value) {
        if (arguments.length < 2) {
            var element = this[0];
            if (typeof property == 'string') {
                if (!element) return;
                return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property);
            } else if (isArray(property)) {
                if (!element) return;
                var props = {};
                var computedStyle = getComputedStyle(element, '');
                $.each(property, function (_, prop) {
                    props[prop] = element.style[camelize(prop)] || computedStyle.getPropertyValue(prop);
                });
                return props;
            }
        }

        var css = '';
        if (type(property) == 'string') {
            if (!value && value !== 0) {
                this.each(function () {
                    this.style.removeProperty(dasherize(property));
                });
            } else {
                css = dasherize(property) + ":" + maybeAddPx(property, value);
            }
        } else {
            for (key in property) if (!property[key] && property[key] !== 0) {
                this.each(function () {
                    this.style.removeProperty(dasherize(key));
                });
            } else {
                css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
            }
        }

        return this.each(function () {
            this.style.cssText += ';' + css;
        });
    }
};
/*['width','height'].forEach(function(dimension){
    var dimensionProperty =
  dimension.replace(/./, function(m){ return m[0].toUpperCase() });//全部转为大写
  
});*/
function traverseNode(node, fun) {
    fun(node);
    for (var i = 0, len = node.childNodes.length; i < len; i++) traverseNode(node.childNodes[i], fun);
}
// Generate the `after`, `prepend`, `before`, `append`,
// `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
adjacencyOperators.forEach(function (operator, operatorIndex) {
    var inside = operatorIndex % 2; //=> prepend, append

    $.fn[operator] = function () {
        // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        var argType,
            nodes = $.map(arguments, function (arg) {
            var arr = [];
            argType = type(arg);
            if (argType == "array") {
                arg.forEach(function (el) {
                    if (el.nodeType !== undefined) return arr.push(el);else if ($.zepto.isZ(el)) return arr = arr.concat(el.get());
                    arr = arr.concat(zepto.fragment(el));
                });
                return arr;
            }
            return argType == "object" || arg == null ? arg : zepto.fragment(arg);
        }),
            parent,
            copyByClone = this.length > 1;
        if (nodes.length < 1) return this;

        return this.each(function (_, target) {
            parent = inside ? target : target.parentNode;

            // convert all methods to a "before" operation
            target = operatorIndex == 0 ? target.nextSibling : operatorIndex == 1 ? target.firstChild : operatorIndex == 2 ? target : null;

            var parentInDocument = $.contains(document.documentElement, parent);

            nodes.forEach(function (node) {
                if (copyByClone) node = node.cloneNode(true);else if (!parent) return $(node).remove();

                parent.insertBefore(node, target);
                if (parentInDocument) traverseNode(node, function (el) {
                    if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' && (!el.type || el.type === 'text/javascript') && !el.src) {
                        var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
                        target['eval'].call(target, el.innerHTML);
                    }
                });
            });
        });
    };

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
        $(html)[operator](this);
        return this;
    };
});

zepto.Z.prototype = Z.prototype = $.fn;

/**
 * 事件模块
 */
/*
{
  1: [ // handlers的值为DOM元素的_zid
    {
      del: function() {}, // 实现事件代理的函数
      e: "click", // 事件名称
      fn: function() {}, // 用户传入的回调函数
      i: 0, // 该对象在数组里的下标
      ns: "", // 事件的命名空间，只用使用$.fn.triggerHandler时可用，$.fn.trigger不能使用。
      proxy: function(e) {}, // 真正绑定事件时的回调函数，里面判断调用del或者fn
      sel: undefined // 要进行事件代理时传入的selector
    }
  ]
}
 */
var Event = function ($) {
    var _zid = 1,
        //用来生成标示元素和回调函数的id，每标示一个就+1
    undefined,
        handlers = {},
        slice = Array.prototype.slice,
        isFunction = $.isFunction,
        isString = function (obj) {
        return typeof obj == 'string';
    },
        specialEvents = {},
        focusinSupported = 'onfocusin' in window,
        focus = { focus: 'focusin', blur: 'focusout' },
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

    //通过一个_zid而不是通过DOM对象的引用来连接handler是因为：防止移除掉DOM元素后，
    //handlers对象还保存着对这个DOM元素的引用。通过使用_zid就可以防止这种情况发生，
    //避免了内存泄漏    
    function zid(element) {
        return element._zid || (element._zid = _zid++);
    }
    // 根据给定的参数在handlers变量中寻找对应的handler
    function findHandlers(element, event, fn, selector) {
        event = parse(event); // 解析event参数，分离出事件名和ns
        if (event.ns) var matcher = matcherFor(event.ns);
        // 取出所有属于element的handler，并且根据event、fn和selector参数进行筛选
        return (handlers[zid(element)] || []).filter(function (handler) {
            return handler && (!event.e || handler.e == event.e) // 事件名不同的过滤掉
            && (!event.ns || matcher.test(handler.ns)) // 命名空间不同的过滤掉
            && (!fn || zid(handler.fn) === zid(fn)) // 回调函数不同的过滤掉(通过_zid属性判断是否同一个函数)
            && (!selector || handler.sel == selector); // selector不同的过滤掉
        });
    }
    //解析event参数，如 "click.abc"，abc作为ns(命名空间)
    function parse(event) {
        var parts = ('' + event).split('.');
        return { e: parts[0], ns: parts.slice(1).sort().join(' ') };
    }
    // 生成匹配的namespace表达式：'abc def' -> /(?:^| )abc .* ?def(?: |$)/
    function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
    }
    //focus和blur事件的冒泡
    //focus和blur事件本身是不冒泡的，如果需要对这两个事件进行事件代理，就要运用一些小技巧。
    //首先，如果浏览器支持focusin和focusout，就使用这两个可以冒泡事件来代替。
    //如果浏览器不支持focusion和focusout，就利用focus和blur捕获不冒泡的特性，
    //传入addEventListener中的第三个参数设置true，以此来进行事件代理
    function eventCapture(handler, captureSetting) {
        return handler.del && !focusinSupported && handler.e in focus || !!captureSetting;
    }

    function realEvent(type) {
        return hover[type] || focusinSupported && focus[type] || type;
    }
    /**
     * 添加事件的实际方法
     * @param {元素}   element   DOM元素
     * @param {String}   events    事件字符串
     * @param {Function} fn        回调函数
     * @param {All}      data      绑定事件时传入的data，可以是各种类型   
     * @param {String}   selector  被代理元素的css选择器
     * @param {[type]}   delegator 进行事件代理的函数
     * @param {[type]}   capture   指定捕获或者冒泡阶段
     */
    function add(element, events, fn, data, selector, delegator, capture) {
        var id = zid(element),
            set = handlers[id] || (handlers[id] = []);
        //多个事件以空格为间隔
        events.split(/\s/).forEach(function (event) {
            //为ready
            if (event == 'ready') return $(document).ready(fn);
            //*************************构建handler*************************
            var handler = parse(event);
            handler.fn = fn;
            handler.sel = selector;

            // emulate mouseenter, mouseleave
            // mouseenter、mouseleave通过mouseover、mouseout来模拟realEvent函数处理
            // hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }
            if (handler.e in hover) fn = function (e) {
                //http://www.w3school.com.cn/jsref/event_relatedtarget.asp
                // relatedTarget为相关元素，只有mouseover和mouseout事件才有
                // 对mouseover事件而言，相关元素就是那个失去光标的元素;
                // 对mouseout事件而言，相关元素则是获得光标的元素。
                var related = e.relatedTarget;
                if (!related || related !== this && !$.contains(this, related)) return handler.fn.apply(this, arguments);
            };
            handler.del = delegator;
            // 需要进行事件代理时，调用的是封装了fn的delegator函数
            var callback = delegator || fn;
            handler.proxy = function (e) {
                e = compatible(e); //无第二个参数，其实就是e = e;
                if (e.isImmediatePropagationStopped()) return;
                e.data = data;
                var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
                //当事件处理函数返回false时，阻止默认操作和冒泡
                if (result === false) e.preventDefault(), e.stopPropagation();
                return result;
            };
            handler.i = set.length; // 把handler在set中的下标赋值给handler.i
            set.push(handler);
            //*************************构建handler end*************************
            if ('addEventListener' in element)
                //addEventListener -- https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
                //使用addEventListener所传入的真正回调函数就是proxy函数
                element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
        });
    }
    //删除handler
    function remove(element, events, fn, selector, capture) {
        var id = zid(element);
        (events || '').split(/\s/).forEach(function (event) {
            findHandlers(element, event, fn, selector).forEach(function (handler) {
                delete handlers[id][handler.i];
                if ('removeEventListener' in element) element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
            });
        });
    }

    $.event = { add: add, remove: remove };
    /*
    *接受一个函数，然后返回一个新函数，并且这个新函数始终保持了特定的上
    *下文(context)语境，新函数中this指向context参数。
    *另外一种形式，原始的function是从上下文(context)对象的特定属性读取。
    *
    var obj = {
        name: 'Zepto'
    },
    handler = function() {
        console.log("hello from + ", this.name)
    }
    $(document).on('click', $.proxy(handler, obj));//hello from + Zepto
     */
    $.proxy = function (fn, context) {
        var args = 2 in arguments && slice.call(arguments, 2);
        if (isFunction(fn)) {
            var proxyFn = function () {
                return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
            };
            proxyFn._zid = zid(fn);
            return proxyFn;
        } else if (isString(context)) {
            if (args) {
                args.unshift(fn[context], fn);
                return $.proxy.apply(null, args);
            } else {
                return $.proxy(fn[context], fn);
            }
        } else {
            throw new TypeError("expected function");
        }
    };

    $.fn.bind = function (event, data, callback) {
        return this.on(event, data, callback);
    };
    $.fn.unbind = function (event, callback) {
        return this.off(event, callback);
    };
    $.fn.one = function (event, selector, data, callback) {
        return this.on(event, selector, data, callback, 1);
    };
    var returnTrue = function () {
        return true;
    },
        returnFalse = function () {
        return false;
    },
        // 构建事件对象时所不要的几个属性：returnValue、layerX和layerY(还有以大写字母开头的属性？)
    ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,

    // 事件对象需要添加的三个方法名
    eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
    };
    // 添加eventMethods里面的三个方法：isDefaultPrevented、isDefaultPrevented和isPropagationStopped    
    function compatible(event, source) {
        if (source || !event.isDefaultPrevented) {
            source || (source = event);
            //遍历eventMethods对象，name是key，predicate是value
            $.each(eventMethods, function (name, predicate) {
                var sourceMethod = source[name];
                event[name] = function () {
                    this[predicate] = returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                };
                event[predicate] = returnFalse;
            });

            try {
                event.timeStamp || (event.timeStamp = Date.now());
            } catch (ignored) {}

            // 设置isDefaultPrevented默认指向的函数
            // 如果有defaultPrevented属性，就根据defaultPrevented的值来判断
            if (source.defaultPrevented !== undefined ? source.defaultPrevented : 'returnValue' in source ? source.returnValue === false :
            //getPreventDefault和defaultPrevented属性类似，不过是非标准的。为了兼容没有defaultPrevented参数的浏览器
            source.getPreventDefault && source.getPreventDefault()) event.isDefaultPrevented = returnTrue;
        }
        return event;
    }
    // 构建事件代理中的事件对象
    function createProxy(event) {
        var key,
            proxy = { originalEvent: event }; // 新的事件对象有个originalEvent属性指向原对象
        // 将原生事件对象的属性复制给新对象，除了returnValue、layerX、layerY和值为undefined的属性
        // returnValue属性为beforeunload事件独有
        for (key in event) if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];
        // 添加eventMethods里面的几个方法，并返回新的事件对象
        return compatible(proxy, event);
    }
    //delegate undelegate live die不推荐, 使用 on/off 代替
    $.fn.delegate = function (selector, event, callback) {
        return this.on(event, selector, callback);
    };
    $.fn.undelegate = function (selector, event, callback) {
        return this.off(event, selector, callback);
    };

    $.fn.live = function (event, callback) {
        $(document.body).delegate(this.selector, event, callback);
        return this;
    };
    $.fn.die = function (event, callback) {
        $(document.body).undelegate(this.selector, event, callback);
        return this;
    };
    /**
     *on(type, [selector], function(e){ ... })
     *on(type, [selector], [data], function(e){ ... })
     *on({ type: handler, type2: handler2, ... }, [selector]) 
     *on({ type: handler, type2: handler2, ... }, [selector], [data])
     */
    $.fn.on = function (event, selector, data, callback, one) {
        var autoRemove,
            delegator,
            $this = this;
        //event 为对象，批量绑定事件
        if (event && !isString(event)) {
            $.each(event, function (type, fn) {
                $this.on(type, selector, data, fn, one);
            });
            return $this;
        }

        //处理参数
        //没传selector参数 callback不是函数，且不为false
        if (!isString(selector) && !isFunction(callback) && callback !== false) callback = data, data = selector, selector = undefined;
        //没传data
        if (callback === undefined || data === false) callback = data, data = undefined;

        if (callback === false) callback = returnFalse;
        // 给每一个Z对象里面的元素绑定事件
        return $this.each(function (_, element) {
            // 绑定一次，自动解绑
            if (one) autoRemove = function (e) {
                remove(element, e.type, callback);
                return callback.apply(this, arguments);
            };
            //有selector选择符，使用代理
            if (selector) delegator = function (e) {
                var evt,
                    match = $(e.target).closest(selector, element).get(0);
                if (match && match !== element) {
                    evt = $.extend(createProxy(e), { currentTarget: match, liveFired: element });
                    return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
                }
            };
            //绑定事件在这里
            add(element, event, callback, data, selector, delegator || autoRemove);
        });
    };
    //取消事件绑定
    $.fn.off = function (event, selector, callback) {
        var $this = this;
        if (event && !isString(event)) {
            $.each(event, function (type, fn) {
                $this.off(type, selector, fn);
            });
            return $this;
        }

        if (!isString(selector) && !isFunction(callback) && callback !== false) callback = selector, selector = undefined;

        if (callback === false) callback = returnFalse;

        return $this.each(function () {
            remove(this, event, callback, selector);
        });
    };
    $.fn.trigger = function (event, args) {
        event = isString(event) || $.isPlainObject(event) ? $.Event(event) : compatible(event);
        event._args = args;
        return this.each(function () {
            // handle focus(), blur() by calling them directly
            // 过直接调用focus()和blur()方法来触发对应事件，这算是对触发事件方法的一个优化
            if (event.type in focus && typeof this[event.type] == "function") {
                this[event.type]();
            }
            // items in the collection might not be DOM elements
            else if ('dispatchEvent' in this) {
                    this.dispatchEvent(event);
                } else {
                    $(this).triggerHandler(event, args);
                }
        });
    };

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    // 直接触发事件的回调函数，而不是直接触发一个事件，所以也不冒泡
    $.fn.triggerHandler = function (event, args) {
        var e, result;
        this.each(function (i, element) {
            e = createProxy(isString(event) ? $.Event(event) : event);
            e._args = args;
            e.target = element;
            $.each(findHandlers(element, event.type || event), function (i, handler) {
                result = handler.proxy(e);
                if (e.isImmediatePropagationStopped()) return false;
            });
        });
        return result;
    };
    // shortcut methods for `.bind(event, fn)` for each event type
    // 绑定和触发事件的快捷方式
    // 使用: $('div').click()
    ('focusin focusout focus blur load resize scroll unload click dblclick ' + 'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' + 'change select keydown keypress keyup error').split(' ').forEach(function (event) {
        $.fn[event] = function (callback) {
            return 0 in arguments ? this.bind(event, callback) : this.trigger(event);
        };
    });
    //生成一个模拟事件，如果是鼠标相关事件，document.createEvent传入的第一个参数为'MouseEvents'
    $.Event = function (type, props) {
        if (!isString(type)) props = type, type = props.type;
        var event = document.createEvent(specialEvents[type] || 'Events'),
            bubbles = true;
        if (props) for (var name in props) name == 'bubbles' ? bubbles = !!props[name] : event[name] = props[name];
        event.initEvent(type, bubbles, true);
        return compatible(event);
    };
};

/**
 * ajax模块
 */
/**
 * 
当global: true时。在Ajax请求生命周期内，以下这些事件将被触发。
ajaxStart (global)：如果没有其他Ajax请求当前活跃将会被触发。
ajaxBeforeSend (data: xhr, options)：再发送请求前，可以被取消。
ajaxSend (data: xhr, options)：像 ajaxBeforeSend，但不能取消。
ajaxSuccess (data: xhr, options, data)：当返回成功时。
ajaxError (data: xhr, options, error)：当有错误时。
ajaxComplete (data: xhr, options)：请求已经完成后，无论请求是成功或者失败。
ajaxStop (global)：如果这是最后一个活跃着的Ajax请求，将会被触发。
 * 
 */
var Ajax = function ($) {
    //使用jsonp没有传入回调函数名时，使用json+jsonpID为回调函数名(例如：json1)
    var jsonpID = +new Date(),
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        //用来除掉html代码中的<script>标签
    scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        //用来判断是不是js的mime
    jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/,
        originAnchor = document.createElement('a');
    originAnchor.href = window.location.href;
    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
        var event = $.Event(eventName); //包装成事件
        $(context).trigger(event, data); //触发
        return !event.isDefaultPrevented();
    }
    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) return triggerAndReturn(context || document, eventName, data);
    }
    // Number of active Ajax requests
    // 发送中的ajax请求个数
    $.active = 0;
    //如果没有其他Ajax请求当前活跃将会被触发
    function ajaxStart(settings) {
        if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart');
    }
    // 所有ajax请求都完成后才触发
    // jquery中：
    // $("div").ajaxStop(function(){
    //    alert("所有 AJAX 请求已完成");
    // });
    function ajaxStop(settings) {
        if (settings.global && ! --$.active) triggerGlobal(settings, null, 'ajaxStop');
    }
    //请注意：并不是先执行的AJAX请求就一定先结束，这与整个AJAX请求过程中的网络、数据量、
    //相关代码执行时间等方面密切相关 

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    // 触发选项中beforeSend回调函数和触发ajaxBeforeSend事件
    // 上述的两步中的回调函数中返回false可以停止发送ajax请求，否则就触发ajaxSend事件
    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context;
        if (settings.beforeSend.call(context, xhr, settings) === false || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) return false;

        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
    }

    function ajaxSuccess(data, xhr, settings, deferred) {
        var context = settings.context,
            status = 'success';
        settings.success.call(context, data, status, xhr);
        if (deferred) deferred.resolveWith(context, [data, status, xhr]);
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
        ajaxComplete(status, xhr, settings);
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
        var context = settings.context;
        settings.error.call(context, xhr, type, error);
        if (deferred) deferred.rejectWith(context, [xhr, type, error]);
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
        ajaxComplete(type, xhr, settings);
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context;
        settings.complete.call(context, xhr, status);
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
        ajaxStop(settings);
    }

    function ajaxDataFilter(data, type, settings) {
        if (settings.dataFilter == empty) return data;
        var context = settings.context;
        return settings.dataFilter.call(context, data, type);
    }
    // Empty function, used as default callback
    // 空函数，被用作默认的回调函数
    function empty() {}
    //type="JSONP"的$.ajax方法
    $.ajaxJSONP = function (options, deferred) {
        // 没有type选项，调用$.ajax实现
        if (!('type' in options)) return $.ajax(options);

        var _callbackName = options.jsonpCallback,

        //options配置写了jsonpCallback，那么回调函数的名字就是options.jsonpCallback
        //没有就是'Zepto' + (jsonpID++)
        callbackName = ($.isFunction(_callbackName) ? _callbackName() : _callbackName) || 'Zepto' + jsonpID++,
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function (errorType) {
            $(script).triggerHandler('error', errorType || 'abort');
        },
            xhr = { abort: abort },
            abortTimeout;

        if (deferred) deferred.promise(xhr);
        // 加载成功或者失败触发相应的回调函数
        // load error 在event.js
        $(script).on('load error', function (e, errorType) {
            clearTimeout(abortTimeout);
            // 加载成功或者失败都会移除掉添加到页面的script标签和绑定的事件
            $(script).off().remove();

            if (e.type == 'error' || !responseData) {
                //失败
                ajaxError(null, errorType || 'error', xhr, options, deferred);
            } else {
                //成功
                ajaxSuccess(responseData[0], xhr, options, deferred);
            }

            window[callbackName] = originalCallback;
            if (responseData && $.isFunction(originalCallback)) originalCallback(responseData[0]);

            originalCallback = responseData = undefined;
        });
        // 在beforeSend回调函数或者ajaxBeforeSend事件中返回了false，取消ajax请求
        if (ajaxBeforeSend(xhr, options) === false) {
            abort('abort');
            return xhr;
        }

        window[callbackName] = function () {
            responseData = arguments;
        };
        // 参数中添加上变量名
        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        document.head.appendChild(script);
        //超时处理
        if (options.timeout > 0) abortTimeout = setTimeout(function () {
            abort('timeout');
        }, options.timeout);

        return xhr;
    };
    $.ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        beforeSend: empty,
        // Callback that is executed if the request succeeds
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function () {
            return new window.XMLHttpRequest();
        },
        // MIME types mapping
        // IIS returns Javascript as "application/x-javascript"
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 0,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: true,
        //Used to handle the raw response data of XMLHttpRequest.
        //This is a pre-filtering function to sanitize the response.
        //The sanitized response should be returned
        dataFilter: empty
    };

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0];
        return mime && (mime == htmlType ? 'html' : mime == jsonType ? 'json' : scriptTypeRE.test(mime) ? 'script' : xmlTypeRE.test(mime) && 'xml') || 'text';
    }
    //把参数添加到url上
    function appendQuery(url, query) {
        if (query == '') return url;
        return (url + '&' + query).replace(/[&?]{1,2}/, '?');
        //将&、&&、&?、?、?、&?&? 转化为 ?
    }
    // serialize payload and append it to the URL for GET requests
    // 列化data参数，并且如果是GET方法的话把参数添加到url参数上
    function serializeData(options) {
        //options.data是个对象
        if (options.processData && options.data && $.type(options.data) != "string") console.info(options.data);
        options.data = $.param(options.data, options.traditional);

        // 请求方法为GET，data参数添加到url上
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType)) options.url = appendQuery(options.url, options.data), options.data = undefined;
    }
    $.ajax = function (options) {
        var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor,
            hashIndex;
        for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

        ajaxStart(settings); //开始
        // 如果没有传入crossDomain参数，就通过检测setting.url和网址的protocol、host是否一致判断该请求是否跨域
        if (!settings.crossDomain) {
            // 通过设置a元素的href就可以很方便的获取一个url的各组成部分
            urlAnchor = document.createElement('a');
            urlAnchor.href = settings.url;
            // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
            urlAnchor.href = urlAnchor.href;
            settings.crossDomain = originAnchor.protocol + '//' + originAnchor.host !== urlAnchor.protocol + '//' + urlAnchor.host;
        }
        // 没有传入url参数，使用网站的网址为url参数
        // window.location.toString() 等于 window.location.href
        if (!settings.url) settings.url = window.location.toString();
        //去掉url上的hash部分
        if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex);
        serializeData(settings); // 序列化data参数，并且如果是GET方法的话把参数添加到url参数上
        var dataType = settings.dataType,
            hasPlaceholder = /\?.+=\?/.test(settings.url); // 判断url参数是否包含=?
        if (hasPlaceholder) dataType = 'jsonp'; //jsonp url 举例http://www.xxx.com/xx.php?callback=?

        // 设置了cache参数为false，或者cache参数不为true而且请求数据的类型是script或jsonp，就在url上添加时间戳防止浏览器缓存
        // (cache设置为true也不一定会缓存，具体要看缓存相关的http响应首部)
        if (settings.cache === false || (!options || options.cache !== true) && ('script' == dataType || 'jsonp' == dataType)) settings.url = appendQuery(settings.url, '_=' + Date.now());

        // jsonp调用$.ajaxJSONP实现
        if ('jsonp' == dataType) {
            if (!hasPlaceholder) settings.url = appendQuery(settings.url, settings.jsonp ? settings.jsonp + '=?' : settings.jsonp === false ? '' : 'callback=?');
            return $.ajaxJSONP(settings, deferred);
        }

        // 下面代码用来设置请求的头部、相应的mime类型等
        var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function (name, value) {
            headers[name.toLowerCase()] = [name, value];
        },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            //XMLHttpRequest
        nativeSetHeader = xhr.setRequestHeader,
            abortTimeout;

        if (deferred) deferred.promise(xhr);

        //不跨域
        if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest');
        setHeader('Accept', mime || '*/*');
        if (mime = settings.mimeType || mime) {
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0];
            //重写由服务器返回的MIME type  注意，这个方法必须在send()之前被调用
            xhr.overrideMimeType && xhr.overrideMimeType(mime);
        }
        //设置contentType
        if (settings.contentType || settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET') setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');
        //如果配置中有对headers内容
        if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name]);
        xhr.setRequestHeader = setHeader; //设置头信息

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                //请求完成
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout);
                var result,
                    error = false;
                //请求成功
                //在本地调动ajax，也就是请求url以file开头，也代表请求成功
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 || xhr.status == 0 && protocol == 'file:') {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));

                    // 根据xhr.responseType和dataType处理返回的数据
                    if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob') {
                        result = xhr.response;
                    } else {
                        result = xhr.responseText;

                        try {
                            // http://perfectionkills.com/global-eval-what-are-the-options/
                            // sanitize response accordingly if data filter callback provided
                            // (1,eval)(result) 这样写还可以让result里面的代码在全局作用域里面运行
                            result = ajaxDataFilter(result, dataType, settings);
                            if (dataType == 'script') {
                                (1, eval)(result);
                            } else if (dataType == 'xml') {
                                result = xhr.responseXML;
                            } else if (dataType == 'json') {
                                result = blankRE.test(result) ? null : $.parseJSON(result);
                            }
                        } catch (e) {
                            error = e;
                        }

                        if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred);
                    }

                    ajaxSuccess(result, xhr, settings, deferred);
                } else {
                    ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred);
                }
            }
        };
        //必须send()之前
        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort();
            ajaxError(null, 'abort', xhr, settings, deferred);
            return xhr;
        }

        var async = 'async' in settings ? settings.async : true;
        /**
         * void open(
               DOMString method,
               DOMString url,
               optional boolean async,
               optional DOMString user,
               optional DOMString password
            );
         */
        xhr.open(settings.type, settings.url, async, settings.username, settings.password);

        if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

        for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

        // 超时丢弃请求
        if (settings.timeout > 0) abortTimeout = setTimeout(function () {
            xhr.onreadystatechange = empty;
            xhr.abort();
            ajaxError(null, 'timeout', xhr, settings, deferred);
        }, settings.timeout);

        /**
         * void send();
           void send(ArrayBuffer data);
           void send(Blob data);
           void send(Document data);
           void send(DOMString? data);
           void send(FormData data);
         */
        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null);
        return xhr;
    };

    // handle optional data/success arguments
    // 给$.get、$.post、$.getJSON和$.fn.load处理参数用
    function parseArguments(url, data, success, dataType) {
        if ($.isFunction(data)) dataType = success, success = data, data = undefined;
        if (!$.isFunction(success)) dataType = success, success = undefined;
        return {
            url: url,
            data: data,
            success: success,
            dataType: dataType
        };
    }

    $.get = function () /* url, data, success, dataType */{
        return $.ajax(parseArguments.apply(null, arguments));
    };

    $.post = function () /* url, data, success, dataType */{
        var options = parseArguments.apply(null, arguments);
        options.type = 'POST';
        return $.ajax(options);
    };

    $.getJSON = function () /* url, data, success */{
        var options = parseArguments.apply(null, arguments);
        options.dataType = 'json';
        return $.ajax(options);
    };

    $.fn.load = function (url, data, success) {
        if (!this.length) return this;
        var self = this,
            parts = url.split(/\s/),
            selector,
            options = parseArguments(url, data, success),
            callback = options.success;
        if (parts.length > 1) options.url = parts[0], selector = parts[1];
        options.success = function (response) {
            self.html(selector ? $('<div>').html(response.replace(rscript, "")).find(selector) : response);
            callback && callback.apply(self, arguments);
        };
        $.ajax(options);
        return this;
    };
    var escape = encodeURIComponent;
    //序列化
    //在Ajax post请求中将用作提交的表单元素的值编译成 URL编码的 字符串
    function serialize(params, obj, traditional, scope) {
        var type,
            array = $.isArray(obj),
            hash = $.isPlainObject(obj);
        // debugger;

        $.each(obj, function (key, value) {
            type = $.type(value);

            if (scope) {
                key = traditional ? scope : scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';
            }
            // handle data in serializeArray() format
            if (!scope && array) {
                //obj是个数组
                params.add(value.name, value.value);
            }
            // obj的value是个数组/对象
            else if (type == "array" || !traditional && type == "object") {
                    serialize(params, value, traditional, key);
                } else {
                    params.add(key, value);
                }
        });
    }
    $.param = function (obj, traditional) {
        var params = [];
        //serialize函数使用add
        params.add = function (key, value) {
            if ($.isFunction(value)) value = value();
            if (value == null) value = "";
            this.push(escape(key) + '=' + escape(value));
        };
        serialize(params, obj, traditional); //处理obj
        return params.join('&').replace(/%20/g, '+');
    };
};

/**
 * callback API
 */
/**
 * 回调函数管理：添加add() 移除remove()、触发fire()、锁定lock()、禁用disable()回调函数。
 * 它为Deferred异步队列提供支持
 * 原理：通过一个数组保存回调函数，其他方法围绕此数组进行检测和操作
 *
 *  标记：
 *      once： 回调只能触发一次
 *      memory 记录上一次触发回调函数列表时的参数，之后添加的函数都用这参数立即执行
 *      unique  一个回调函数只能被添加一次        
 *      stopOnFalse 当某个回调函数返回false时中断执行
 */
var Callbacks = function ($) {
    $.Callbacks = function (options) {
        options = $.extend({}, options);

        var memory,
            // Last fire value (for non-forgettable lists)
        fired,
            // Flag to know if list was already fired    //是否回调过
        firing,
            // Flag to know if list is currently firing  //回调函数列表是否正在执行中
        firingStart,
            // First callback to fire (used internally by add and fireWith) //第一回调函数的下标
        firingLength,
            // End of the loop when firing   //回调函数列表长度？
        firingIndex,
            // Index of currently firing callback (modified by remove if needed)
        list = [],
            // Actual callback list     //回调数据源： 回调列表
        stack = !options.once && [],
            // Stack of fire calls for repeatable lists//回调只能触发一次的时候，stack永远为false
        /**
         * 触发   回调底层函数
         */
        fire = function (data) {
            memory = options.memory && data;
            fired = true;
            firingIndex = firingStart || 0;
            firingStart = 0;
            firingLength = list.length;
            firing = true; //正在回调
            //遍历回调列表，全部回调函数都执行，参数是传递过来的data
            for (; list && firingIndex < firingLength; ++firingIndex) {
                //如果 list[ firingIndex ] 为false，且stopOnFalse（中断）模式
                //list[firingIndex].apply(data[0], data[1])  这是执行回调
                //data经过封装，[context,arg] 第一个参数为上下文
                if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
                    memory = false; //中断回掉执行
                    break;
                }
            }
            firing = false; //回调执行完毕
            if (list) {
                //stack里还缓存有未执行的回调
                if (stack) {
                    //options.once存在的时候，不执行下面的一行
                    stack.length && fire(stack.shift()); //执行stack里的回调
                } else if (memory) {
                    list.length = 0; //memory 清空回调列表
                } else {
                    Callbacks.disable(); //其他情况如  once 禁用回调
                }
            }
        },
            Callbacks = {
            add: function () {
                if (list) {
                    var start = list.length,
                        add = function (args) {
                        //可以处理参数是数组的形式
                        $.each(args, function (_, arg) {
                            if (typeof arg === "function") {
                                //非unique，或者是unique，但回调列表未添加过
                                if (!options.unique || !Callbacks.has(arg)) list.push(arg);
                            } else if (arg && arg.length && typeof arg !== 'string') {
                                //是数组/伪数组，添加，重新遍历   
                                add(arg);
                            }
                        });
                    };
                    add(arguments); //添加进列表
                    if (firing) {
                        //如果列表正在执行中，修正长度，使得新添加的回调也可以执行
                        firingLength = list.length;
                    } else if (memory) {
                        firingStart = start; //memory 模式下，修正开始下标
                        fire(memory); //立即执行所有回调
                    }
                }
                return this;
            },
            //从回调列表里删除一个或一组回调函数
            remove: function () {
                if (list) {
                    //回调列表存在才可以删除
                    $.each(arguments, function (_, arg) {
                        var index;
                        while ((index = $.inArray(arg, list, index)) > -1) {
                            list.splice(index, 1); //执行删除
                            // Handle firing indexes
                            if (firing) {
                                //避免回调列表溢出
                                if (index <= firingLength) --firingLength; //在正执行的回调函数后，递减结尾下标
                                if (index <= firingIndex) --firingIndex; //在正执行的回调函数前，递减开始下标
                            }
                        }
                    });
                }
                return this;
            },
            //检查指定的回调函数是否在回调列表中

            has: function (fn) {
                return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length));
            },
            //清空回调函数
            empty: function () {
                firingLength = list.length = 0;
                return this;
            },
            //禁用回掉函数
            disable: function () {
                list = stack = memory = undefined;
                return this;
            },
            //是否禁用了回调函数
            disabled: function () {
                return !list;
            },
            //锁定回调函数
            lock: function () {
                stack = undefined;
                //非memory模式下，禁用列表
                if (!memory) Callbacks.disable();
                return this;
            },
            //是否是锁定的
            locked: function () {
                return !stack;
            },
            //用上下文、参数执行列表中的所有回调函数
            fireWith: function (context, args) {
                // 未回调过，非锁定、禁用时
                if (list && (!fired || stack)) {
                    args = args || [];
                    args = [context, args.slice ? args.slice() : args];
                    if (firing) {
                        stack.push(args); //正在回调中,存入stack
                    } else {
                        fire(args); //否则立即回调,外层fire函数
                    }
                }
                return this;
            },
            fire: function () {
                //执行回调
                return Callbacks.fireWith(this, arguments);
            },
            //回调列表是否被回调过
            fired: function () {
                return !!fired;
            }
        };

        return Callbacks;
    };
};

/**
 * deferred模块-延迟执行
 */
/**
 * 由于deferred是基于Promise规范，我们首先需要理清楚Promises/A+是什么。
 *　它的规范内容大致如下(此翻译内容引自这里)　
 *   一个promise可能有三种状态：等待（pending）、已完成（fulfilled）、已拒绝（rejected）
 *   
一个promise的状态只可能从“等待”转到“完成”态或者“拒绝”态，不能逆向转换，同时“完成”态和“拒绝”态不能相互转换

promise必须实现then方法（可以说，then就是promise的核心），而且then必须返回一个promise，
同一个promise的then可以调用多次，并且回调的执行顺序跟它们被定义时的顺序一致

then方法接受两个参数，第一个参数是成功时的回调，在promise由“等待”态转换到“完成”态时调用，
另一个是失败时的回调，在promise由“等待”态转换到“拒绝”态时调用。同时，then可以接受另一个promise传入，
也接受一个“类then”的对象或方法，即thenable对象
 * 
 */
var DeferredMod$1 = function ($) {
    var slice = Array.prototype.slice;

    function Deferred(func) {
        /*********************变量***************************************/
        //元组：描述状态、状态切换方法名、对应状态执行方法名、回调列表的关系
        //tuple引自C++/python，和list的区别是，它不可改变 ，用来存储常量集
        var tuples = [
        // action, add listener, listener list, final state
        ["resolve", "done", $.Callbacks({ once: 1, memory: 1 }), "resolved"], ["reject", "fail", $.Callbacks({ once: 1, memory: 1 }), "rejected"], ["notify", "progress", $.Callbacks({ memory: 1 })]],
            state = "pending",
            //Promoise的初始状态
        //promise对象，promise和deferred的区别是:
        /*promise只包含执行阶段的方法always(),then(),done(),fail(),progress()及辅助方法state()、promise()等。
          deferred则在继承promise的基础上，增加切换状态的方法，resolve()/resolveWith(),reject()/rejectWith(),notify()/notifyWith()*/
        //所以称promise是deferred的只读副本
        promise = {
            // 返回状态
            state: function () {
                return state;
            },
            //成功/失败均回调调用
            always: function () {
                deferred.done(arguments).fail(arguments);
                return this;
            },
            then: function () /* fnDone [, fnFailed [, fnProgress]] */{
                var fns = arguments;
                //注意，这无论如何都会返回一个新的Deferred只读副本，
                //返回Deferred(func)函数，传递一个函数作为参数func，
                //`if (func) func.call(deferred, deferred);`执行func，这个时候defer就是deferred
                return Deferred(function (defer) {
                    $.each(tuples, function (i, tuple) {
                        //i==0: done   i==1: fail  i==2 progress
                        var fn = $.isFunction(fns[i]) && fns[i];
                        //执行新deferred done/fail/progress
                        deferred[tuple[1]](function () {
                            //直接执行新添加的回调 fnDone fnFailed fnProgress
                            var returned = fn && fn.apply(this, arguments);
                            if (returned && $.isFunction(returned.promise)) {
                                //转向fnDone fnFailed fnProgress返回的promise对象
                                //注意，这里是两个promise对象的数据交流
                                //新deferrred对象切换为对应的成功/失败/通知状态，传递的参数为 returned.promise() 给予的参数值    
                                returned.promise().done(defer.resolve).fail(defer.reject).progress(defer.notify);
                            } else {
                                var context = this === promise ? defer.promise() : this,
                                    values = fn ? [returned] : arguments;
                                defer[tuple[0] + "With"](context, values); //新deferrred对象切换为对应的成功/失败/通知状态
                            }
                        });
                    });
                    fns = null;
                }).promise();
                // 返回deferrred.promise  因其没有resolve和reject方法，所以在外面不能该调用这两个方法改变状态
            },
            //返回obj的promise对象
            promise: function (obj) {
                return obj != null ? $.extend(obj, promise) : promise;
            }
        },
            deferred = {};
        /*********************变量end***************************************/
        //给deferred添加切换状态方法
        $.each(tuples, function (i, tuple) {
            var list = tuple[2],
                //$.Callback
            stateString = tuple[3]; //状态 一共2个：resolved  rejected

            //扩展promise的done、fail、progress为Callback的add方法，使其成为回调列表
            //简单写法：
            // promise['done'] = $.Callbacks( "once memory" ).add
            // promise['fail'] = $.Callbacks( "once memory" ).add  
            // promise['progress'] = $.Callbacks( "memory" ).add
            // 使用的时候  .done(func)  func就添加到了回调函数中
            promise[tuple[1]] = list.add;

            //切换的状态是resolve成功/reject失败
            //添加首组方法做预处理，修改state的值，使成功或失败互斥，锁定progress回调列表
            if (stateString) {
                list.add(function () {
                    state = stateString;
                    //i^1  ^异或运算符  0^1=1 1^1=0，成功或失败回调互斥，调用一方，禁用另一方
                }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
            } //因为回调函数带有memory，add后立刻执行.包括上面的 promise[tuple[1]]
            //添加切换状态方法 resolve()/resolveWith(),reject()/rejectWith(),notify()/notifyWith()
            deferred[tuple[0]] = function () {
                //使用list.fireWith 调用
                deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
                return this;
            };
            //使用 deferred.resolveWith()就使用fireWith调用了回调函数
            deferred[tuple[0] + "With"] = list.fireWith;
        });
        //deferred包装成promise 继承promise对象的方法
        //调用promise的promise方法
        promise.promise(deferred);
        //传递了参数func，执行
        if (func) func.call(deferred, deferred);

        //返回deferred对象
        return deferred;
    } //Deferred函数结束

    /**
     * 主要用于多异步队列处理。
       多异步队列都成功，执行成功方法，一个失败，执行失败方法
       也可以传非异步队列对象
     * @param sub
     * @returns {*}
     */
    $.when = function (sub) {
        var resolveValues = slice.call(arguments),
            //队列数组 ，因为可能是多个参数。未传参数是[]
        len = resolveValues.length,
            //队列个数
        i = 0,
            remain = len !== 1 || sub && $.isFunction(sub.promise) ? len : 0,
            //子deferred个数
        deferred = remain === 1 ? sub : Deferred(),
            //主def,如果是1个fn，直接以它为主def，否则建立新的Def
        progressValues,
            progressContexts,
            resolveContexts,
            updateFn = function (i, ctx, val) {
            return function (value) {
                ctx[i] = this; //this
                val[i] = arguments.length > 1 ? slice.call(arguments) : value; // val 调用成功函数列表的参数
                if (val === progressValues) {
                    deferred.notifyWith(ctx, val); // 如果是通知，调用主函数的通知，通知可以调用多次
                } else if (! --remain) {
                    //如果是成功，则需等成功计数为0，即所有子def都成功执行了，remain变为0
                    //有一个失败，计数就不为0
                    deferred.resolveWith(ctx, val); //调用主函数的成功
                }
            };
        };
        //参数多余1个，异步队列多余1个    
        if (len > 1) {
            progressValues = new Array(len);
            progressContexts = new Array(len);
            resolveContexts = new Array(len);
            for (; i < len; ++i) {
                if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
                    resolveValues[i].promise().done(updateFn(i, resolveContexts, resolveValues)) //每一个成功
                    .fail(deferred.reject) //直接挂入主def的失败通知函数,当某个子def失败时，
                    //调用主def的切换失败状态方法，执行主def的失败函数列表   
                    .progress(updateFn(i, progressContexts, progressValues));
                } else {
                    --remain; //非def，直接标记成功，减1
                }
            }
        }
        //都为非def，比如无参数，或者所有子队列全为非def，直接通知成功，进入成功函数列表
        if (!remain) deferred.resolveWith(resolveContexts, resolveValues);
        return deferred.promise();
    };
    $.Deferred = Deferred;
};

/**
 * 动画模块
 */

var Fx = function ($) {
    var prefix = '',
        eventPrefix,
        vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
        testEl = document.createElement('div'),
        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform,
        transitionProperty,
        transitionDuration,
        transitionTiming,
        transitionDelay,
        //过渡
    animationName,
        animationDuration,
        animationTiming,
        animationDelay,
        //动画
    cssReset = {};

    //将驼峰字符串转成css属性，如aB-->a-b
    function dasherize(str) {
        return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase();
    }
    //修正事件名
    function normalizeEvent(name) {
        return eventPrefix ? eventPrefix + name : name.toLowerCase();
    }

    /**
     * 根据浏览器内核，设置CSS前缀，事件前缀
     * 如css：-webkit-  event:webkit
     * 为prefix和eventPrefix赋值
     */
    if (testEl.style.transform === undefined) {
        $.each(vendors, function (vendor, event) {
            if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
                prefix = '-' + vendor.toLowerCase() + '-';
                eventPrefix = event;
                return false;
            }
        });
    }

    transform = prefix + 'transform';
    //均为空''
    cssReset[transitionProperty = prefix + 'transition-property'] = cssReset[transitionDuration = prefix + 'transition-duration'] = cssReset[transitionDelay = prefix + 'transition-delay'] = cssReset[transitionTiming = prefix + 'transition-timing-function'] = cssReset[animationName = prefix + 'animation-name'] = cssReset[animationDuration = prefix + 'animation-duration'] = cssReset[animationDelay = prefix + 'animation-delay'] = cssReset[animationTiming = prefix + 'animation-timing-function'] = '';
    /**
     * 动画常量数据源
     * @type {{off: boolean, speeds: {_default: number, fast: number, slow: number}, cssPrefix: string, transitionEnd: *, animationEnd: *}}
     */
    $.fx = {
        off: eventPrefix === undefined && testEl.style.transitionProperty === undefined, //能力检测是否支持动画，具体检测是否支持过渡，支持过渡事件
        speeds: { _default: 400, fast: 200, slow: 600 },
        cssPrefix: prefix, //css 前缀  如-webkit-
        transitionEnd: normalizeEvent('TransitionEnd'), //过渡结束事件
        animationEnd: normalizeEvent('AnimationEnd') //动画播放结束事件
    };
    /**
     * [animate 自定义动画]
     * @param  {[Object]}   properties [属性变化成，如{"width":"300px"}]
     * @param  {[type]}   duration   [速度 如slow或者一个数字]
     * @param  {[type]}   ease       [变化的速率ease、linear、ease-in / ease-out、ease-in-out
    cubic-bezier]
     * @param  {Function} callback   [回调函数]
     * @param  {[type]}   delay      [延迟时间]
     */
    $.fn.animate = function (properties, duration, ease, callback, delay) {
        //参数处理
        if ($.isFunction(duration)) //传参为function(properties,callback)
            callback = duration, ease = undefined, duration = undefined;
        if ($.isFunction(ease)) //传参为function(properties,duration，callback)
            callback = ease, ease = undefined;
        if ($.isPlainObject(duration)) //传参为function(properties,｛｝)
            ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration;
        //duration参数处理
        if (duration) duration = (typeof duration == 'number' ? duration : $.fx.speeds[duration] || $.fx.speeds._default) / 1000;
        if (delay) delay = parseFloat(delay) / 1000;
        return this.anim(properties, duration, ease, callback, delay);
    };
    /**
     * [anim 动画的逻辑核心]
     * @param  {[Object]} properties [属性变化成，如{"width":"300px"}]
     * @param  {[type]}   duration   [速度 如slow或者一个数字]
     * @param  {[type]}   ease       [变化的速率ease、linear、ease-in / ease-out、ease-in-out
    cubic-bezier]
     * @param  {Function} callback   [回调函数]
     * @param  {[type]}   delay      [延迟时间]
     */
    $.fn.anim = function (properties, duration, ease, callback, delay) {
        var key,
            cssValues = {},
            cssProperties,
            transforms = '',
            that = this,
            wrappedCallback,
            endEvent = $.fx.transitionEnd,
            fired = false;
        //修正好时间
        if (duration === undefined) duration = $.fx.speeds._default / 1000;
        if (delay === undefined) delay = 0;
        if ($.fx.off) duration = 0; //如果浏览器不支持动画，持续时间设为0，直接跳动画结束

        if (typeof properties == 'string') {
            // keyframe animation
            cssValues[animationName] = properties; //properties是动画名
            cssValues[animationDuration] = duration + 's';
            cssValues[animationDelay] = delay + 's';
            cssValues[animationTiming] = ease || 'linear';
            endEvent = $.fx.animationEnd;
        } else {
            //properties 是样式集对象
            cssProperties = [];
            // CSS transitions
            for (key in properties) {
                //是这些属性^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)
                if (supportedTransforms.test(key)) {
                    transforms += key + '(' + properties[key] + ') '; //拼凑成变形方法
                } else {
                    cssValues[key] = properties[key], cssProperties.push(dasherize(key));
                }
            }
            if (transforms) cssValues[transform] = transforms, cssProperties.push(transform);
            if (duration > 0 && typeof properties === 'object') {
                cssValues[transitionProperty] = cssProperties.join(', ');
                cssValues[transitionDuration] = duration + 's';
                cssValues[transitionDelay] = delay + 's';
                cssValues[transitionTiming] = ease || 'linear';
            }
        }
        //动画完成后的响应函数
        wrappedCallback = function (event) {
            if (typeof event !== 'undefined') {
                if (event.target !== event.currentTarget) return; // makes sure the event didn't bubble from "below"
                $(event.target).unbind(endEvent, wrappedCallback);
            } else {
                $(this).unbind(endEvent, wrappedCallback); // triggered by setTimeout
            }

            fired = true;
            $(this).css(cssReset);

            callback && callback.call(this);
        };
        //处理动画结束事件
        if (duration > 0) {
            //绑定动画结束事件
            this.bind(endEvent, wrappedCallback);
            // transitionEnd is not always firing on older Android phones
            // so make sure it gets fired
            //延时ms后执行动画，注意这里加了25ms，保持endEvent，动画先执行完。
            //绑定过事件还做延时处理，是transitionEnd在older Android phones不一定触发    
            setTimeout(function () {
                if (fired) return;
                wrappedCallback.call(that);
            }, (duration + delay) * 1000 + 25);
        }

        // trigger page reflow so new elements can animate
        //主动触发页面回流，刷新DOM，让接下来设置的动画可以正确播放
        //更改 offsetTop、offsetLeft、 offsetWidth、offsetHeight；scrollTop、scrollLeft、
        //scrollWidth、scrollHeight；clientTop、clientLeft、clientWidth、clientHeight；getComputedStyle() 、
        //currentStyle()。这些都会触发回流。回流导致DOM重新渲染，平时要尽可能避免，
        //但这里，为了动画即时生效播放，则主动触发回流，刷新DOM

        this.size() && this.get(0).clientLeft;

        //设置样式，启动动画
        this.css(cssValues);

        // duration为0，即浏览器不支持动画的情况，直接执行动画结束，执行回调。
        if (duration <= 0) setTimeout(function () {
            that.each(function () {
                wrappedCallback.call(this);
            });
        }, 0);

        return this;
    };

    testEl = null;
};

/**
 * 动画方法
 */
var Fx_methods = function ($) {
    var document = window.document,
        docElem = document.documentElement,
        origShow = $.fn.show,
        origHide = $.fn.hide,
        origToggle = $.fn.toggle;

    function anim(el, speed, opacity, scale, callback) {
        if (typeof speed == 'function' && !callback) callback = speed, speed = undefined;
        var props = { opacity: opacity };
        if (scale) {
            props.scale = scale;
            el.css($.fx.cssPrefix + 'transform-origin', '0 0'); //设置变形原点
        }
        return el.animate(props, speed, null, callback); //不支持速率变化
    }

    function hide(el, speed, scale, callback) {
        //$(dom).animate({opacity: 0, '-webkit-transform-origin': '0px 0px 0px', '-webkit-transform': 'scale(0, 0)' },800)
        //设置了变形原点，缩放为0，它就会缩到左上角再透明
        return anim(el, speed, 0, scale, function () {
            origHide.call($(this));
            callback && callback.call(this);
        });
    }

    $.fn.show = function (speed, callback) {
        origShow.call(this);
        if (speed === undefined) {
            speed = 0;
        } else {
            this.css('opacity', 0);
        }
        return anim(this, speed, 1, '1,1', callback);
    };

    $.fn.hide = function (speed, callback) {
        if (speed === undefined) {
            return origHide.call(this);
        } else {
            return hide(this, speed, '0,0', callback);
        }
    };

    $.fn.toggle = function (speed, callback) {
        if (speed === undefined || typeof speed == 'boolean') {
            return origToggle.call(this, speed);
        } else {
            return this.each(function () {
                var el = $(this);
                el[el.css('display') == 'none' ? 'show' : 'hide'](speed, callback);
            });
        }
    };

    $.fn.fadeTo = function (speed, opacity, callback) {
        return anim(this, speed, opacity, null, callback);
    };

    $.fn.fadeIn = function (speed, callback) {
        var target = this.css('opacity');
        if (target > 0) {
            this.css('opacity', 0);
        } else {
            target = 1;
        }
        return origShow.call(this).fadeTo(speed, target, callback);
    };

    $.fn.fadeOut = function (speed, callback) {
        return hide(this, speed, null, callback);
    };

    $.fn.fadeToggle = function (speed, callback) {
        return this.each(function () {
            var el = $(this);
            el[el.css('opacity') == 0 || el.css('display') == 'none' ? 'fadeIn' : 'fadeOut'](speed, callback);
        });
    };
};

Event($);
Ajax($);
Callbacks($);
DeferredMod$1($);
Fx($);
Fx_methods($);

return Zepto;

})));
//# sourceMappingURL=bundle.js.map
