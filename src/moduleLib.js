import { createRequire } from "module"
import {pathToFileURL} from "url"
import {normalizePath} from "vite"
import { dirname,resolve,join} from "path"
import { existsSync} from "fs"
import { createUnplugin } from 'unplugin'
import template from "lodash.template"

const require = createRequire(import.meta.url)
// 模块配置信息
const moduleOptions = {}
// 模块config处理结果
const moduleConfigs = {}
// 模块信息map
const moduleMap = new Map()

function initModuleConfigs(){
  Object.assign(moduleConfigs,{
    manualChunks: {},
    linkModulePaths:[], //link等项目外部包的resolve的node_modules目录
    linkModuleRoots:[],//link等项目外部包的项目根目录
    external: [],
    UIDirs: [],
    UIResolvers:[],
    alias: {'vue':require.resolve('vue')},
    optimizeInclude:[],
    optimizeExclude:[],
  })
}
/**
 * 初始化 modules 配置, 返回整理后的模块配置集合
 * @param {object|false} options  vuemodule的配置，设置为false关闭
 *   {
 *       modulepath:{...moduleoption}， //moduleoption为模块设置，会被以[option]变量注入模块的模板文件
 *   }  
 */ 
export async function initModules(options){
  Object.assign(moduleOptions,options)
  moduleMap.clear()
  initModuleConfigs()

  // 如果是link的vitescv
  if(!process.env.__VITESCVROOT.startsWith(process.env.__PROJECTROOT)){
    moduleConfigs.linkModuleRoots.push(process.env.__VITESCVROOT)
    moduleConfigs.linkModulePaths.push(resolve(process.env.__VITESCVROOT,'node_modules'))
  }
  for (let moduleName in moduleOptions) {
    let isPackage = !existsSync(resolve(process.env.__PROJECTROOT,moduleName)) //是否安装的包，而不是内部文件
    let moduleIndex = normalizePath(require.resolve(moduleName,{
      paths:[process.env.__PROJECTROOT]
    }))
    if(!moduleIndex){
      console.error(`[vitescv] [${moduleName}] not exit`)
      continue
    }
    try{
      let dir = getModuleRootPathByIndex(moduleIndex,moduleName,isPackage,!moduleIndex.startsWith(process.env.__PROJECTROOT))
      let moduleInfo = {
        idx:moduleMap.size,
        origin:moduleName,
        option: moduleOptions[moduleName]||{},
        source:moduleIndex,
        dir,
        isPackage,
      }
      moduleConfigs.linkModuleRoots.push(dir)
      //config.js
      let configFile = pathToFileURL(join(moduleInfo.dir,'config.js'))
      // console.log(configFile)
      if(existsSync(configFile)){
        await import(configFile).then(m=>{
            tidyModuleConfig(m.default,moduleInfo.option)
          }).catch(e=>{
            console.error(`[${moduleName}] load config file fail!`,e)
            return null
          })
      }
      // link的时候要把外部包的地址加到reslove的paths里去
      if(moduleInfo.isPackage && !moduleInfo.source.startsWith(process.env.__PROJECTROOT)){
        moduleConfigs.linkModulePaths.push(join(moduleInfo.dir,'node_modules'))
      }

      if(isPackage){
        moduleConfigs.optimizeInclude.push(moduleName)
      }

      moduleMap.set(moduleIndex,moduleInfo)
    }catch(e){
      console.debug(e)
    }
  }
  // console.log(moduleMap)
  return moduleConfigs
}

/**
 * 整理某个模块的config.js 
 * @param {*} moduleConfig module的 config.js 的内容
 * @param {*} moduleOption module的用户config.js中对应的option
 */
function tidyModuleConfig(moduleConfig,moduleOption){
  if(moduleConfig){
    if(moduleConfig.manualChunks){
      Object.assign(moduleConfigs.manualChunks,moduleConfig.manualChunks)
    }
    if(Array.isArray(moduleConfig.external)){
      moduleConfigs.external = moduleConfigs.external.concat(moduleConfig.external)
    }
    if(Array.isArray(moduleConfig.UIDirs)){
      moduleConfigs.UIDirs = moduleConfigs.UIDirs.concat(moduleConfig.UIDirs)
    }
    if(Array.isArray(moduleConfig.optimizeInclude)){
      moduleConfigs.optimizeInclude = moduleConfigs.optimizeInclude.concat(moduleConfig.optimizeInclude)
    }
    // UIResolvers
    if(Array.isArray(moduleConfig.UIResolvers)){
      const resolverOption = moduleOption.resolver
      moduleConfig.UIResolvers.forEach(uiResolver => {
        switch(typeof uiResolver){
          case 'function':
            moduleConfigs.UIResolvers.push(uiResolver.call(null,resolverOption))
            break;
          case 'object':
            moduleConfigs.UIResolvers.push(uiResolver)
            break;
        }
      })
    }
  }
}

