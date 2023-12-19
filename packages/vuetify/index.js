/**
 * Element-ui for vitescv & vue2  
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
<%option = option ||{langs:{}}%>
<%for(let lang in option.langs){%>
import <%=lang%>_lang from 'vuetify/lib/locale/<%=option.langs[lang]%>'
<%}%>
const langs = {}
<%for(let lang in option.langs){%>
langs.<%=lang%> =  <%=lang%>_lang
<%}%>

export default function(option,{Vue,hook}){
  option = Object.assign({
    langs:{'en':'en'}
  },option)
  Vue.use(Vuetify)
  hook("APP:INIT",function(options) {
    const vuetify = new Vuetify(Object.assign(option,{
      lang: {
        locales: langs,
        current: 'en',
      },
    }))
    Object.assign(options,{
      vuetify,
      mixin:{
        created(){
          if(this.$i18n){
            this.$vuetify.lang.current = this.$i18n.locale
          }
        },
        watch:{
          '$i18n.locale'(newLocal) {
            this.$vuetify.lang.current = newLocal
          }
        }
      }
    })
  })
  // hook("APP:created",function(options) {
  // })
}