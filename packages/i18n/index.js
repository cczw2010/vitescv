/**
 * i18n多语言模块 ,基于vue-i18n，提供多语言解决方案, 设置中的语言包会被当做全局加载
 * 并且会在每个页面中设置的 i18n属性语言包
 * @param {*} option 
 * {
 *   langs:['zh'],            // 加载的语言列表，对应[dir]中或者page的sfc文件所在目录的 [lang].js,该文件用于输出该语言数据json 
 *   locale:'zh',             // 默认的语言
 *   fallbackLocale:'zh',     // 找不到语言包的回滚语言
 *   silentFallbackWarn:false // 静默回滚错误
 * }
 */ 
import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

export default function(option,Context){
  option = Object.assign({silentFallbackWarn:true,message:{}},option)
  const i18n = new VueI18n(option)
  Context.hook("APP:INIT",function(options) {
    Object.assign(options,{
      i18n,
      mixin:{
        watch: {
          '$i18n.locale'(newValue,oldValue) {
            i18n.locale = newValue
            // if(newValue!=oldValue){
            //   this.reload()
            // }
          }
        }
      }
    })
  })
}
