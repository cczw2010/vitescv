/**
 * 基于@vitescv/axios
 */
import axios from "axios"

export default function(config,Context){
  const instance = axios.create(config)
  Context.hook("APP:INIT",function(options) {
    // 💡对外公开提供全局方法
    Context.axios = instance
    Object.defineProperty(Context.Vue.prototype,'$axios',{
      get(){
        return instance
      }
    })
  })
  // Context.hook("APP:CREATED",function() {
  // })
}
