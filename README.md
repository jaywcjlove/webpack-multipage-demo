# webpack-multipage

Webpack 多页面加载demo

```bash
# 安装依赖
$ npm install

# 全部入口文件加载 调试
$ npm run dev

# 编译发布部署
$ npm run build
```

## 需求

- 多页面入口文件、不频繁修改`webpack`配置文件
- 使用 ejs 模版引擎作为静态模版
- 使用 `stylus` 编译 `CSS` 文件同时支持原生 `CSS` 引用
- 分割 js 代码，解决代码合并过大的问题 [split app and vendor code](http://webpack.github.io/docs/code-splitting.html#split-app-and-vendor-code)
- 将多次引用的js 单独生成 js 文件不合并
- 部署分版本发布
- HTML5离线缓存
