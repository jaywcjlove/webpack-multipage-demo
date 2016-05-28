'use strict';

var webpackConfig = require('./mk.webpack.config')

var mkentry = require('./mk.entries.json')
/**
 * process.env.File
 *
 * 环境变量，为开发模式下面不用缓存所有人开发的所有入口文件，提升开发速度。
 * 
 */

var files = process.env.File?[process.env.File]:[];

if(mkentry.length>0) files = mkentry;

module.exports = webpackConfig(files)