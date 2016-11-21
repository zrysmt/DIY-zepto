/**
 * 动画方法
 */
var Fx_methods = function($) {
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
        return anim(el, speed, 0, scale, function() {
            origHide.call($(this));
            callback && callback.call(this);
        });
    }

    $.fn.show = function(speed, callback) {
        origShow.call(this);
        if (speed === undefined) {
            speed = 0;
        } else {
            this.css('opacity', 0);
        }
        return anim(this, speed, 1, '1,1', callback);
    };

    $.fn.hide = function(speed, callback) {
        if (speed === undefined) {
            return origHide.call(this);
        } else {
            return hide(this, speed, '0,0', callback);
        }
    };

    $.fn.toggle = function(speed, callback) {
        if (speed === undefined || typeof speed == 'boolean') {
            return origToggle.call(this, speed);
        } else {
            return this.each(function() {
                var el = $(this);
                el[el.css('display') == 'none' ? 'show' : 'hide'](speed, callback);
            });

        }
    };

    $.fn.fadeTo = function(speed, opacity, callback) {
        return anim(this, speed, opacity, null, callback);
    };

    $.fn.fadeIn = function(speed, callback) {
        var target = this.css('opacity');
        if (target > 0){
         this.css('opacity', 0);
        }
        else {
        	target = 1;
        }
        return origShow.call(this).fadeTo(speed, target, callback);
    };

    $.fn.fadeOut = function(speed, callback) {
        return hide(this, speed, null, callback);
    };

    $.fn.fadeToggle = function(speed, callback) {
        return this.each(function() {
            var el = $(this);
            el[
                (el.css('opacity') == 0 || el.css('display') == 'none') ? 'fadeIn' : 'fadeOut'
            ](speed, callback);
        });
    };
};

export default Fx_methods;
