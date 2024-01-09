/**
 * 基于@vitescv/pinia
 * 
 */
// 默认配置
const globalConfig = {
  auth:true,                      // 默认是否鉴权
  expiresIn:60*60*24,             // 鉴权过期时间（秒）
  message:'Authentication Error', // 鉴权错误信息，可以为空
  redirect: false,                // 鉴权失败跳转地址，可以为空
}
// auth store结构
const AuthStore = {
  state: () => {
    return {
      token:null,
      lastDT:Date.now(),
      isAdmin:false
    }
  },
  getters: {
    isLogin(state){
      if(!state.userInfo){
        return false
      }
      if(Date.now() - state.lastDT>=globalConfig.expiresIn*1000){
        this.userInfo = null
        return false
      }
      this.lastDT = Date.now()
      return this.userInfo
    }
  },
  actions: {
    login(userInfo,isAdmin){
      this.isAdmin = !!isAdmin
      if(userInfo){
        this.userInfo = userInfo
        this.lastDT = Date.now()
      }else{
        this.userInfo = null
      }
    },
    logout(){
      this.userInfo=null
    }
  },
  persist: true
}

export default function(config,Context){
  Object.assign(globalConfig,config)
  Context.hook("APP:INIT",function(options) {
    if(!Context.Pinia){
      console.error('[@vitescv/auth] @vitescv/pinia must install and init!')
      return
    }
    // 💡对外公开提供全局方法
    Context.Auth = {
      store:null,
      login(userInfo,isAdmin){
        this.store.login(userInfo,isAdmin)
      },
      logout(){
        this.store.logout()
      },
      getUser(){
        return this.store.userInfo
      }
    }
  })
  Context.hook("APP:CREATED",function() {
    const useUserStore = this.Pinia.defineStore('AUTH', AuthStore)
    this.router.beforeEach((to,from,next)=>{
      this.Auth.store = useUserStore()

      let needCheck = to.meta.auth===true || (to.meta.auth!==false && globalConfig.auth)
      // console.log('>>>>>>>>>>>>>>to:',to,'needCheck:',needCheck)
      if(this.Auth.store.isLogin){
        // 登录了不再判断直接跳过
        next()
      }else if(!needCheck){
        // 未登录，且当前页面不校验，且默认不校验，跳过
        next()
      }else{
        // 要校验且未登录，判断跳转还是直接报错
        if(globalConfig.redirect){
          return next(globalConfig.redirect)
        }else{
          // next(false)
          return next(new Error(globalConfig.message))
        }
      }
    })
  })
}
