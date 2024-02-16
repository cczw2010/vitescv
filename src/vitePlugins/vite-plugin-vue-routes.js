import {resolve,join, relative,extname,parse as pathParse} from "path"
import {readFileSync,readdirSync,statSync,writeFileSync} from "fs"
import {parseComponent as parseSFC} from "vue/compiler-sfc"
import template from "lodash.template"
import hash from "hash-sum"
import { normalizePath } from "vite"
// import parseVueScript from "./acornParser.js"
import parseVueScript from "./babelParser.js"
import { layoutNameKey,pageNameKey } from "../constants.js"

const defaultOption = {
  pageRoot:'view/pages',
  layoutRoot:'view/layouts',
  layoutDefault:'default',
  sfcExt:'.vue',
  page404:''
}
// 以下是路由相关的组件预设，可自定义
const defaultComponents = {
  componentLoading:'@@vitescv/src/components/AppLoading.vue',
  componentError:'@@vitescv/src/components/AppError.vue',
  compomentRouteView:'@@vitescv/src/components/AppView.vue'
}

/**
 * 虚拟组件，生成router需要的routes, 以及页面相关的一些配置信息
 * @export
 * @param {object} options {
 *            pageRoot:'src/layouts',
 *            layoutRoot:'src/layouts',
 *            layoutDefault:'default',
 *            sfcExt:'.vue',
 *            componentLoading:'path',
 *            componentError:'path',
 *            compomentRouteView:'path',
 *            page404:'/404'
 *         }
 * @returns
 */
export default function (option) {
  option = Object.assign({},defaultOption,option)
  option.pageRoot = resolve(option.pageRoot)
  option.layoutRoot = resolve(option.layoutRoot)
  // 无设置组件使用默认的
  option.componentLoading = normalizePath(option.componentLoading||defaultComponents.componentLoading)
  option.componentError = normalizePath(option.componentError||defaultComponents.componentError)
  option.compomentRouteView = normalizePath(option.compomentRouteView||defaultComponents.compomentRouteView)
  
  // 初始化的时候就生成实例，将已有的当前路由自动生成
  let builder = null
  return {
    name: 'vite-plugin-vue-routes',
    // enforce: 'post',
    // apply: 'build', // 或 'serve'
    configResolved(resolvedConfig) {
      builder = new RouteModule(option,resolvedConfig)
      // console.log(`${virtualModuleRouteId}>>>>>>>>>>>configResolved:`,resolvedConfig)
    },
    configureServer(server) {
      builder.setDevServer(server)
    },
    transform(source,id){
      // 处理page and layout
      return builder.transformCode(source,id)
    }
  }
}

/**
 * routes 的获取模块
 * @class RouteModule
 */
