import {createPinia,PiniaVuePlugin,defineStore,mapState,mapActions,mapWritableState,mapStores} from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 加载所有预设store
const stores = {}

// option 是 store的名称和地址的键值对对象
export default async function(option,Context){
  option = Object.assign({},option)
  for(let k in option){
    let store = await import(option[k]).then(m=>m.default).catch(e=>{
      console.error('[@vitescv/pinia]',e)
      return null
    })
    if(store){
      stores[k] = defineStore(k,store)
    }
  }
  // for vue2  for vue3：Vue.use(pini
  Context.Vue.use(PiniaVuePlugin)
  Context.hook("APP:INIT",function(options) {
    const pinia = createPinia()
    // 持久化
    pinia.use(piniaPluginPersistedstate)
    // 对外提供
    Context.Pinia = {
      defineStore,mapState,mapActions,mapWritableState,mapStores,
      pinia,        //当前实例
      stores
    }
    options.pinia = pinia
  })
}