// 从这里作为入口是为了方便监控和预留用户自定义vite.cofnig.js
import { dirname ,join} from "path"
import { existsSync } from "fs"
import defaultViteConfig  from "vitescv/viteconfig"
import userConfig from "./config.js"
import { createRequire } from "module"

const require = createRequire(import.meta.url)
// @rollup/plugin-node-resolve   modulePaths项
userConfig.resolveModulePath = userConfig.resolveModulePath ||[]
// @rollup/plugin-node-resolve   modulePaths项
userConfig.manualChunks =  userConfig.manualChunks || {}
userConfig.external =  userConfig.external ||[]
userConfig.UIDirs = userConfig.UIDirs ||[]
userConfig.UIResolvers =  userConfig.UIResolvers ||[]
userConfig.buildCommonjsInclude =  userConfig.buildCommonjsInclude ||[]
//💡 处理模块包 的扩展配置文件，这个文件目前是必须的。
if(userConfig.modules){
  for (let moduleName in userConfig.modules) {
    let moduleIndex = require.resolve(moduleName)
    if(!moduleIndex){
      console.error(`[vitescv] [${moduleName}] not exit`)
      continue
    }
    let moduleDir = dirname(moduleIndex)
    try{
      let moduleOption = userConfig.modules[moduleName]||{}
      let moduleConfigPath = null
      // 配置文件地址
      if(moduleName.endsWith(".js") || moduleName.startsWith("@/")){
        moduleConfigPath = join(moduleDir,'config.js').replace(/^@\//,process.cwd()+'/')
        if(!existsSync(moduleConfigPath)){
          moduleConfigPath = null
        }
      }else if(moduleName.startsWith('@vitescv/')){
        // 判断是不是 @vitescv/xxx 模块
        moduleConfigPath = `${moduleName}/config`
      }
      let moduleConfig = await import(moduleConfigPath)
        .then(m=>m.default)
        .catch(e=>{
          console.error(`[${moduleName}] load config file fail!`)
          return null
        })
      // console.debug(">>>>>>",moduleName,moduleConfig)
      userConfig.resolveModulePath.push(join(moduleDir,'node_modules'))

      if(moduleConfig){
        if(moduleConfig.manualChunks){
          Object.assign(userConfig.manualChunks,moduleConfig.manualChunks)
        }
        if(Array.isArray(moduleConfig.external)){
          userConfig.external = userConfig.external.concat(moduleConfig.external)
        }
        if(Array.isArray(moduleConfig.UIDirs)){
          userConfig.UIDirs = userConfig.UIDirs.concat(moduleConfig.UIDirs)
        }
        if(Array.isArray(moduleConfig.buildCommonjsInclude)){
          userConfig.buildCommonjsInclude = userConfig.buildCommonjsInclude.concat(moduleConfig.buildCommonjsInclude)
        }
        // UIResolvers
        if(Array.isArray(moduleConfig.UIResolvers)){
          const resolverOption = moduleOption.resolver
          moduleConfig.UIResolvers.forEach(uiResolver => {
            switch(typeof uiResolver){
              case 'function':
                userConfig.UIResolvers.push(uiResolver.call(null,resolverOption))
                break;
              case 'object':
                userConfig.UIResolvers.push(uiResolver)
                break;
            }
          })
        }
      }
    }catch(e){
      console.debug(e)
    }
  }
}
// console.debug(userConfig)
export default  defaultViteConfig(userConfig)