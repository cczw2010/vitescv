import { createRequire } from "module"
import {pathToFileURL} from "url"
import {normalizePath} from "vite"
import { dirname,resolve,join} from "path"
import { existsSync,writeFileSync,mkdirSync,readFileSync} from "fs"
import template from "lodash.template"

const require = createRequire(import.meta.url)
// 模块配置信息
const moduleOptions = {}
// 模块config处理结果
const moduleConfigs = {}
// 模块信息map
const moduleMap = new Map()
// modules的runtime文件地址
const runtimeModuleIndex = 'index.js'
const runtimeModuleDir = join(process.env.__PROJECTCACHEROOT,'modules')

if(!existsSync(runtimeModuleDir)){
  mkdirSync(runtimeModuleDir)
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
  Object.assign(moduleConfigs,{
    manualChunks: {},
    external: [],
    UIDirs: [],
    UIResolvers:[],
    alias: {
      'vue':require.resolve('vue'),
      'vue-router':require.resolve('vue-router'),
    },
    optimizeInclude:[],
  })

  for (let moduleName in moduleOptions) {
    const moduleOption = moduleOptions[moduleName]
    // 跳过设置成false的模块
    if(moduleOption===false){
      continue
    }
    try{
      let moduleInfo = generalModuleInfo(moduleName,moduleOption)
      // console.log(moduleInfo)
      // package.json alias
      getDepsAlias(moduleInfo)
      // module index.js
      let moduleSourceCode = readFileSync(moduleInfo.source).toString()
      transformModuleSource(moduleInfo.source,moduleSourceCode)
      // config.js
      let configFile = pathToFileURL(join(moduleInfo.sourceDir,'config.js'))
      // console.log(configFile)
      if(existsSync(configFile)){
        await import(configFile).then(m=>{
            tidyModuleConfig(m.default,moduleInfo.option)
          }).catch(e=>{
            console.error(`[${moduleName}] load config file fail!`,e)
            return null
          })
      }
    }catch(e){
      console.debug(e)
    }
  }
  // console.log(moduleMap)
  transformModuleIndexSource()
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

// 生成模块入口运行时文件
function transformModuleIndexSource(){
  let compiler  = template(`
  <%for(let i=0;i<modules.length ;i++){%>
  import vmodule_<%=modules[i].idx%> from './module-<%=modules[i].idx%>.runtime.js'
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
  }`)
  const source = compiler({modules:Array.from(moduleMap.values())})
  writeFileSync(join(runtimeModuleDir,runtimeModuleIndex),source)
  return  source
}

/**
 * 生成运行时 module
 * @param {*} id  插件中的id, 文件path
 * @param {*} code 代码
 * @returns 
 */
function transformModuleSource(id,code){
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
      writeFileSync(join(runtimeModuleDir,moduleInfo.dstName),transformedCode)
      return transformedCode
    } catch (e) {
      console.error(`[app] ${moduleInfo.origin} compile error:${e.message}`)
      return null
      // console.error(e)
    }
  }
}

// 获取并处理模块的信息
function generalModuleInfo(moduleName,moduleOption){
  let moduleIndex = normalizePath(require.resolve(moduleName,{
    paths:[process.env.__PROJECTROOT]
  }))
  if(!moduleIndex){
    console.error(`[vitescv] [${moduleName}] not exit`)
    return
  }
  let idx = moduleMap.size
  let dstName = `module-${idx}.runtime.js`

  let sourceDir = dirname(moduleIndex)
  let isPackage = existsSync(join(sourceDir,'package.json'))     //是否安装外部的包，而不是内部文件

  const moduleInfo = {
    idx,
    origin:moduleName,
    option: moduleOption||{},
    sourceDir,
    source:moduleIndex,
    dstName,
    isPackage
  }
  moduleMap.set(moduleInfo.source,moduleInfo)
  return moduleInfo
}

// 处理依赖为alias
function getDepsAlias(moduleInfo){
  if(!moduleInfo.isPackage){
    return
  }
  const alias = {}
  try{
    const json = readFileSync(join(moduleInfo.sourceDir,'package.json')).toString()
    const packages = JSON.parse(json)
    for (const dep in packages.dependencies) {
      const depSource = require.resolve(dep,{
        paths:getPackageNodemodulePaths(moduleInfo.source)
      })
      alias[dep] = getDepSourceDir(dep,depSource)
    }
    Object.assign(moduleConfigs.alias,alias)
  }catch(e){
  }
}

// @vitescv/pinia /Volumes/data/MyModules/vitescvclidemo/node_modules/.pnpm/@vitescv+pinia@1.0.5_vue@2.7.16/node_modules/@vitescv/pinia/index.js
// @vitescv/elementui /Volumes/data/MyModules/vitescv/packages/elementui/index.js
function getPackageNodemodulePaths(moduleIndex){
  // 非pnpm安装的走下面
  if(moduleIndex.startsWith(process.env.__PROJECTROOT) && moduleIndex.indexOf(".pnpm")>=0){
    return [
      join(process.env.__PROJECTROOT,'node_modules'),
      join(process.env.__PROJECTROOT,'node_modules/.pnpm/node_modules')
    ]
  }
  let dir = dirname(moduleIndex)
  if(dir){
      if(!existsSync(resolve(dir,'node_modules'))){
        return getPackageNodemodulePaths(dir)
      }else{
        return [
          join(dir,'node_modules'),
          join(dir,'node_modules/.pnpm/node_modules')
        ]
      }
  }
  return []
}

// 获取某个依赖的根目录,因为有可能会引用该依赖下其他文件所以要去根目录而不是入口文件
function getDepSourceDir(depName,fpath){
  let dir = dirname(fpath)
  if(dir){
    if(dir.endsWith(depName)){
      return dir
    }
    return getDepSourceDir(depName,dir)
  }
  return null
}