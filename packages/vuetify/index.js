/**
 * vuetify for vitescv & vue2  
 * 配置信息可选，主要是设置多语言，依赖于vue-i18n 如下
 * @param option
 *  {
 *    // 与@vitescv/i18n 中的语言包一一对应映射，参考vuetify国际化语言包名 https://v2.vuetifyjs.com/zh-Hans/features/internationalization/
 *    "langs":{
 *      'en':'en',
 *      'zh':'zhHans'
 *    },
 */
import Vuetify from 'vuetify/lib'
import 'vuetify/dist/vuetify.min.css'
const importers = {
<%if(option.langs){%>
<%for(let lang in option.langs){%>
  <%=lang%>:()=>import("vuetify/lib/locale/<%=option.langs[lang]%>.js").then(m=>{return {default:{'$vuetify':m.default}}}),
<%}%>
<%}%>
}

export default function(option,Context){
  Context.Vue.use(Vuetify)
  Context.I18n.setLocaleMessages(importers)
  Context.hook("APP:INIT",function(options) {
    const optionVuetify = Object.assign({
      lang: {
        t: (key, ...params) => Context.I18n.i18n.t(key, params),
      },
    },option.option)
    const vuetify = new Vuetify(optionVuetify)
    Object.assign(options,{
      vuetify,
    })
  })
}