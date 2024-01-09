import {resolve,join, relative,extname,parse as pathParse} from "path"
import fse from "fs-extra"
import {parseComponent as parseSFC} from "vue/compiler-sfc"
import template from "lodash.template"
import hash from "hash-sum"
import { normalizePath } from "vite"
import {parse as acornParse} from "acorn"
import {walk} from "estree-walker"
import { layoutNameKey,pageNameKey } from "../constants.js"


const virtualModuleRouteId = 'virtual:router-routes'
const resolvedVirtualModuleRouteId = '\0'+virtualModuleRouteId
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
      // 存储最终解析的配置
    },
    configureServer(server) {
      builder.setDevServer(server)
    },
    // resolve routes模块请求
    resolveId(id) {
      if (id === virtualModuleRouteId) {
        return resolvedVirtualModuleRouteId
      }
      return null
    },
    load(id) {
      if (id === resolvedVirtualModuleRouteId) {
        const routes = builder.generateModuleSource()
        // console.info(">>>>>virtual:router-routes",routes)
        return routes
      }
      return null
    },
    transform(source,id){
      // 最终返回代码处理
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
    this.routesTpl = fse.readFileSync(new URL("./routes.js",import.meta.url),'utf-8')
    // layouts
    this._travel(this.option.layoutRoot,fpath=>{
      this.setLayout(fpath)
    })
    // pages
    this._travel(this.option.pageRoot,fpath=>{
      this.setRoute(fpath)
    })
  }
  // 设置开发服务器  for dev
  setDevServer(server){
    this._devServer = server
    server.watcher.add([this.option.layoutRoot,this.option.pageRoot])
    server.watcher.on("ready",()=>{
      // console.debug(">>>>>>server.wathcer",server.watcher.getWatched())
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
    })
  }
  // 刷新 module  dev  
  reloadModule(){
    if(this._devServer){
      const {moduleGraph,ws} = this._devServer
      const module = moduleGraph.getModuleById(resolvedVirtualModuleRouteId)
      // console.debug(">>>module",module)
      if(module){
        this._devServer.reloadModule(module)
        // moduleGraph.invalidateModule(module)
        // if (ws) {
        //   ws.send({
        //     type: 'full-reload',
        //   })
        // }
      }
    }
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
      let sfc = checkSFC(pagePath,false)
      this.layouts.set(pagePath,{
        name:pathObj.name,
        asyncData:sfc.result.asyncData
      })
      if(reload){
        this.reloadModule()
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
    this.reloadModule()
  }
  // 新增一个页面路由，reloadModule的情况有两个，
  // 1 参数reload设置为true，强制reload 
  // 2 如果路由之前存在，则判断是否路由的数据信息变更了，变更了则一定会重载路由模块
  setRoute(pagePath,reload=false){
    const pathObj = pathParse(pagePath)
    const relativeDir = relative(this.option.pageRoot,pathObj.dir)
    // console.debug("setRoute",pagePath,pathObj,pathFormat(pathObj))
    const path = normalizePath(join(relativeDir,pathObj.name)).replace(/\/_/ig,'/:').toLowerCase()
    // 分析page
    let sfc
    try{
      sfc = checkSFC(pagePath,false)
      sfc.result.layout = sfc.result.layout||this.option.layoutDefault
    }catch(e){
      console.error(`[app] page route init error:${pagePath}`,e)
      return
    }
  
    const result = sfc.result
    const _pagePath =  normalizePath(pagePath)
    const _layoutPath = normalizePath(`${this.option.layoutRoot}/${result.layout}${this.option.sfcExt}`)
    const layout = this.layouts.get(_layoutPath)

    result.name = result.name||hash(pagePath)
    result.asyncDataLayout = layout&&layout.asyncData 
    // csr，asyncData直接干掉,也方便前端处理
    result.asyncData = false
    result.asyncDataLayout = false
    
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
      this.reloadModule()
    }
  }
  getRoute(pagePath){
    return this.routes.get(pagePath)
  }
  removeRoute(pagePath){
    this.routes.delete(pagePath)
    this.reloadModule()
  }
  // 生成并返回routes虚拟模块的js源码，
  generateModuleSource(){
    const compiled = template(this.routesTpl)
    return compiled({
        routes:Array.from(this.routes.values()),
        option:this.option,
        development:this.development,
        layoutNameKey,pageNameKey
      })
  }
  // page或者layout最终输出code处理
  transformCode(source,id){
    const isPage = this.isPage(id)
    const isLayout = this.isLayout(id)
    if(!isPage && !isLayout){
      return null
    }
    // build client代码时， 删除asyncData代码，防止前端泄露
    // console.log('>>>>>transformCode:'this.development)
    if(!this.development){
      // 重新分析，防止被其他组件处理过
      const sfc = checkSFC(source,true)
      if(sfc.result.asyncData){
        const pos =  sfc.result.asyncData
        return source.replace(source.substring(pos[0],pos[1]),'')
      }
    }
    return null
  }
  // 遍历加载routes
  _travel(dir,cb) {
    const files = fse.readdirSync(dir)
    // 默认按照字母正序，而_开头的泛域名在最前
    // files.reverse()
    for (const k in files) {
      const file = files[k];
      const fpath = join(dir, file)
      const stats = fse.statSync(fpath)
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
function checkSFC(source,isCode){
  if(!isCode){
    source = fse.readFileSync(source,"utf-8")
  }
  const sfc = parseSFC(source);
  const result = {layout:false,asyncData:false,head:false,name:false,alias:false}
  // console.debug(sfc)
  // sfc.scriptSetup sfc.customBlocks sfc.errors sfc.cssVars sfc.styles
  if(sfc.script && sfc.script.content){
    // console.log(sfc.script.content)
    const ast = acornParse(sfc.script.content, {ecmaVersion: 2020,sourceType:'module'})
    // let s = new MagicString(sfc.script.content)
    walk(ast, {
      enter(node, parent, prop, index) {
        // console.debug(index,prop,node.type,node.key&&node.key.name)
        // 0 body ExportDefaultDeclaration undefined
        // null declaration ObjectExpression undefined
        if(prop=='declaration' && node.type=='ObjectExpression' && parent.type=="ExportDefaultDeclaration"){
          // console.debug(">>>>>>>>>",node.properties) // [async,head data....]
          node.properties.forEach((propItem,i) => {
            // 如果不是最后一个proptype，那么为了包含进去",",结束点为下个proptype之前。
            switch(propItem.key.name){
              case "asyncData":
                const codeEnd = i<node.properties.length-1?node.properties[i+1].start-1:propItem.end
                result.asyncData = [sfc.script.start+propItem.start,sfc.script.start+codeEnd]
                // result.asyncData = source.substring(sfc.script.start+propItem.start,sfc.script.start+codeEnd)
                // s.remove(propItem.start,codeEnd)
                // console.log(source,sfc.script,result.asyncData)
                break;
              case "head":
                result.head =  true
                break;
              case "name":
                if(propItem.value.type!='Literal'){
                  console.warn('[app] prop name must be a Literal String:',pagePath)
                }else{
                  result.name =  propItem.value.value
                }
                break;
              case "alias":
                if(propItem.value.type!='Literal' || !propItem.value.value.startsWith("/")){
                  console.warn('[app] prop alias must be a Literal String also startsWith "/" :\nFile:',pagePath)
                }else{
                  result.alias =  propItem.value.value
                }
                break;
              // case "middleware":
              //   // console.log(propItem.value)
              //   result.middleware = []
              //   if(propItem.value.type=='Literal'){
              //     result.middleware.push(propItem.value.value)
              //   }else if(propItem.value.type=='ArrayExpression'){
              //     propItem.value.elements.forEach(eitem => {
              //       if(eitem.type=='Literal'){
              //         result.middleware.push(eitem.value)
              //       }
              //     });
              //   }
              //   break;
              case "layout":
                if(propItem.value.type!='Literal'){
                  console.warn('[app] layout must be a Literal String :\nFile:',pagePath)

                }else{
                  result.layout = propItem.value.value
                }
                break;
              //默认自动收集其他字面量属性 ,便于用户扩展
              // {type: "Literal"; value: string | boolean | null | number | RegExp;}
              default:
                if(propItem.value.type=='Literal'){
                  result[propItem.key.name] = propItem.value.value
                }
                break;
            }
          });
          this.skip()
        }
      },
      // leave(node, parent, prop, index) {
      // }
    })
  }
  return {result,source}
}


// 获取某个对象某个属性的内容
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
