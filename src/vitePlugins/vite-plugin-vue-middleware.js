import {normalizePath} from "vite"
import {resolve} from "path"
import template from "lodash.template"
const virtualId = 'virtual:middlewares'
const resolvedVirtualId = '\0'+virtualId
/**
 * 虚拟组件，加载所有配置的中间件，会运行于全局收尾beforeEach
 * @export
 * @param {array} option []
 * @returns
 */
export default function (option) {
  option = option||[]
  const middlewares = option.map((fpath)=>{
    return normalizePath(resolve(fpath))
  })
  return {
    name: 'vite-plugin-vue-middleware',
    // enforce: 'post',
    // apply: 'build', // 或 'serve'
    // configureServer(server){
    // },
    resolveId(id,option) {
      if (id == virtualId) {
        return resolvedVirtualId
      }
      return null
    },
    load(id,option) {
      if (id !== resolvedVirtualId) {
        return null
      }
      const compiler  = template(tpl)
      return compiler({middlewares,normalizePath:fpath=>normalizePath(resolve(fpath))})
    }
  }
}
const tpl = `
// 全局设置引入的middlewares
const importMiddlewares = []
<%
let idx = 0
for(const fpath of middlewares){
  const mname = 'middleware_'+ idx++
%>
import <%=mname%> from "<%=normalizePath(fpath)%>"
importMiddlewares.push(<%=mname%>)
<%}%>
// 模块中动态添加的middlewares,需要key,val模式是为了防止开发模式热加载的时候多次加载
const addedMiddlewares = {}
function addMiddleware(name,middleware){
  addedMiddlewares[name] = middleware
}

function getMiddlewares(){
  return importMiddlewares.concat(Object.values(addedMiddlewares))
}

export {getMiddlewares,addMiddleware}
`