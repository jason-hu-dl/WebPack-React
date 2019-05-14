/**
 *  Created by hu on 2019-04-19.
 **/
const path = require('path'); //node获取文件路径
const Webpack = require('webpack'); //webpack
const WebpackManifestPlugin = require('webpack-manifest-plugin'); //生成打包后的资源对照文件
const HtmlWebpackPlugin = require('html-webpack-plugin'); //生成html文件以及自动吧打包后的文件link到html中
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); //抽取css样式到单独的css文件中
const CleanWebpackPlugin = require('clean-webpack-plugin'); //清空打包目录
const CopyPlugin = require('copy-webpack-plugin'); //拷贝静态资源
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin'); //能够更好在终端看到webapck运行的警告和错误
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;//webpack分析将bundle内容表示为方便的交互式可缩放树形图
const CompressionWebpackPlugin = require('compression-webpack-plugin'); //Gzip压缩插件


const Loader = require('./loader');
const Paths = require('./config/paths');
const Server = require('./config/server');
const Optimize = require('./config/optimize');

module.exports = (env,argv)=>{
    const isEnvDevelopment=argv.mode==='development';
    const isEnvProduction=argv.mode==='production';
    process.env.NODE_ENV=isEnvDevelopment?'development':'production'
    process.env.BABEL_ENV=isEnvDevelopment?'development':'production'
    const publicPath=isEnvProduction?Paths.servedPath:'/';
    const environment=argv.environment===undefined?'':argv.environment;
    const AppProject=argv.project!==undefined&&argv.project.length>0&&argv.project;
    console.info('\u001b[2J');
    console.info(`\u001b[42;30m INFO \u001b[40;37m 当前项目：${AppProject}\u001b[0m`)
    if(!AppProject){
        console.error('\u001b[2J');
        console.error('\u001b[41;37m ERROR \u001b[0;31m 命令中 --project 参数是必须的 \u001b[0m');
        console.error('\u001b[41;37m ERROR \u001b[0;31m 命令中 --project 参数是必须的 \u001b[39m');
        console.error('\u001b[41;37m ERROR \u001b[0;31m 命令中 --project 参数是必须的 \u001b[39m');
        process.exit();
    }
    const WebpackServer= isEnvDevelopment?{devServer:Server(argv.prot,Paths.servedPath),optimization:Optimize(isEnvProduction)}:{optimization:Optimize(isEnvProduction)};
    const devtool=isEnvDevelopment?'cheap-module-source-map':'nosources-source-map';
    //生成入口
    appEntry=(arr)=>{
        let appEntry={};
        arr.map(({keys='',pathIndex=''})=>{
             if(String(keys)===String(AppProject)){
                 appEntry[keys]=[
                     isEnvDevelopment&&require.resolve('react-dev-utils/webpackHotDevClient'),
                     pathIndex
                 ].filter(Boolean)
             }
        })
        if(Object.keys(appEntry).length<=0){
            console.error('\u001b[2J');
            console.error(`\u001b[41;37m ERROR \u001b[0;31m 配置中没有找到入口名称为："${AppProject}" 入口!! \u001b[0m`);
            process.exit();
        }else{
            console.info('\u001b[2J');
            console.info(`\u001b[47;30m INFO \u001b[42;30m 已找到名称为："${AppProject}"  入口!!\u001b[0m`);
            // process.exit();
        }
        return appEntry;
    }
    //生成出口
    appOutput=(arr)=>{
        let appOutput={};
    }
    //生成html文件
   appHtml=(arr)=>{
        let appHtml=[];
        arr.map(({keys='',title='',chunks=[]})=>{
            if(String(keys)===String(AppProject)){
                appHtml.push(new HtmlWebpackPlugin(Object.assign({},{
                    template: Paths.appHtml,
                    favicon:Paths.appIcon,
                    hash:true,
                    chunksSortMode: 'none',
                    title:title,
                    filename: isEnvProduction?`./index.html`:`./index.html`,
                    chunks:[...chunks,'vendors'],
                    // chunks:[...chunks,],
                    inject: true,
                    xhtml:true
                },isEnvProduction?{
                    minify: {
                        removeComments: true,
                        collapseWhitespace: true,
                        removeRedundantAttributes: true,
                        collapseInlineTagWhitespace:true,
                        useShortDoctype: true,
                        removeEmptyAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        keepClosingSlash: true,
                        minifyJS: true,
                        minifyCSS: true,
                        minifyURLs: true,
                    }
                }:undefined)))
            }
        });
        if(appHtml.length<=0){
            console.error('\u001b[2J');
            console.error(`\u001b[41;37m ERROR \u001b[0;31m 配置中没有找到入口名称为："${AppProject}" 入口!! \u001b[0m`);
            process.exit();
        }else{
            console.info('\u001b[2J');
            console.info(`\u001b[47;30m INFO \u001b[42;30m 已找到名称为："${AppProject}"  入口!!\u001b[0m`);
            // process.exit();
        }
        return appHtml;
    }
    // process.exit();
    return{
        entry:appEntry(Paths.appEntry),
        output:{
            path: isEnvProduction ? `${Paths.appBuild}/${AppProject}` : Paths.servedPath,//建立文件夹。
            pathinfo: isEnvDevelopment,// 向输出中生成的require()添加/* filename */注释。
            filename: isEnvProduction? `static/js/[name].[contenthash:8].js`: isEnvDevelopment && 'static/js/[name].js',//每个异步块将有一个主包和一个文件。在开发中，它不会生成真正的文件。
            chunkFilename: isEnvProduction?`static/js/chunk/[name].[contenthash:8].bundle.js`:isEnvDevelopment && 'static/js/chunk/[name].bundle.js',//如果使用代码分割，还有额外的JS块文件。
            publicPath: publicPath,
            devtoolModuleFilenameTemplate: isEnvProduction // 指向原始磁盘位置的点sourcemap条目(格式为Windows上的URL)
                ?info =>
                    path.relative(Paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/'):
                    isEnvDevelopment&&(info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
        },
        mode:argv.mode,
        watch: true,
        bail:isEnvProduction,
        devtool:devtool,
        module:{
            rules:[
                ...Loader(isEnvProduction,AppProject)
            ]
        },
        resolve: {
            extensions: [ '.tsx', '.ts', '.js' ,'.jsx']
        },
        ...WebpackServer,
        plugins: [
            new Webpack.ProgressPlugin(),
            isEnvProduction?(new CleanWebpackPlugin(),new BundleAnalyzerPlugin()):new Webpack.HotModuleReplacementPlugin(),
            new Webpack.DefinePlugin({
                __DEV__:JSON.stringify(environment),
            }),
            ...appHtml(Paths.appEntry),
            new WebpackManifestPlugin({
                fileName: 'asset-manifest.json',
                publicPath: publicPath,
            }),
            new MiniCssExtractPlugin({
                filename: isEnvProduction?"static/css/[name].[contenthash:8].css":isEnvDevelopment&&"static/css/[name].css",
                chunkFilename: isEnvProduction?"static/css/[id].[contenthash:8].css":isEnvDevelopment&&"static/css/[id].css"
            }),
            new CopyPlugin([
                ...Paths.appCopy
            ]),
            new FriendlyErrorsWebpackPlugin({
                // 运行成功
                compilationSuccessInfo:{
                    message:['你的应用程序在这里运行http：// localhost：3000'],
                    notes:['编译成功,报错后在次编译可能页面不能自动刷新,如为自动刷新！请手动刷新']
                },
                // 运行错误
                onErrors:function(severity,errors){
                    console.log(severity);
                    if(severity==='error'){
                        errors.map((itme,index)=>{
                            let {severity='',webpackError='',name='',origin='',file=''} =itme;
                            console.error(`\u001b[41;37m ERROR:${index+1} \u001b[0;31m "${webpackError}"!! \u001b[0m`);
                        })
                    }
                },
                clearConsole:true,////是否每次编译之间清除控制台,默认为true
            }),
            new CompressionWebpackPlugin({
                filename: '[path].gz[query]',
                algorithm: 'gzip',
                test: new RegExp('\\.(js|css)$'),
                // 只处理大于xx字节 的文件，默认：0
                threshold: 10240,
                // 示例：一个1024b大小的文件，压缩后大小为768b，minRatio : 0.75
                minRatio: 0.8, // 默认: 0.8
                // 是否删除源文件，默认: false
                deleteOriginalAssets: true
            })
        ],
        performance: {
            // false | "error" | "warning" // 不显示性能提示 | 以错误形式提示 | 以警告...
            hints: isEnvProduction?"warning":false,        // 开发环境设置较大防止警告
            // 根据入口起点的最大体积，控制webpack何时生成性能提示,整数类型,以字节为单位
            maxEntrypointSize: 250000,         // 最大单个资源体积，默认250000 (bytes)
            maxAssetSize: 3000000
        }
    }
}