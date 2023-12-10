// TODO 待处理服务器端和客户端分开编译输出代码，因为有些信息前端不应该暴露

// console.debug('=============================AUTH')
// console.debug('ENVS=<%=JSON.stringify(ENV)%>')
// console.debug('import.meta.env=',import.meta.env)

import Vue from "vue"
import {addMiddleware} from "@APP/helper"
import useUserStore from "@/view/modules/auth/userStore.js"
const KEY_TOKEN = '__token'

// 默认配置   
const Option = {
  auth:true,                      // 默认是否鉴权
  expiresIn:60*60*24,             // 鉴权过期时间（秒）
  message:'Authentication Error', // 鉴权错误信息，可以为空
  redirect: false                 // 鉴权失败跳转地址，可以为空
  // secret:                      // ssr模式下专用
}
// ssr server端情况下才会有jwt token及相关secret配置
<%if(ENV.SSR){%>
import jwt from "jsonwebtoken"
Option.secret = '<%=option.secret||"awenyyds"%>',  //jwt secret
<% 
// 保证 secret,客户端不可见，
delete option.secret
}%>
// 合并参数
Object.assign(Option,<%=JSON.stringify(option)%>)

const Auth = {
  $APP:null,
  /**
   * 设置登录，退出只需传入data 为空即可
   * @param {Object} data
   * @returns string  token||null
   */
  setLogin(data){
    const store = useUserStore()
    store.userInfo = data||null
    store.isLogin = !!data
    <%if(ENV.SSR){%>
    const token = data?jwt.sign({data}, Option.secret, { expiresIn:Option.expiresIn }):''
    Auth.$APP.setSharedConfig(KEY_TOKEN,token,Option.expiresIn/60)
    return token
    <%}else if(!ENV.ssrMode){%>
    const token = Auth.$APP.encode64(data)
    Auth.$APP.setSharedConfig(KEY_TOKEN,token,Option.expiresIn/60)
    return token
    <%}%>
  },
  // 退出登录
  logout(){
    this.setLogin(null)
  },
  // 返回登录信息
  isLogin(){
    const store = useUserStore()
    // console.debug(">>>>>>>>>Auth.isLogin",JSON.stringify(this.store.$state),this.store.isLogin,this.store.$state.isLogin)
    return store.userInfo
  }
}
Vue.prototype.$Auth = Auth

addMiddleware(function({to,from,next,store,router,$APP}){
  console.debug(">>>>>>>middleware inline auth module:","router from:",from.path,"to:",to.path,"isLogin:",Auth.isLogin())
  // router.app.$APP.INFO
  if(!!to.meta.auth || Option.auth){

  }
  console.debug(">>>>>>>middleware inline auth module: need auth???",!!to.meta.auth || Option.auth)
  next()
})  
export default function({$APP}){
  Auth.$APP = $APP
  let userInfo = null
  // 初始化用户登录状态
  const token = $APP.getSharedConfig(KEY_TOKEN)
  if(token){
    if(import.meta.env.SSR){
      let decode = null
      try{
       decode = jwt.verify(token,Option.secret)
      }catch(e){}
      if(decode && decode.data){
        userInfo = decode.data
      }
    }else if(<%=!ENV.ssrMode%>){
      userInfo = $APP.decode64(token)
    }
  }
  Auth.setLogin(userInfo)
 
  return 
}