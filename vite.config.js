import { resolve} from "path"
import { splitVendorChunkPlugin,defineConfig} from 'vite'
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue2'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import vueRoutes from "./src/vitePlugins/vite-plugin-vue-routes.js"
import {initModules} from "./src/moduleLib.js"

const defaultUserConfig = {
  host:"127.0.0.1",
  source:"view",                //vue项目的源码目录
  outDir:'dist',                //打包输出根路径
  public:"public",              //资源文件目录名，同vite配置
  legacy:false,
  modules:{},
  external:[],
  trunkRules:[],
  page404:'/404',
}
// 根据用户配置返回vite.config.js配置
export default function(userConfig){
  return defineConfig(async ({ command, mode, ssrBuild }) => {
    if(typeof userConfig == 'function'){
      userConfig = userConfig({ command, mode, ssrBuild })
    }
    userConfig = mergeUserConfig(userConfig)
    // const env = loadEnv(mode, process.cwd(), '')
    const moduleConfigs =  await initModules(userConfig.modules)
    const Config = Object.assign({},userConfig,moduleConfigs)
    const outDir = resolve(process.env.__PROJECTROOT,Config.outDir)
    const isProduction = mode == "production"

    // console.log(moduleConfigs)
    return {
      //💡 项目根目录
      root:process.env.__PROJECTCACHEROOT,
      base:'/',
      define:{
        'process.env.__VITESCVROOT':JSON.stringify(process.env.__VITESCVROOT),
        'process.env.__PROJECTROOT':JSON.stringify(process.env.__PROJECTROOT)
      },
      logLevel: "info",
      //💡 应用类型，默认spa，
      appType: 'spa',
      //💡 资源文件目录，默认<root>/public，注意！！访问时其下的资源文件直接通过/根目录访问到
      publicDir:resolve(process.cwd(),Config.public),
      // mode:"development", //由命令行控制
      resolve: {
        alias: Object.assign({
          '@': process.env.__PROJECTROOT,
          '@cache': process.env.__PROJECTCACHEROOT,
          '@@vitescv': process.env.__VITESCVROOT,
        },Config.alias),
        preserveSymlinks:false,
        dedupe:["vue","vue-router"].concat(Object.keys(Config.alias)),
        // extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
      },
      plugins: [
        Config.legacy&&legacy(Config.legacy),
        // Inspect(),
        //💡 2.9之后manualChunks需要
        splitVendorChunkPlugin(),
        vueRoutes({
          pageRoot:`${Config.source}/pages`,
          layoutRoot:`${Config.source}/layouts`,
          page404:Config.page404,
          layoutDefault:'default',
          sfcExt:'.vue',
          componentLoading:Config.componentLoading,
          componentError:Config.componentError,
          compomentRouteView:Config.compomentRouteView,
        }),
        vue({
          isProduction,
        }),
        AutoImport({
          //💡 会在根目录生成auto-imports.d.ts，里面可以看到自动导入的api
          dts: true,
          //💡 匹配的文件，也就是哪些后缀的文件需要自动引入
          include: [/\.[tj]sx?$/,  /\.vue$/, ],
          //💡 自动引入的api从这里找
          imports: ['vue', 'vue-router'],
          //💡 resolvers: Config.UIResolvers
        }),
        Components({
          transformer: 'vue2', // vue2.7必需
          dts:true,
          dirs: [resolve(process.env.__PROJECTROOT,Config.source,'components')].concat(Config.UIDirs),
          deep:true,
          extensions:["vue"],
          // extensions: ['vue', 'tsx', 'jsx'],
          directoryAsNamespace: true,
          collapseSamePrefixes: true,
          directives: true,
          resolvers:Config.UIResolvers,
          version: 2.7,
        })
      ],
      envDir:process.env.__PROJECTROOT,
      envPrefix:'VITE_',
      build: {
        manifest:true,
        ssrManifest:false,
        chunkSizeWarningLimit:200,  //kb
        // minify:false,
        //💡 打包输出根路径,命令行控制
        outDir,
        emptyOutDir:true,
        copyPublicDir:true,
        //💡 打包输出时资源文件目录
        assetsDir:Config.assetsDir,                
        //💡 模块预加载，对于ssr很重要
        modulePreload: {
          polyfill: true,
        },
        ssr:false,
        commonjsOptions:{
          include:[/node_modules/],
        },
        rollupOptions: {
          input: resolve(process.env.__PROJECTCACHEROOT,'index.html'),
          external:Config.external,
          output: {
            entryFileNames: 'entries/[name].js',
            chunkFileNames: 'chunks/[name]-[hash].js',
            assetFileNames: 'static/[name]-[hash][extname]',
            manualChunks:generalManualChunks(userConfig.trunkRules)
          },
        },
        //💡 览器兼容目标,使用plugin-legacy 就不用设置了
        // target:"modules",
      },
      //💡开发期间模块也做预处理，因为不预处理的话一些内部的依赖无法被预处理，导致commonsjs等问题。
      //  但是模块很多是模板动态的，就导致一些模块配置改变后必须被实时重构，所以这里force为true. 每次配置改变和重启dev服务都会重新预构建
      optimizeDeps:{
        //💡 除了input（index.html）文件来检测需要预构建的依赖项外，指定其他入口文件检索
        // entries:[],
        //💡 默认情况下，不在 node_modules 中的，链接的包不会被预构建。使用此选项可强制预构建链接的包。
        include:Config.optimizeInclude,
        // 💡 排除的预构建，里面包含的routes和modules不能被预构建
        exclude:["vitescv/app"],
        //💡 设置为 true 可以强制依赖预构建，而忽略之前已经缓存过的、已经优化过的依赖。
        force:false,
        // 只有development的时候才使用兼容插件来处理，因为prodction的时候会走rollup的unpluginvModules.vite 会冲突
        // disabled:'build',
      },
      preview:{
        port:Config.port,
        open: true,
      },
      server: {
        host:Config.host,
        port:Config.port,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          ignored: [/.d.ts$/,/(^|[/\\]).DS_Store$/,/(^|[/\\]).git/,outDir],
          ignoreInitial: true,        //很重要，不然会不停重启
          followSymlinks:true,
          awaitWriteFinish:true,
          // cwd:process.env.__PROJECTROOT,
          // include:[],
          // ↓ windows文件在wsl上运行时，开启
          // usePolling: true,
          interval: 200,
        },
        fs: {
          strict:!!Config.fsStrict,
        },
      },
    }
  })
}

