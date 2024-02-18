/**
 * @vitescv/auth 
 * @vitescv/axios请求会自动将登录的token自动以 Authorization的Bearer模式传输到服务器，并自动获取服务器端在header中返回的token
 */
// 默认配置
const Config = {
  auth:true,                                // 默认是否鉴权
  responseTokenHeader:'x-access-token',     // 服务器返回的token的header键
  redirect: false,                          // 鉴权失败跳转地址，可以为空
  message:'Authentication Error',           // 不跳转会显示鉴权错误信息，可以为空
}
// auth store结构
const AuthStore = {
  state: () => {
    return {
      token:null,     //token
      userInfo:null,  //用户信息
      dt:null         //登录时间
    }
  },
  // 持久化
  persist: true
}
// 当前应用的userStore实例
let userStore = null

// 封装@vitescv/axios 自动处理token
function interceptorAxios(axios){
  // 添加请求拦截器
  axios.interceptors.request.use(function (config) {
    // 在发送请求之前带上token
    config.headers[Config.header] =  'Bearer ' + userStore.token||''
    return config;
  })
  // 添加响应拦截器
  axios.interceptors.response.use(function (response) {
    // 正常返回获取token
    const newToken = response.headers[Config.responseTokenHeader]
    if(newToken){
      userStore.token = newToken
    }
    return response;
  })
}

export default function(config,Context){
  Object.assign(Config,config)
  Context.hook("APP:INIT",function(options) {
    if(!this.Pinia){
      console.error('[@vitescv/auth] @vitescv/pinia must install and init!')
      return
    }
    if(!this.axios){
      console.error('[@vitescv/auth] @vitescv/axios must install and init!')
      return
    }
    // 💡注入axios处理token
    interceptorAxios(this.axios)

    // 💡对外公开提供app属性$auth
    Object.defineProperty(this.Vue,'$auth',{
      get(){
        return {
          login(userInfo){
            if(userInfo){
              userStore.userInfo = userInfo
              userStore.dt = Date.now()
            }
          },
          logout(){
            userStore.$reset()
          },
          getUser(){
            return userStore.userInfo
          }
        }    
      }
    })
    // 💡守卫
    this.router.beforeEach((to,from,next)=>{
      let needCheck = to.meta.auth===true || (to.meta.auth!==false && Config.auth)
      // console.log('>>>>>>>>>>>>>>to:',to,'needCheck:',needCheck)
      if(!userStore){
        // 初始化userStore
        const useUserStore = Context.Pinia.defineStore('AUTH', AuthStore)
        // ✅这会正常工作，因为它确保了正确的 store 被用于,当前正在运行的应用
        userStore = useUserStore(Context.Pinia.pinia)
      }
      if(!!userStore.userInfo&&!!userStore.token){
        // 登录了不再判断直接跳过
        next()
      }else if(!needCheck){
        // 未登录，且当前页面不校验，且默认不校验，跳过
        next()
      }else{
        // 要校验且未登录，判断跳转还是直接报错
        if(Config.redirect){
          return next(Config.redirect)
        }else{
          // next(false)
          return next(new Error(Config.message))
        }
      }
    })
  })
}

