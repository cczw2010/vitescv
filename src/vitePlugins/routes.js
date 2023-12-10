import Vue,{defineAsyncComponent} from 'vue'
// 先加载相关组件
import AppView from '<%=option.compomentRouteView%>' 
import AppLoading from '<%=option.componentLoading%>'
import AppError from '<%=option.componentError%>'
Vue.component("AppLoading",AppLoading)
Vue.component("AppView",AppView)
Vue.component("AppError",AppError)
const isServer = import.meta.env.SSR
// const startPage = isServer?null:location.pathname
// ==== 异步组件 + 异步路由组装
// https://stackoverflow.com/questions/54476294/using-async-components-with-loading-and-error-components-in-vue-router
const lazyLoadRoute = (asyncView,routePath,alias) => {
  if(isServer){
    return asyncView
  }

  // 3 CSR&SSR模式，运行时是CSR的就返回异步路由+异步组件
  // vue3 or vue2.7 async router
  const AsyncComponent = defineAsyncComponent({
    loader:asyncView,
    loadingComponent:Vue.component("AppLoading"),
    errorComponent:Vue.component("AppError"),
    delay:200,
    timeout:10000,
    suspensible: false, // Vue2 不支持，可惜
    // onError(error, retry, fail, attempts) {
    //   // 注意，retry/fail 就像 promise 的 resolve/reject 一样：
    //   // 必须调用其中一个才能继续错误处理。
    //   // import.meta.env.DEV
    //   if(!isServer){
    //     if (attempts < 3) {
    //       // 请求发生错误时重试，最多可尝试 3 次
    //       console.log(import.meta.env.MODE,"retrying...",attempts)
    //       retry()
    //     } else {
    //       console.error('router onError:',error,asyncView)
    //       //fail在ssr的时候基本就会中断程序，输出错误了
    //       fail(error)
    //     }
    //   }
    // }
  })
  // === 异步路由+异步组件，loading & error works (直接return AsyncComponent，loading和 error not work)
  return ()=>(Promise.resolve({
      functional: true,
      render(h, {data, children}) {
          // Transparently pass any props or children
          // to the view component.
          return h(AsyncComponent, data, children);
      }
    })
  )
}
export default function(){
  const appRoutes = []
<% 
for(const route of routes){ 
%>
  appRoutes.push({
    // name:'', //有默认子路由的话父路由不能命名
    path:'<%=route.path%>',
    // props: {
    //   __layout:route => ({
    //     params:route.params,
    //     query:route.query
    //   })
    // },
    <%
      const alias = []
      if(route.meta.alias){
        alias.push(route.meta.alias)
      }
      // 目录下的index
      if(route.path.endsWith("/index")){
        let subIndex = route.path.replace(/\/index$/,'/')
        alias.push(subIndex)
      }
    %>
    alias:<%=JSON.stringify(alias)%>,
    components:{
      // vue3 & vue2.7
      <%=layoutNameKey%>:lazyLoadRoute(() => import('<%=route.layout%>'),'<%=route.path%>',<%=JSON.stringify(alias)%>)
    },
    children:[{
      name:'<%=route.name%>',
      meta:<%=JSON.stringify(route.meta)%>,
      path:'',  //默认子路由
      // props: {
      //   // __page:true
      //   __page:route => ({
      //     params:route.params,
      //     query:route.query
      //   })
      // },
      components:{
        // vue3 & vue2.7
        <%=pageNameKey%>:lazyLoadRoute(() => import('<%=route.page%>'),'<%=route.path%>',<%=JSON.stringify(alias)%>)
      },
    }],
 
  })
<%}%>
  return appRoutes
}

// 404
export const page404 = '<%=option.page404||""%>'