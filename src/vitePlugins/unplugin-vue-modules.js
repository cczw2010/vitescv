import {resolve} from "path"
import { existsSync } from "fs"
import template from "lodash.template"
import { createRequire } from 'module'
import {normalizePath} from "vite"
import { createUnplugin } from 'unplugin'

const virtualModuleRouteId = 'virtual:modules'
const resolvedVirtualModuleRouteId = '\0'+virtualModuleRouteId
const require = createRequire(process.env.__PROJECTCACHEROOT)

/**
 * 全局可编译vue module模块加载，在app创建期间调用，可用于加载一些定制的模块初始化，返回一个对象，包含minxins数组和options对象,并作为注入对象注入到app创建参数对象中
 * 模块文件可以为模板文件，多个模块的值注意覆盖问题
 * 模块文件内部用import.meta.env.DEV来判断是不是开发模式（见vite环境变量）
 * 
 * @export
 * @param {object|false} options  vuemodule的配置，设置为false关闭
          {
              modulepath:{...moduleoption}， //moduleoption为模块设置，会被以[option]变量注入模块的模板文件
          }  
 */
export default function(options){
  return createUnplugin((UserOptions, meta) => {
    // 根据模块配置生成子动态模块
    const hotmodules = new Map()
    options = options||{}
    for(let modulePath in options){
      try{
        // 判断是否是依赖包
        const isPackage = !existsSync(resolve(process.env.__PROJECTROOT,modulePath))
        let realModulePath = normalizePath(require.resolve(modulePath))
        hotmodules.set(realModulePath,{
          idx:hotmodules.size,
          origin:modulePath,
          options:options[modulePath],
          isPackage
        })
      }catch(e){
        console.warn(`[app] load module [${modulePath}] error! Is it existed?`,e)
      }
    }
    // console.debug(hotmodules)
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
          if(!options){
            return 'export default null'
          }
          let compiler  = template(tplModules)
          return compiler({modules:Array.from(hotmodules.values())})
        }
        return null
      },
      transformInclude(id){
        if(hotmodules.has(id)){
          return true
        }
      },
      transform(code,id,option){
        // let moduleInfo = hotmodules.get(id.replace(/^\/@fs/,"").split("?v=")[0])
        let moduleInfo = hotmodules.get(id)
        if(moduleInfo){
          // 加载的其他子动态模块
          // console.debug('[app] load module:',moduleInfo)
          let transformedCode = 'export default {}'
          try{
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
              sourceURL:""
            })
            transformedCode = compiler({
              option:moduleInfo.options,
              cwd:resolve(process.env.__PROJECTROOT),
              // ENV:process.env,
            })
          }catch(e){
            if(process.env.NODE_ENV=='development'){
              console.error(e)
            }else{
              console.warn(`[app] load module [${moduleInfo.origin}] error: ${e.message}`)
            }
          }
          // console.debug('>>>>>>>>transformed:',id)
          return {
            code: transformedCode,
            map: { mappings: '' }
          }
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
export default function(App){
<%for(let module of modules){%>
  if(typeof vmodule_<%=module.idx%> == 'function'){
    vmodule_<%=module.idx%>(<%=JSON.stringify(module.options)%>,App)
  }
<%}%>
}`