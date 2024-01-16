import { resolve} from "path"
import { splitVendorChunkPlugin,defineConfig,searchForWorkspaceRoot} from 'vite'
import {nodeResolve} from "@rollup/plugin-node-resolve"
import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue2'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import vueRoutes from "./src/vitePlugins/vite-plugin-vue-routes.js"
import vueOptions from "./src/vitePlugins/vite-plugin-vue-options.js"
import {initModules,unpluginModules} from "./src/moduleLib.js"
import { layoutNameKey,pageNameKey} from './src/constants.js'

// 根据用户配置返回vite.config.js配置
export default function(userConfig){
  // console.log(userConfig)
  return defineConfig(async ({ command, mode, ssrBuild }) => {
    // const env = loadEnv(mode, process.cwd(), '')
    const moduleConfigs =  await initModules(userConfig.modules)
    const Config = Object.assign({},userConfig,moduleConfigs)
    const outDir = resolve(process.env.__PROJECTROOT,Config.outDir)
    const unpluginvModules = unpluginModules()
    const isProduction = mode == "production"

    console.log(Config.optimizeInclude)
    // const moduleChunks = Object.assign({
    //   'vue': ['vue'],
    //   // 'vrouter': ['vue-router','virtual:router-routes'],
    //   // 'vmodules': ['virtual:modules','virtual:router-routes'],
    // },Config.manualChunks)
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
          '@@vitescv': process.env.__VITESCVROOT,
        },Config.alias),
        preserveSymlinks: false,
        dedupe:["vue"]
      },
      plugins: [
        Config.legacy&&legacy(Config.legacy),
        // Inspect(),
        nodeResolve({
          preserveSymlinks: false ,
          // pnpm的话都在node_modules/.pnpm/node_modules下面
          modulePaths:[
            'node_modules',
            'node_modules/.pnpm/node_modules',
            // 以下for link
            resolve(process.env.__VITESCVROOT,'node_modules')
          ]
          // .concat(Config.resolveModulePath),
        }),
        //💡 2.9之前manualChunks默认的策略是将 chunk 分割为 index 和 vendor，之后要手动启动
        splitVendorChunkPlugin(),
        vueOptions([{
          include:`${Config.source}/pages/**/*.vue`,
          exclude:null,
          options:{[pageNameKey]:true},
        },{
          include:`${Config.source}/layouts/**/*.vue`,
          exclude:null,
          options:{[layoutNameKey]:true},
        }]),
        unpluginvModules.vite(),
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
          directoryAsNamespace: true,
          collapseSamePrefixes: true,
          directives: true,
          resolvers:Config.UIResolvers
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
          // resolveDependencies: (filename, deps, { hostId, hostType }) => {
          //   console.log(">>>>>>>.resolveDependencies:",filename,hostId,hostType,deps)
          //   // if(hostType=='js')
          //   //！定制预渲染模块列表，
          //   return deps
          // }
        },
        ssr:false,
        commonjsOptions:{
          include:[/node_modules/],
        },
        rollupOptions: {
          input: resolve(process.env.__PROJECTCACHEROOT,'index.html'),
          external:Config.external,
          output: {
            // assetFileNames: (assetInfo) => {
            //   // console.log(assetInfo)
            //   return `${assetsDir}/[name]-[hash].[ext]`; // 不匹配的资源文件存放至assets，以[name]-[hash].[ext]命名规则，注意两处的命名规则不同
            // },    
            // manualChunks(id, { getModuleInfo }) {
            //   // console.log(id,getModuleInfo(id))
            //   if(id.includes('node_modules')){
            //     for (const key in moduleChunks) {
            //       let testKey = moduleChunks[key].some(v=>{
            //         return id.includes(v)
            //       })
            //       if(testKey){
            //         console.log("testKey",id)
            //       }
            //       let hasKey = moduleChunks[key].some(v=>{
            //         return id.includes("node_modules/"+v)
            //       })
            //       if(hasKey){
            //         return key
            //       }
            //     }
            //   }
            // },
          },
        },
        //💡 览器兼容目标,使用plugin-legacy 就不用设置了
        // target:"modules",
      },
      // 预构建还是关掉了，module开发中太多定制化，会引起各种问题，比如呗预构建载入了子包内的vue引起vue多实例，
      optimizeDeps:{
        //💡 除了input（index.html）文件来检测需要预构建的依赖项外，指定其他入口文件检索
        // entries:[],
        //💡 默认情况下，不在 node_modules 中的，链接的包不会被预构建。使用此选项可强制预构建链接的包。
        // include:Config.optimizeInclude,
        // 💡 排除的预构建，vitescv/app包含虚拟模块，预构建的时候并不存在，会报错
        // exclude:['vitescv/app'],
        //💡 设置为 true 可以强制依赖预构建，而忽略之前已经缓存过的、已经优化过的依赖。
        force:false,
        // 只有development的时候才使用兼容插件来处理，因为prodction的时候会走rollup的unpluginvModules.vite 会冲突
        disabled:'build',
        esbuildOptions:{
          preserveSymlinks:false,
          sourcemap: false,
          // sourcesContent: false,
          plugins:[unpluginvModules.esbuild()]
        }
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
          ignored: ['**/*.d.ts','../.git','../node_modules','../dist','.DS_Store',process.env.__PROJECTCACHEROOT,outDir],
          ignoreInitial: true,  //很重要，不然会不停重启
          followSymlinks:true,
          include:['config.js'],
          // ↓ windows文件在wsl上运行时，开启
          // usePolling: true,
          interval: 200,
        },
        fs: {
          allow: [
            // search up for workspace root
            searchForWorkspaceRoot(process.cwd()),
          ]
        },
      },
    }
  })
}