//////////////////////////////////////////////////////////////////  plugin
/**
 * 全局可编译vue module模块加载，在app创建期间调用，可用于加载一些定制的模块初始化，返回一个对象，包含minxins数组和options对象,并作为注入对象注入到app创建参数对象中
 * 模块文件可以为模板文件，多个模块的值注意覆盖问题
 * 模块文件内部用import.meta.env.DEV来判断是不是开发模式（见vite环境变量）
 * 
 * @export  unplugin modules
 */
export function unpluginModules(){
  const virtualModuleRouteId = 'virtual:modules'
  const resolvedVirtualModuleRouteId = '\0'+virtualModuleRouteId
  
  return createUnplugin((UserOptions, meta) => {
    // 根据模块配置生成子动态模块
    return {
      name: 'unplugin-vue-modules',
      enforce: 'pre',
      resolveId(id,importer,option) {
        if (id === virtualModuleRouteId) {
          return resolvedVirtualModuleRouteId
        }
        return null
      },
      load(id,option) {
        if (id === resolvedVirtualModuleRouteId) {
          // 根据配置加载全局modules
          if(!moduleMap.size){
            return 'export default null'
          }
          let compiler  = template(tplModules)
          return compiler({modules:Array.from(moduleMap.values())})
        }
        return null
      },
      transformInclude(id){
        if(moduleMap.has(id)){
          return true
        }
      },
      transform(code,id,option){
        // let moduleInfo = moduleMap.get(id.replace(/^\/@fs/,"").split("?v=")[0])
        // console.log("transform>>>>>>>>>>",id)
        code = transformedCode(id,code)
        return {
          code,
          map: { mappings: '' }
        }
      }
    }
  })
}
// 两次forof 索引会出问题  🙈
const tplModules = `
<%for(let i=0;i<modules.length ;i++){%>
import vmodule_<%=modules[i].idx%> from '<%=modules[i].origin%>'
<%}%>
export default async function(App){
<%for(let module of modules){%>
  await initModule(vmodule_<%=module.idx%>,<%=JSON.stringify(module.option)%>,App)
<%}%>
}
async function initModule(func,option,App){
  if(func.toString().startsWith("async")){
    await func(option,App)
  }else{
    func(option,App)
  }
}
`

/**
 * 生成运行时 module，用于插件 transform
 * @param {*} id  插件中的id, 文件path
 * @param {*} code 代码
 * @returns 
 */
function transformedCode(id,code){
  // 可能是从前端直接load的
  let moduleInfo = moduleMap.get(id)
  // console.debug('>>>>>>>>>[app] load module:',id,moduleInfo)
  if(moduleInfo){
    try {
      let compiler  = template(code,{
        //* 数据对象变量名
        // variable:"option",
        //* 使用 `imports` 选项导入模块
        imports:{
          utils:{
            normalizePath,
            resolve,
            join
          }
        },
        //* 使用 `sourceURL` 选项指定模板的来源URL, 在开发工具的 Sources 选项卡 或 Resources 面板中找到
        // sourceURL:""
      })
      let transformedCode = compiler({
        option:moduleInfo.option,
        cwd:process.cwd(),
        // ENV:process.env,
      })
      return transformedCode
    } catch (e) {
      console.error(`[app] ${moduleInfo.origin} compile error:${e.message}`)
      // console.error(e)
    }
  }
}

// 获取模块的根目录
function getModuleRootPathByIndex(moduleIndex,moduleName,isPackage,isLink){
  let dir = dirname(moduleIndex)
  if(!isPackage){
    return dir
  }
  if(dir){
    if(isLink){
      if(!existsSync(resolve(dir,'package.json'))){
        return getModuleRootPathByIndex(dir,moduleName,isPackage,isLink)
      }
    }else if(!dir.endsWith(moduleName)){
      return getModuleRootPathByIndex(dir,moduleName,isPackage,isLink)
    }
    return dir
  }
  return null
}