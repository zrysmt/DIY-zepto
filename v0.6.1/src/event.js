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
var Event = function($) {
    var _zid = 1, //用来生成标示元素和回调函数的id，每标示一个就+1
        undefined,
        handlers = {},
        slice = Array.prototype.slice,
        isFunction = $.isFunction,
        isString = function(obj) {
            return typeof obj == 'string';
        },
        specialEvents = {},
        focusinSupported = 'onfocusin' in window,
        focus = { focus: 'focusin', blur: 'focusout' },
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

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
        return (handlers[zid(element)] || []).filter(function(handler) {
            return handler && (!event.e || handler.e == event.e) // 事件名不同的过滤掉
                && (!event.ns || matcher.test(handler.ns)) // 命名空间不同的过滤掉
                && (!fn || zid(handler.fn) === zid(fn)) // 回调函数不同的过滤掉(通过_zid属性判断是否同一个函数)
                && (!selector || handler.sel == selector); // selector不同的过滤掉
        })
    }
    //解析event参数，如 "click.abc"，abc作为ns(命名空间)
    function parse(event) {
        var parts = ('' + event).split('.');
        return { e: parts[0], ns: parts.slice(1).sort().join(' ') }
    }
    // 生成匹配的namespace表达式：'abc def' -> /(?:^| )abc .* ?def(?: |$)/
    function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }
    //focus和blur事件的冒泡
    //focus和blur事件本身是不冒泡的，如果需要对这两个事件进行事件代理，就要运用一些小技巧。
    //首先，如果浏览器支持focusin和focusout，就使用这两个可以冒泡事件来代替。
    //如果浏览器不支持focusion和focusout，就利用focus和blur捕获不冒泡的特性，
    //传入addEventListener中的第三个参数设置true，以此来进行事件代理
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
            //*************************构建handler*************************
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
        (events || '').split(/\s/).forEach(function(event) {
            findHandlers(element, event, fn, selector).forEach(function(handler) {
                delete handlers[id][handler.i];
                if ('removeEventListener' in element)
                    element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
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
    $.proxy = function(fn, context) {
        var args = (2 in arguments) && slice.call(arguments, 2);
        if (isFunction(fn)) {
            var proxyFn = function() {
                return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
            }
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


    $.fn.bind = function(event, data, callback) {
        return this.on(event, data, callback);
    };
    $.fn.unbind = function(event, callback) {
        return this.off(event, callback);
    };
    $.fn.one = function(event, selector, data, callback) {
        return this.on(event, selector, data, callback, 1);
    };
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
            //遍历eventMethods对象，name是key，predicate是value
            $.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name];
                event[name] = function() {
                    this[predicate] = returnTrue;
                    return sourceMethod && sourceMethod.apply(source, arguments);
                }
                event[predicate] = returnFalse;
            })

            try {
                event.timeStamp || (event.timeStamp = Date.now());
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
    // 构建事件代理中的事件对象
    function createProxy(event) {
        var key, proxy = { originalEvent: event }; // 新的事件对象有个originalEvent属性指向原对象
        // 将原生事件对象的属性复制给新对象，除了returnValue、layerX、layerY和值为undefined的属性
        // returnValue属性为beforeunload事件独有
        for (key in event)
            if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];
            // 添加eventMethods里面的几个方法，并返回新的事件对象
        return compatible(proxy, event);
    }
    //delegate undelegate live die不推荐, 使用 on/off 代替
    $.fn.delegate = function(selector, event, callback) {
        return this.on(event, selector, callback);
    };
    $.fn.undelegate = function(selector, event, callback) {
        return this.off(event, selector, callback);
    };

    $.fn.live = function(event, callback) {
        $(document.body).delegate(this.selector, event, callback);
        return this;
    };
    $.fn.die = function(event, callback) {
            $(document.body).undelegate(this.selector, event, callback);
            return this;
        };
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
            });
            return $this;
        }

        //处理参数
        //没传selector参数 callback不是函数，且不为false
        if (!isString(selector) && !isFunction(callback) && callback !== false)
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
            };
            //有selector选择符，使用代理
            if (selector) delegator = function(e) {
                var evt, match = $(e.target).closest(selector, element).get(0);
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
    $.fn.off = function(event, selector, callback) {
        var $this = this;
        if (event && !isString(event)) {
            $.each(event, function(type, fn) {
                $this.off(type, selector, fn);
            });
            return $this;
        }

        if (!isString(selector) && !isFunction(callback) && callback !== false)
            callback = selector, selector = undefined;

        if (callback === false) callback = returnFalse;

        return $this.each(function() {
            remove(this, event, callback, selector);
        });
    };
    $.fn.trigger = function(event, args) {
        event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event);
        event._args = args;
        return this.each(function() {
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
    $.fn.triggerHandler = function(event, args) {
        var e, result;
        this.each(function(i, element) {
            e = createProxy(isString(event) ? $.Event(event) : event);
            e._args = args;
            e.target = element;
            $.each(findHandlers(element, event.type || event), function(i, handler) {
                result = handler.proxy(e);
                if (e.isImmediatePropagationStopped()) return false;
            });
        });
        return result;
    };
    // shortcut methods for `.bind(event, fn)` for each event type
    // 绑定和触发事件的快捷方式
    // 使用: $('div').click()
    ('focusin focusout focus blur load resize scroll unload click dblclick ' +
        'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
        'change select keydown keypress keyup error').split(' ').forEach(function(event) {
        $.fn[event] = function(callback) {
            return (0 in arguments) ?
                this.bind(event, callback) :
                this.trigger(event);
        };
    });
    //生成一个模拟事件，如果是鼠标相关事件，document.createEvent传入的第一个参数为'MouseEvents'
    $.Event = function(type, props) {
        if (!isString(type)) props = type, type = props.type;
        var event = document.createEvent(specialEvents[type] || 'Events'),
            bubbles = true;
        if (props)
            for (var name in props)(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
        event.initEvent(type, bubbles, true);
        return compatible(event);
    };
};


export default Event;
