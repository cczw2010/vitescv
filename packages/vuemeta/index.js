import Vue from 'vue'
import VueMeta from 'vue-meta'

// 默认配置
const defaultOption ={
  keyName:'head',
  tagIDKeyName:'vmid',
  attribute:'data-vm',
  ssrAppId:'app',
  ssrAttribute:'data-vmssr',
  refreshOnceOnNavigation: true
}
export default function(option,{hook,HOOKS}){
  option = Object.assign({},defaultOption,option)
  hook(HOOKS.INIT,function(options){
    Vue.use(VueMeta,option)
  })
 }
