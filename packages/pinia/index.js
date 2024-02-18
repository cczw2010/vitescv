import {createPinia,PiniaVuePlugin,defineStore,mapState,mapActions,mapWritableState,mapStores} from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 加载所有预设store
<%if(option){%>
<%for(let k in option){%>
import store_<%=k%> from "<%=utils.normalizePath(utils.resolve(option[k]))%>"
<%}%>
const useStores = {}
<%for(let k in option){%>
useStores.<%=k%> = defineStore('<%=k%>',store_<%=k%>)
<%}%>
<%}%>

const Pinia = {
  getUseStore(storeName) {
    return useStores[storeName]
  },
  defineStore,mapState,mapActions,mapWritableState,mapStores
}

// option 是 store的名称和地址的键值对对象
export default async function(option,Context){
  // for vue2  for vue3：Vue.use(pini
  Context.Vue.use(PiniaVuePlugin)
  Context.hook("APP:INIT",function(options) {
    const pinia = createPinia()
    // 持久化
    pinia.use(piniaPluginPersistedstate)

    // 对外提供 API
    Pinia.pinia = pinia
    Context.Vue.prototype.Pinia = Pinia
    Context.Pinia =Pinia

    // init
    options.pinia = pinia
  })
}

function injectVue(Vue){
 
}