// 生成用户 config
function mergeUserConfig(userConfig){
  const config = Object.assign({},defaultUserConfig)
  for (const key in userConfig) {
    switch(key){
      case 'trunkRules':
        // 处理掉非正则的和不是数组的对象
        if(!Array.isArray(userConfig.trunkRules)){
          console.error("[vitescv] [config.trunkRules]  must be Array, ignored!")
        }else{
          userConfig.trunkRules.forEach((rule,i) => {
            if(!Array.isArray(rule)||rule.length<1){
              console.error(`[vitescv] [config.trunkRules.${i} must be Array, ignored!`)
            }else{
              if(Object.prototype.toString.call(rule[0]) !== '[object RegExp]'){
                console.error(`[vitescv] [config.trunkRules.${i}.0] the first item in rule must be RegExp, ignored!`)
              }else{
                if(rule.length>1 && rule[1]!==null && typeof rule[1]!=="string"){
                  console.error(`[vitescv] [config.trunkRules.${i}.1] the second item in rule must be String|Null, ignored!`)
                }else{
                  config.trunkRules.push(rule)
                }
              }
            }
          })
        }
        break;
      default:
        config[key] = userConfig[key]
        break;
    }
  }
  return config
}

// 生辰manualChunks对应的处理方法
function generalManualChunks(trunkRules){
  if(trunkRules.length==0){
    return null
  }
  return function(id){
    for (let i = 0; i < trunkRules.length; i++) {
      if(trunkRules[i][0].test(id)){
        return trunkRules[i][1]
      }
    }
  }
}