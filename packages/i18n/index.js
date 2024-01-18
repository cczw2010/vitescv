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
console.log(langsImporter)
// i18n操作类
class LocaleOperator{
  constructor(options,Contenxt){
    this.dymicImporters = {}
    for(var k in langsImporter){
      const regs = k.match(/\W([a-zA-Z]+\w+)\.json$/i)
      if(regs&&regs.length>1){
        const lang = regs[1]
        this.dymicImporters[lang] = [langsImporter[k]]
        if(!options.messages[lang]){
          options.messages[lang] = {}
        }
      }
    }
    this.langs = Object.keys(this.dymicImporters)
    this.langsLoaded = []
    this.langsModules
    if(this.langs>0 && this.options.locale){
      this.setLocale
    }
    this.i18n = new VueI18n(options)
    this.Contenxt = Contenxt
    this.localeKey = '__locale'
  }
  // 获取当前语言
  getLocale(){
    return this.i18n.locale
  }
  // 设置当前语言
  setLocale(lang){
    // if(window){
    //   localStorage.setItem(this.localeKey,lang)
    //   document.querySelector('html').setAttribute('lang', lang)
    // }
   this.i18n.locale = lang
   return lang
  }
  // 加载语言包
  loadLocaleMessage(lang){
    // 不包含语言包
    if(!this.langs.includes(lang)){
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
              return importer()
              // .catch(e=>{
              //   console.error('[@vitescv/i18n] '+lang+' is not exited!')
              //   return false
              // })
            })).then((message)=>{
              this.i18n.mergeLocaleMessage(lang,message.default)
              // this.i18n.setLocaleMessage(lang, message.default)
              this.langsLoaded.push(lang)
              return this.setLocale(lang)
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

  const localeOperator = new LocaleOperator(option,Context)
  await localeOperator.loadLocaleMessage(option.locale)
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
    // 注册router钩子函数来判断语言
    Context.router.beforeEach((to,from,next)=>{
      localeOperator.loadLocaleMessage(option.locale).then(next())
    })
  })
}