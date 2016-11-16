/**
 * 事件模块
 */
var Event = function($) {
    var _zid = 1, //用来生成标示元素和回调函数的id，每标示一个就+1
        handlers = {},
        isString = function(obj) {
            return typeof obj == 'string';
        },
        focusinSupported = 'onfocusin' in window,
        focus = { focus: 'focusin', blur: 'focusout' },
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

    function zid(element) {
        return element._zid || (element._zid = _zid++);
    }
    //解析event参数，如 "click.abc"，abc作为ns(命名空间)
    function parse(event) {
        var parts = ('' + event).split('.')
        return { e: parts[0], ns: parts.slice(1).sort().join(' ') }
    }

    function eventCapture(handler, captureSetting) {
        return handler.del &&
            (!focusinSupported && (handler.e in focus)) ||
            !!captureSetting;
    }

    function realEvent(type) {
        return hover[type] || (focusinSupported && focus[type]) || type;
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
            set = (handlers[id] || (handlers[id] = []));
        //多个事件以空格为间隔
        events.split(/\s/).forEach(function(event) {
            //为ready
            if (event == 'ready') return $(document).ready(fn);
            //构建handler
            var handler = parse(event);
            handler.fn = fn;
            handler.sel = selector;

            // emulate mouseenter, mouseleave
            // mouseenter、mouseleave通过mouseover、mouseout来模拟realEvent函数处理
            // hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }
            if (handler.e in hover) fn = function(e) {
                //http://www.w3school.com.cn/jsref/event_relatedtarget.asp
                // relatedTarget为相关元素，只有mouseover和mouseout事件才有
                // 对mouseover事件而言，相关元素就是那个失去光标的元素;
                // 对mouseout事件而言，相关元素则是获得光标的元素。
                var related = e.relatedTarget;
                if (!related || (related !== this && !$.contains(this, related)))
                    return handler.fn.apply(this, arguments);
            };
            handler.del = delegator;
            // 需要进行事件代理时，调用的是封装了fn的delegator函数
            var callback = delegator || fn;
            handler.proxy = function(e) {
                e = compatible(e);//无第二个参数，其实就是e = e;
                if (e.isImmediatePropagationStopped()) return e.data = data;
                var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
                    //当事件处理函数返回false时，阻止默认操作和冒泡
                if (result === false) e.preventDefault(), e.stopPropagation();
                return result;
            }
            handler.i = set.length; // 把handler在set中的下标赋值给handler.i
            set.push(handler);
            if ('addEventListener' in element)
            //addEventListener -- https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener
                element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
        })
    }


    var returnTrue = function() {
            return true;
        },
        returnFalse = function() {
            return false;
        }, // 构建事件对象时所不要的几个属性：returnValue、layerX和layerY(还有以大写字母开头的属性？)
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
            //遍历eventMethods对象，name是可以，predicate是value
            $.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name];
                event[name] = function() {
                    this[predicate] = returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                }
                event[predicate] = returnFalse;
            })

            try {
                event.timeStamp || (event.timeStamp = Date.now())
            } catch (ignored) {}

            // 设置isDefaultPrevented默认指向的函数
            // 如果有defaultPrevented属性，就根据defaultPrevented的值来判断
            if (source.defaultPrevented !== undefined ? source.defaultPrevented :
                'returnValue' in source ? source.returnValue === false :
                //getPreventDefault和defaultPrevented属性类似，不过是非标准的。为了兼容没有defaultPrevented参数的浏览器
                source.getPreventDefault && source.getPreventDefault())
                event.isDefaultPrevented = returnTrue;
        }
        return event;
    }
    /**
     *on(type, [selector], function(e){ ... })
     *on(type, [selector], [data], function(e){ ... })
     *on({ type: handler, type2: handler2, ... }, [selector]) 
     *on({ type: handler, type2: handler2, ... }, [selector], [data])
     */
    $.fn.on = function(event, selector, data, callback, one) {
        var autoRemove, delegator, $this = this;
        //event 为对象，批量绑定事件
        if (event && !isString(event)) {
            $.each(event, function(type, fn) {
                $this.on(type, selector, data, fn, one);
            })
            return $this;
        }
               
        //处理参数
        //没传selector参数 callback不是函数，且不为false
        if (!isString(selector) && !$.isFunction(callback) && callback !== false)
            callback = data, data = selector, selector = undefined;
        //没传data
        if (callback === undefined || data === false)
            callback = data, data = undefined;

        if (callback === false) callback = returnFalse;
        // 给每一个Z对象里面的元素绑定事件
        return $this.each(function(_, element) {
            // 绑定一次，自动解绑
            if (one) autoRemove = function(e) {
                    remove(element, e.type, callback);
                    return callback.apply(this, arguments);
                }
                //有selector选择符，使用代理
            if (selector) delegator = function(e) {
                    var evt, match = $(e.target).closest(selector, element).get(0);
                    if (match && match !== element) {
                        evt = $.extend(createProxy(e), { currentTarget: match, liveFired: element });
                        return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
                    }
                }
                //绑定事件在这里
            add(element, event, callback, data, selector, delegator || autoRemove);
        })
    }
};


export default Event;