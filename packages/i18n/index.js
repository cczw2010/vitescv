/**
 * i18n多语言模块 ,基于vue-i18n，提供多语言解决方案
 * 并且每个页面中可以自行设置个性化i18n属性语言包
 * { 
 * dir:"i18n",              // 全局语言包的自动加载目录，内部文件名则为语言包名 [lang].json.
 * locale:'zh',             // 默认的语言
 * fallbackLocale:'zh',     // 找不到语言包的回滚语言
 * silentFallbackWarn:true, // 静默回滚错误
 */ 
import VueI18n from 'vue-i18n'
<%const dir = option.dir||'i18n'%>
const langsImporter = import.meta.glob("@/<%=(option.dir)||'i18n'%>/*.json")
// console.log(langsImporter)
// i18n操作类
class LocaleOperator{
  constructor(options){
    this.dymicImporters = {}
    for(var k in langsImporter){
      const regs = k.match(/\W([a-zA-Z]+\w+)\.json$/i)
      if(regs&&regs.length>1){
        const lang = regs[1]
        // if(!options.messages[lang]){
        //   options.messages[lang] = {}
        // }
        this.dymicImporters[lang] = [langsImporter[k]]
      }
    }
    this.langs = Object.keys(this.dymicImporters)
    this.langsLoaded = []
    this.i18n = new VueI18n(options)
    this.localeKey = '__locale'
  }
  // 获取当前语言
  getLocale(){
    if(window&&window.localStorage){
      return localStorage.getItem(this.localeKey)
    }
    return this.i18n.locale
  }
  // 设置当前语言
  setLocale(lang){
    if(window&&window.localStorage){
      localStorage.setItem(this.localeKey,lang)
      document.querySelector('html').setAttribute('lang', lang)
    }
    this.i18n.locale = lang
    // console.log(lang,this.i18n.getLocaleMessage(lang))
    return lang
  }
  // 加载语言包
  loadLocaleMessage(lang){
    // 不包含语言包
    if(!lang || !this.langs.includes(lang)){
      console.error('[@vitescv/i18n] '+lang+' is not exited!')
      return Promise.resolve(false)
    }
    // 已加载
    if(this.langsLoaded.includes(lang)){
      return  Promise.resolve(this.setLocale(lang))
    }
    // // 现有相同
    // if(this.i18n.locale === lang){
    //   return  Promise.resolve(this.setLocale(lang))
    // }
    // 尚未加载
    return Promise.all(this.dymicImporters[lang].map(importer=>{
            if(typeof importer == 'function'){
              importer = importer()
            }
            if(importer instanceof Promise){
              return importer.then(m=>{
                return m.default?m.default.__esModule?m.default.default:m.default:m
              }).catch(e=>{
                console.error('[@vitescv/i18n] '+e.message)
                return false
              })
            }
            return importer
          }))
          .then((messages)=>{
            messages.forEach(message=>{
              this.i18n.mergeLocaleMessage(lang,message)
              // this.i18n.setLocaleMessage(lang, message)
            })
            this.langsLoaded.push(lang)
            return this.setLocale(lang)
          }).catch(e=>{
            console.error(e)
          })
  }
}

export default async function(option,Context){
  Context.Vue.use(VueI18n)
  if(!option||!option.locale){
    console.error("[@vitescv/i18n] the locale option is required!")
    return false
  }
  option = Object.assign({
    silentFallbackWarn:false,
    messages:{}
  },option)
  // 初始化
  const localeOperator = new LocaleOperator(option)
  // 注入Context语言包加载语言包方法给第三方
  Context.I18n = {
    // 增加语言包对应的加载方法或者数据
    setLocaleMessage(lang,importer){
      if(localeOperator.langs.includes(lang)){
        localeOperator.dymicImporters[lang].push(importer)
      }
    },
    // setLocaleMessage的批量方法，importers为lang和importer的映射对象
    setLocaleMessages(importers){
      for (const lang in importers) {
        this.setLocaleMessage(lang,importers[lang])
      }
    },
    // 获取支持的语言包列表
    langs:localeOperator.langs,
    // i18n实例
    i18n:localeOperator.i18n,
  }

  Context.hook("APP:INIT",function(options) {
    Object.assign(options,{
      i18n:localeOperator.i18n,
      mixin:{
        watch: {
          '$i18n.locale'(newValue,oldValue) {
            localeOperator.loadLocaleMessage(newValue)
          }
        }
      }
    })

  })
  Context.hook("APP:CREATED",function(){
    // 初始化默认语言
    localeOperator.loadLocaleMessage(localeOperator.getLocale())
    // 注册router钩子函数来判断语言
    Context.router.beforeEach((to,from,next)=>{
      localeOperator.loadLocaleMessage(localeOperator.i18n.locale).then(next())
    })
  })
}