> [博客地址](https://github.com/zrysmt/Blog)
> https://github.com/zrysmt/Blog

# 1.关于文件和文件夹的说明

- sourceSrc是官方源码文件夹
- src是自己写DIY的源码
- demo.html 是DIY库的测试    
- test.html 是官方库的测试 

下面这个系列是官方源码编译的，可以方便测试代码
- zepto1.js 模块包括zepto event ajax 
- zepto2.js 模块包括zepto event ajax callbacks deferred
- zepto3.js 模块包括zepto event fx fx_meshods
- zepto.js  上面所有模块的集合
注：执行的命令（对于zepto.js文件）是

```bash
MODULES="zepto event fx fx_methods" npm run dist
# on Windows
> SET MODULES=zepto event fx fx_methods
> npm run dist
```

+ v0.1 文件夹 对应  一步一步DIY zepto库，研究zepto源码1.md    
	_zepto-v0.1.x.js是每隔几步骤实现的保存代码，文件夹下是x最大的是最新最全的代码

+ v0.2 文件夹 对应  一步一步DIY zepto库，研究zepto源码2.md     
  _zepto-v0.2.x.js是每隔几步骤实现的保存代码，文件夹下是x最大的是最新最全的代码

+ v0.3.1 文件夹
   使用rollup.js实现模块化

+ v0.3.2 文件夹
	实现事件模块的on方法

+ v0.3.3 文件夹
	时间模块完整实现

+ v0.4.1 文件夹
    ajax模块

+ v0.5.1 文件夹
    callbacks模块

+ v0.6.1 文件夹
     deferred 模块

+ v0.7.1 文件夹
     动画模块（fx，fx_method）

# 2.关于模块编译
前面的不用编译，对应文件写好即可
v0.3.2开始-v0.7.1文件 
+ 下载插件
  - `npm install`(因为有package.json文件)或者 `npm install rollup rollup-plugin-babel babel-preset-es2015-rollup`

+ 要自己编译的时候只需要将从v0.3.2开始-v0.7.1文件下的src替换src目录即可。

+ rollup.config.dev.js文件配置正确，执行命令`rollup -c rollup.config.dev.js`

# 3.rollup+es6配置
[查看博客](https://github.com/zrysmt/Blog/blob/master/rollup%2Bes6%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5.md)

> https://github.com/zrysmt/Blog/blob/master/rollup%2Bes6%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5.md

> [博客地址](https://github.com/zrysmt/Blog)
> https://github.com/zrysmt/Blog