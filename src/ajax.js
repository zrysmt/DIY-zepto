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
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,//用来除掉html代码中的<script>标签
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,//用来判断是不是js的mime
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a');

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
            return new window.XMLHttpRequest()
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
    }
    $.ajax = function(options) {
        var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor, hashIndex;
        for (key in $.ajaxSettings)
            if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

        ajaxStart(settings);
    }
}

export default Ajax;
