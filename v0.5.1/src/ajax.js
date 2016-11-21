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
var Ajax = function($) {
    //使用jsonp没有传入回调函数名时，使用json+jsonpID为回调函数名(例如：json1)
    var jsonpID = +new Date(),
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, //用来除掉html代码中的<script>标签
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i, //用来判断是不是js的mime
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
        if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop');
    }
    //请注意：并不是先执行的AJAX请求就一定先结束，这与整个AJAX请求过程中的网络、数据量、
    //相关代码执行时间等方面密切相关 

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    // 触发选项中beforeSend回调函数和触发ajaxBeforeSend事件
    // 上述的两步中的回调函数中返回false可以停止发送ajax请求，否则就触发ajaxSend事件
    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context;
        if (settings.beforeSend.call(context, xhr, settings) === false ||
            triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
            return false;

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
    $.ajaxJSONP = function(options, deferred) {
        // 没有type选项，调用$.ajax实现
        if (!('type' in options)) return $.ajax(options);

        var _callbackName = options.jsonpCallback,
            //options配置写了jsonpCallback，那么回调函数的名字就是options.jsonpCallback
            //没有就是'Zepto' + (jsonpID++)
            callbackName = ($.isFunction(_callbackName) ?
                _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function(errorType) {
                $(script).triggerHandler('error', errorType || 'abort');
            },
            xhr = { abort: abort },
            abortTimeout;

        if (deferred) deferred.promise(xhr);
        // 加载成功或者失败触发相应的回调函数
        // load error 在event.js
        $(script).on('load error', function(e, errorType) {
            clearTimeout(abortTimeout);
            // 加载成功或者失败都会移除掉添加到页面的script标签和绑定的事件
            $(script).off().remove();

            if (e.type == 'error' || !responseData) { //失败
                ajaxError(null, errorType || 'error', xhr, options, deferred);
            } else { //成功
                ajaxSuccess(responseData[0], xhr, options, deferred);
            }

            window[callbackName] = originalCallback;
            if (responseData && $.isFunction(originalCallback))
                originalCallback(responseData[0]);

            originalCallback = responseData = undefined;
        });
        // 在beforeSend回调函数或者ajaxBeforeSend事件中返回了false，取消ajax请求
        if (ajaxBeforeSend(xhr, options) === false) {
            abort('abort');
            return xhr;
        }

        window[callbackName] = function() {
            responseData = arguments;
        };
        // 参数中添加上变量名
        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        document.head.appendChild(script);
        //超时处理
        if (options.timeout > 0) abortTimeout = setTimeout(function() {
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
        xhr: function() {
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
        return mime && (mime == htmlType ? 'html' :
            mime == jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text';
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
        if (options.processData && options.data && $.type(options.data) != "string")
            console.info(options.data);
        options.data = $.param(options.data, options.traditional);

        // 请求方法为GET，data参数添加到url上
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
            options.url = appendQuery(options.url, options.data), options.data = undefined;
    }
    $.ajax = function(options) {
        var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor, hashIndex;
        for (key in $.ajaxSettings)
            if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

        ajaxStart(settings); //开始
        // 如果没有传入crossDomain参数，就通过检测setting.url和网址的protocol、host是否一致判断该请求是否跨域
        if (!settings.crossDomain) {
            // 通过设置a元素的href就可以很方便的获取一个url的各组成部分
            urlAnchor = document.createElement('a');
            urlAnchor.href = settings.url;
            // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
            urlAnchor.href = urlAnchor.href;
            settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
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
        if (settings.cache === false || (
                (!options || options.cache !== true) &&
                ('script' == dataType || 'jsonp' == dataType)
            ))
            settings.url = appendQuery(settings.url, '_=' + Date.now());

        // jsonp调用$.ajaxJSONP实现
        if ('jsonp' == dataType) {
            if (!hasPlaceholder)
                settings.url = appendQuery(settings.url,
                    settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?');
            return $.ajaxJSONP(settings, deferred);
        }

        // 下面代码用来设置请求的头部、相应的mime类型等
        var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value]; },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(), //XMLHttpRequest
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
        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
            setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');
        //如果配置中有对headers内容
        if (settings.headers)
            for (name in settings.headers) setHeader(name, settings.headers[name]);
        xhr.setRequestHeader = setHeader; //设置头信息

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) { //请求完成
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout);
                var result, error = false;
                //请求成功
                //在本地调动ajax，也就是请求url以file开头，也代表请求成功
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
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
                        } catch (e) { error = e; }

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

        if (settings.xhrFields)
            for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

        for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

        // 超时丢弃请求
        if (settings.timeout > 0) abortTimeout = setTimeout(function() {
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

    $.get = function( /* url, data, success, dataType */ ) {
        return $.ajax(parseArguments.apply(null, arguments));
    };

    $.post = function( /* url, data, success, dataType */ ) {
        var options = parseArguments.apply(null, arguments);
        options.type = 'POST';
        return $.ajax(options);
    };

    $.getJSON = function( /* url, data, success */ ) {
        var options = parseArguments.apply(null, arguments);
        options.dataType = 'json';
        return $.ajax(options);
    };

    $.fn.load = function(url, data, success) {
        if (!this.length) return this;
        var self = this,
            parts = url.split(/\s/),
            selector,
            options = parseArguments(url, data, success),
            callback = options.success;
        if (parts.length > 1) options.url = parts[0], selector = parts[1];
        options.success = function(response) {
            self.html(selector ?
                $('<div>').html(response.replace(rscript, "")).find(selector) : response);
            callback && callback.apply(self, arguments);
        };
        $.ajax(options);
        return this;
    }
    var escape = encodeURIComponent;
    //序列化
    //在Ajax post请求中将用作提交的表单元素的值编译成 URL编码的 字符串
    function serialize(params, obj, traditional, scope) {
        var type, array = $.isArray(obj),
            hash = $.isPlainObject(obj);
        // debugger;

        $.each(obj, function(key, value) {
            type = $.type(value);

            if (scope) {
                key = traditional ? scope :
                    scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';
            }
            // handle data in serializeArray() format
            if (!scope && array) { //obj是个数组
                params.add(value.name, value.value);
            }
            // obj的value是个数组/对象
            else if (type == "array" || (!traditional && type == "object")) {
                serialize(params, value, traditional, key);
            } else {
                params.add(key, value);
            }
        });
    }
    $.param = function(obj, traditional) {
        var params = [];
        //serialize函数使用add
        params.add = function(key, value) {
            if ($.isFunction(value)) value = value();
            if (value == null) value = "";
            this.push(escape(key) + '=' + escape(value));
        };
        serialize(params, obj, traditional); //处理obj
        return params.join('&').replace(/%20/g, '+');
    };
};

export default Ajax;
