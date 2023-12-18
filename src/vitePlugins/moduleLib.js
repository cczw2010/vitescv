import { createRequire } from "module"
import {normalizePath} from "vite"
import { dirname,resolve,join} from "path"
import { existsSync} from "fs"
// import hashsum from "hash-sum"
import template from "lodash.template"
const require = createRequire(import.meta.url)

let options = {}
// 模块信息map
const moduleMap = new Map()
// 模块和入口文件映射
const moduleFilesMap = new Map()  
// modules 配置
export default async function(moduleOptions){
  options = moduleOptions
  for (let moduleName in options) {
    let isPackage = !existsSync(resolve(process.env.__PROJECTROOT,moduleName))
    let moduleIndex = normalizePath(require.resolve(moduleName))
    if(!moduleIndex){
      console.error(`[vitescv] [${moduleName}] not exit`)
      continue
    }
    moduleFilesMap.set(moduleIndex,moduleName)
    try{
      let dir = dirname(moduleIndex)
      let moduleInfo = {
        // uid:hashsum(moduleName),
        source:moduleIndex,
        dst:normalizePath(join(dir,'runtime.js')),
        dir,
        isPackage,
        config:null,
        option: options[moduleName]||{}
      }
      //config.js
      let configFile = normalizePath(join(moduleInfo.dir,'config.js'))
      if(isPackage){
        configFile = `${moduleName}/config`
      }
      // console.log(configFile)
      if(existsSync(configFile)){
        //TODO for window test url
        moduleInfo.config = await import('file://'+configFile).then(m=>m.default)
          .catch(e=>{
            console.error(`[${moduleName}] load config file fail!`,e)
            return null
          })
      }
      moduleMap.set(moduleIndex,moduleInfo)
      compilerModuleByName(moduleName)
    }catch(e){
      console.debug(e)
    }
  }
  console.log(moduleMap)
}

// 生成运行时module
export function compilerModuleByName(moduleName,code){
  // 可能是从前端直接load的
  let moduleInfo = moduleMap.get(moduleName)
  // console.debug('>>>>>>>>>[app] load module:',moduleName,moduleInfo)
  if(moduleInfo){
    try {
      let compiler  = template(code,{
        //* 数据对象变量名
        // variable:"option",
        //* 使用 `imports` 选项导入模块
        imports:{
          utils:{
            normalizePath,
            resolve
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
      console.error(e)
    }
  }
}

// 根据file url 获取moduleInfo, 用于插件
export function getModuleInfoById(id){
  return moduleMap.get(id)
}

// 获取所有模块名称数组
export function getModuleNames(){
  return Object.keys(options)
}
