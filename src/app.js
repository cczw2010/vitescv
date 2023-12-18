// 为App提供全局上下文对象，对模块及用户使用提供API

import Vue from 'vue'
import AppComponent from "./App.vue"
import initModules from "virtual:modules"
import createRouter from './router.js'

//@Const 钩子名称
const HookStatus = {
  INIT:'APP:INIT',            //App初始化之前：cb{$App,options,Vue}
  CREATED:'APP:CREATED',      //App初始化完成后：cb{app,$App,Vue}
}
//@Const 钩子方法队列
const Hooks = {}
for (const status in HookStatus) {
  Hooks[HookStatus[status]] = []
}

//@main context主类
const Context = {
  HOOKS:HookStatus,
  Vue,
  app : null,                       //Vue应用实例
  router : null,                    //router实例
  // 注册钩子
  hook(status,cb){
    if(status in Hooks){
      Hooks[status].push(cb)
      return
    }
    console.warn(`[App] hook:${status} is not supported!`)
  }
}
//////////// 初始化非可视隐私属性,用于系统
//初始化Vue应用实例的参数
Object.defineProperty(Context,'options',{
  configurable:false,
  enumerable:false,
  writable:true,
  value:{}
})
//初始化Vue应用实例的mixins
Object.defineProperty(Context,'mixins',{
  configurable:false,
  enumerable:false,
  writable:true,
  value:[]
})
  
// Hook准备期执行,主要生成Vue实例的参数并合并，{}
// 除了mixin会扩展合并mixins，其他属性会覆盖合并，请注意。
function hookInit(){
  // 1 初始化模块
  initModules(Context)
  // 2 合并各模块
  for (const hookfunc of Hooks[HookStatus.INIT]) {
    const options = {}
    hookfunc.call(null,options)
    for(let k in options){
      let v = options[k]
      switch (k) {
        case 'mixin':
        case 'mixins':
          Context.mixins = Context.mixins.concat(v)
          break;
        default:
          Context.options[k] = v
          break;
      }
    }
  }
}
// Hook 初始化完成后
function hookCreated(){
  for (const hookfunc of Hooks[HookStatus.CREATED]) {
    hookfunc.call(Context)
  }
}
// =======================================start

// @export 创建应用
export default function(){
  console.debug("[app] init")
  Context.router = createRouter()
  // 1 Hook,app初始化前 
  hookInit()
  // 2 app初始化前 
  Context.app = new Vue({
    router:Context.router,
    ...Context.options,
    mixins:Context.mixins,
    render: h => h(AppComponent)
  })
  // 3 app初始化后
  hookCreated()
  console.debug("[app] created")
  return Context
}