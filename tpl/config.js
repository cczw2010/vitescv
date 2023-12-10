import userConfig from "../config.js"

const defualtUserConfig = {
  /****************** vite部分 *******************/
  host:"127.0.0.1",
  // port:8000,
  source:"view",                //vue项目的源码目录
  outDir:'dist',                //打包输出根路径
  public:"public",              //资源文件目录名，同vite配置
  // ↓↓  编译时的兼容设置，具体参考@vitejs/plugin-legacy的参数设置
  // legacy:{
  //   // 以下是IE11兼容示例
  //   targets: ['IE>=11'],
  //   additionalLegacyPolyfills:['regenerator-runtime/runtime'],
  // }
  /****************** 自定义部分 *******************/
  // ↓↓  middlewares:[],         //全局路由中间件 ，应用于所有路由
  modules:{},
  // ↓↓  按需引入第三方UI库，unplugin-vue-components/vite的 resolvers配置项
  UIResolvers:[],
  // ↓↓  打包时强制外部化的库 
  external:[],
  // ↓↓  打包时ouput的 chunk
  manualChunks:{},
  // ↓↓  404页面             
  page404:'/404',
  // ↓↓  路由动态加载时的loading组件，AppLoading 预设
  // componentLoading:'@/view/components/loading.vue',
  // ↓↓  路由动态加载错误时显示组件，AppError 预设
  // componentError:'@/view/components/xx',
  // ↓↓  路由页面显示组件，AppView 预设         
  // compomentRouteView:'@/view/components/xx',
}

export default Object.assign(defualtUserConfig,userConfig)