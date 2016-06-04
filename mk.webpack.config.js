var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var autoprefixer = require('autoprefixer-stylus');
var px2rem = require('stylus-px2rem');
var glob = require('glob')
var Manifest= require('webpack-manifest');

var pkg =require('./package');

// Node_Modules 模块包引用
var nodeModPath = path.resolve(__dirname, './node_modules')
// 项目目录
var srcDir = path.resolve(process.cwd(), 'public')

var PathMap = Object.assign({
  // 在node_modules 里面的lib
  // 'hotkeys': path.join(nodeModPath, '/hotkeys-js/src/hotkeys.js').split(path.sep).join('/'),
}, 
  // 放在本地的 公共内容需要做"别名"的
  require('./public/vendermap.json')
);

// 常用的lib 如 JSLite、jQuery
// 可以是npm install 安装的 
// 也可以是 `./public/vendermap.json` 中的
var chunks = (function(){
  var arrs = [];
  for(var a in PathMap){
    arrs.push(a)
  }
  return arrs;
})()

module.exports = function(files){


  // 获取所有js文件作为entry
  var entries = (function(){
    var jsDir = path.resolve(srcDir, 'js')
    var entryFiles = glob.sync(jsDir + '/**/*.js')
    var map = {}
    var jsfile = process.cwd()+'/'+files

    // 这里判断是否通过环境变量指定页面构建
    // 根据项目的目录规则将资源入口js 放到 /public/js 文件目录中
    if(files&&files.length>0){
      entryFiles = []
      files.forEach(pth => {
        entryFiles.push( 
          path.join(process.cwd(),pth.toString())
            .replace(/\.ejs*$/g,'.js')
            .split(path.sep).join('/')
            .replace(/\/public\/html/,'/public/js')
        )
      })
    }

    entryFiles.forEach((filePath) => {
      if(!/\/_/.test(filePath)){
        // 将下面路径转换别名
        //   js/index.js  =>  index
        //   js/sorting/index.js => sorting-index
        var filename_path = filePath.match(/\/js\/(.*?.)\.js/)[0];
        var aliasname = filename_path.replace(/^\/js\/*|\.js*$/g,'').replace(/\//g,'-');
        map[aliasname] = '.'+filePath.replace(process.cwd().split(path.sep).join('/'),'')
      }
    });
    return map
  })()

  /**
   * HtmlWebpackPlugin
   * 
   * 每个EJS 文件都是一个入口文件，
   * 带下划线开头的文件夹，当做放模版的文件夹，里面的ejs文件不作为入口文件 
   * 如：`/_partial/footer.ejs`
   * 自动生成入口文件，入口js名必须和入口文件名相同
   */
  var plugins = (function(){
    var entryHTMLFiles = glob.sync(srcDir+'/**/*.ejs')
    var _arr =[]

    // 这里判断是否通过环境变量指定页面构建
    // 根据项目的目录规则将模板资源入口文件ejs 放到 /public/html 文件目录中
    if(files&&files.length>0){
      entryHTMLFiles = []
      files.forEach(pth => {
        entryHTMLFiles.push(  path.join(process.cwd(),pth.toString()).split(path.sep).join('/') )
        
      })
    }
    entryHTMLFiles.forEach(function(filePath,idx){
      filePath = filePath.replace(srcDir.split(path.sep).join('/'),'');
      if(!/\/_/.test(filePath)){
        // var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
        var filename_path = filePath.match(/\/html\/(.*?.)\.ejs/)[1];
        var aliasname = filename_path.replace(/\//g,'-');

        var conf= {
            filename: filename_path + '.html',
            template: 'public'+filePath,
            //压缩HTML文件
            minify:{
                removeComments:true,    //移除HTML中的注释
                collapseWhitespace:true //删除空白符与换行符
            }
          }
        if(aliasname in entries) {
          conf.inject = true;
          // console.log("aliasname:",aliasname,entries[aliasname])
          conf.chunks = ['vendor',aliasname]
        }
        // console.log("conf:",conf)
        _arr.push(new HtmlWebpackPlugin(conf))
      }
    })
    return _arr;
  })();
  var webpackConfig = {
    // 入口 js 文件
    entry:Object.assign(entries),
    output: {
      path: path.resolve(__dirname, 'deploy/'+ pkg.version),
      filename: 'js/[hash:8].[name].js'
      // ,chunkFilename: "js/[hash:8].[name].chunk.js"
    },
    resolve: {
      root: [srcDir, nodeModPath],
      alias: PathMap,
      extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', '.jpg']
    },
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
        },
        {
          test: /\.styl$/,
          loader: ExtractTextPlugin.extract("style-loader", "css-loader!stylus-loader")
        },
        {test: /\.ejs$/, loader: 'ejs2-loader?htmlmin=removeComments'},
        {test: /\.json$/, loader: 'json'},
        {
          test:/\.(jpg|gif|png|woff|woff2|eot|ttf|svg)$/,
          loaders:['url-loader?limit=4000,name=/img/[hash:8].[name].[ext]']
        }
      ]
    },
    stylus: {
      use: [autoprefixer({browsers:['Android 2.3', 'Android >= 4', 'Chrome >= 20', 'Firefox >= 24', 'Explorer >= 8', 'iOS >= 6', 'Opera >= 12', 'Safari >= 6']}),px2rem()]
    },
    plugins: [
      //js 代码热更新
      new webpack.HotModuleReplacementPlugin(),
      new ExtractTextPlugin('css/[contenthash:8].[name].css', {
        allChunks: true
      }),
      new CommonsChunkPlugin({
        // 存储 webpack 必要的依赖
        filename: "js/[hash:8].vendor.js",
        name: "vendor",
        // chunks: ['a', 'b'],
        // minChunks: Infinity,
        // minChunks: 1 // 提取所有chunks共同依赖的模块   
      }),
      // new webpack.optimize.UglifyJsPlugin({
      //   compress: {
      //       warnings: false
      //   },
      //   sourceMap: true,//这里的soucemap 不能少，可以在线上生成soucemap文件，便于调试
      //   mangle: true
      // }),
    ].concat(plugins).concat([
      new Manifest({
          cache: [
            'js/[hash:8].sorting-index.js', 
            'css/[hash:8].sorting-test.css',
            'css/[hash:8].index-index.css',
            'img/[hash:8].logo.png'
          ],
          timestamp: true,
          filename:'cache.manifest',
          network: ['http://*', 'https://*'],
          fallback: ['/ /404.html'],
          headcomment: pkg.name + " v" + pkg.version,
          master: ['index/index.html'],
          reg:[],
      })
    ])
  }
  return webpackConfig
}
// module.exports = webpackConfig;