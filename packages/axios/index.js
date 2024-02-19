/**
 * 基于@vitescv/axios
 */
import axios from "axios"

export default function(config,Context){
  const instance = axios.create(config)
  Context.axios = instance
  Object.defineProperty(Context.Vue.prototype,'$axios',{
    get(){
      return instance
    }
  })
}
