/**
 * 完成第一次服务器端渲染 route则被前端接管
 */
import Vue from 'vue'
import VueRouter from "vue-router"
import getRoutes,{page404} from "virtual:router-routes"
import {getMiddlewares} from "virtual:middlewares"
// 3.1开始 
Vue.use(VueRouter)
export default function createRouter () {
  const routes = getRoutes()
  const router = new VueRouter({
    mode: 'history',
    routes,
    // scrollBehavior 
   })
  /**onError触发情况
   * 错误在一个路由守卫函数中被同步抛出；
   * 错误在一个路由守卫函数中通过调用 next(err) 的方式异步捕获并处理；
   * 渲染一个路由的过程中，需要尝试解析一个异步组件时发生错误（本程序情况，但是并未到此）
   */
  router.onError((e)=>{
    console.error("[app] router.onError:",e)
  })
 
  //注册在全局beforeEach，服务端运行一次，在onReady之前也会执行一次  从初始路由到目的路由
  router.beforeEach((to, from, next) => {
    // VueRouter.START_LOCATION==from
    console.debug("[app] (router.beforeEach) from:",from.fullPath,'to:',to.fullPath)
    // 1 判断路由是否无效路由
    let matched = router.getMatchedComponents(to);
    if(!matched.length){
      if(page404){
        return next(page404)
      }else{
        return next(new Error('[app] router match error:no matched router'))
      }
    }
    //  2 处理全局中间件 
    const middlewares = getMiddlewares()
    if(middlewares.length==0){
      return next()
    }
    const middleware_fns = []
    const params = Object.assign({to,from,next,router})
    middlewares.forEach(middleware => {
      middleware_fns.push(middleware(params))
    });
    Promise.all(middleware_fns)
      // .then(values=>{
      //   // console.debug('<<<<<<<Promise.all',values)
      // })
      .catch(e=>{
        // console.error('global route middleware error:',e)
        next(e)
      })
  })
  
  // 进入路由后 
  // router.afterEach((to,from)=>{
  //   // let matched = router.getMatchedComponents(to);
  //   console.debug(">>>global router.afterEach:")
    
  // })
  return router
}


