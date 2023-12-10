// 虚拟模块 - APP辅助函数

const virtualModuleRouteId = '@APP/helper'
const resolvedVirtualModuleRouteId = '\0'+virtualModuleRouteId

/**
 * 一些基于应用的用户辅助函数
 */
export default function () {
  return {
    name: 'vite-plugin-vue-apphelper',
    resolveId(id) {
      if (id === virtualModuleRouteId) {
        return resolvedVirtualModuleRouteId
      }
      return null
    },
    async load(id) {
      // 模块
      if (id === resolvedVirtualModuleRouteId) {
        return helperModuleCode
      }
      return null
    }
  }
}
const helperModuleCode = `
export {defineStore} from "./src/store.js"
import {addMiddleware as _addMiddleware} from "virtual:middlewares"

export function addMiddleware(middleware){
  // 获取当前执行引入helper的文件，错误栈中的第二个 
  try{
    throw new Error("get track")
  }catch(e){
    // console.error(e.stack,e.stack.split(/at(.+):\\d+:\\d+\\)?/g))
    const filename = e.stack.split(/at(.+):\\d+:\\d+\\)?/g)[3].trim()
    // console.debug('>>>>>middleware add:',filename)
    _addMiddleware(filename,middleware)

   }
}
`