class RouteModule{
  constructor(option,viteConfig){
    this.option = option
    this.viteConfig = viteConfig
    this.development = viteConfig.mode=='development'
    this.routes = new Map()
    this.layouts = new Map()
    this.routesTpl = readFileSync(new URL("./routeTpl.js",import.meta.url),'utf-8')
    this.runtimePath = join(process.env.__PROJECTCACHEROOT,'routes.runtime.js')
    // layouts
    this._travel(this.option.layoutRoot,fpath=>{
      this.setLayout(fpath)
    })
    // pages
    this._travel(this.option.pageRoot,fpath=>{
      this.setRoute(fpath)
    })
    this.generateModuleSource()
  }
  // 设置开发服务器  for dev
  setDevServer(server){
    server.watcher.add([this.option.layoutRoot,this.option.pageRoot])
    server.watcher
      .on('add', fpath => {
        if(this.isPage(fpath)){
          this.setRoute(fpath,true)
        }else if(this.isLayout(fpath)){
          this.setLayout(fpath,true)
        }
      })
      .on('change', fpath => {
        if(this.isPage(fpath)){
          // 会自动检查route的meta信息是否变了，变了的话要热更新模块
          this.setRoute(fpath)
        }
      })
      .on('unlink', fpath => {
        if(this.isPage(fpath)){
          this.removeRoute(fpath,true)
        }else if(this.isLayout(fpath)){
          this.removeLayout(fpath,true)
        }
      })
  }
  // 刷新 module  dev  
  refreshModule(){
    this.generateModuleSource()
  }
  // 是不是page
  isPage(fpath){
    return fpath.startsWith(this.option.pageRoot) && (extname(fpath)==this.option.sfcExt)
  }
  // 是不是layout
  isLayout(fpath){
    return fpath.startsWith(this.option.layoutRoot) && (extname(fpath)==this.option.sfcExt)
  }
  // 新增一个layout
  setLayout(pagePath,reload=false){
    // normalizePath(`${this.option.layoutRoot}/${result.layout}.vue`),
    const pathObj = pathParse(pagePath)
    try{
      this.layouts.set(pagePath,{
        name:pathObj.name,
      })
      if(reload){
        this.refreshModule()
      }
    }catch(e){
      console.error(`[app] layout loaded error:${pagePath}`,e)
      return
    }
  }
  getLayout(pagePath){
    return this.layouts.get(pagePath)
  }
  removeLayout(pagePath){
    this.layouts.delete(pagePath)
    this.refreshModule()
  }
  // refreshModule的情况有两个，
  // 1 参数reload设置为true，重构模块代码
  // 2 如果路由之前存在，则判断是否路由的数据信息变更了，变更了则一定会重载路由模块
  setRoute(pagePath,reload=false){
    const pathObj = pathParse(pagePath)
    const relativeDir = relative(this.option.pageRoot,pathObj.dir)
    // console.debug("setRoute",pagePath,pathObj,pathFormat(pathObj))
    const path = normalizePath(join(relativeDir,pathObj.name)).replace(/\/_/ig,'/:').toLowerCase()
    // 分析page
    let sfc
    try{
      sfc = checkSFC(pagePath)
      sfc.result.layout = sfc.result.layout||this.option.layoutDefault
    }catch(e){
      console.error(`[app] page route init error:${pagePath}`,e)
      return
    }
  
    const result = sfc.result
    const _pagePath =  normalizePath(pagePath)
    const _layoutPath = normalizePath(`${this.option.layoutRoot}/${result.layout}${this.option.sfcExt}`)
    // const layout = this.layouts.get(_layoutPath)

    result.name = result.name||hash(pagePath)
    
    // reload为false，判断是否变更了数据meta， 变更了照样reload
    const oldRoute = this.routes.get(pagePath)
    if(!reload && oldRoute && oldRoute.meta){
      let oldKeys = Object.keys(oldRoute.meta).sort()
      let newKeys = Object.keys(sfc.result).sort()
      if(JSON.stringify(oldKeys)!=JSON.stringify(newKeys)){
        reload = true
      }else{
        reload = oldKeys.some((v)=>{
          return oldRoute.meta[v]!=sfc.result[v]
        })
      }
      // debug
      if(reload){
        console.debug(`page route meta changed. reload routes`)
      }
    }
    
    this.routes.set(pagePath,{
      name:result.name,
      path:`/${path}`,
      meta:result,
      page:_pagePath,
      layout:_layoutPath,
    })
    if(reload){
      this.refreshModule()
    }
  }
  getRoute(pagePath){
    return this.routes.get(pagePath)
  }
  removeRoute(pagePath){
    this.routes.delete(pagePath)
    this.refreshModule()
  }
  // 生成并返回routes虚拟模块的js源码，
  generateModuleSource(){
    const compiled = template(this.routesTpl)
    const routes = Array.from(this.routes.values())
    // 排序是为了让[:]动态路由在后面
    routes.sort((a,b)=>a.path>b.path?-1:1)
    const source = compiled({
        routes,
        option:this.option,
        development:this.development,
        layoutNameKey,pageNameKey
      })
    writeFileSync(this.runtimePath,source)
    return source
  }
  // page或者layout最终输出code处理
  transformCode(source,id){
    const isPage = this.isPage(id)
    const isLayout = this.isLayout(id)
    if(!isPage && !isLayout){
      return null
    }
    return null
  }
  // 遍历加载routes
  _travel(dir,cb) {
    const files = readdirSync(dir)
    // 默认按照字母正序，而_开头的泛域名在最前
    // files.reverse()
    for (const k in files) {
      const file = files[k];
      const fpath = join(dir, file)
      const stats = statSync(fpath)
      if (stats.isDirectory()) {
        this._travel(fpath,cb);
      } else if(fpath.endsWith(this.option.sfcExt)){
        cb(fpath)
      }
    }
  }
}

// 检查page文件，mixin
// return {source,result}
function checkSFC(pagePath){
  const source = readFileSync(pagePath,"utf-8")
  const sfc = parseSFC(source);
  const result = {layout:false,name:false,alias:false}
  // console.debug(sfc)
  // sfc.scriptSetup sfc.customBlocks sfc.errors sfc.cssVars sfc.styles
  if(sfc.script && sfc.script.content){
    // console.log(sfc.script.content)
    const parseResult = parseVueScript(sfc.script.content,pagePath)
    // console.log(JSON.stringify(ast, null, 2));
    Object.assign(result,parseResult)
  }
  return {result,source}
}


// 获取某个对象某个属性的内容
// let s = new MagicString(sfc.script.content)
// function getPropNodeCode(magicstring,node){
//   if(node.shorthand){
//     // TODO get the origin code
//     return node.key.name
//   }else if(node.method){
//     // 是个简写方法，直接返回整个内容
//     return magicstring.slice(node.start,node.end)
//   }else{
//     return magicstring.slice(node.value.start,node.value.end)
//   }
// }
