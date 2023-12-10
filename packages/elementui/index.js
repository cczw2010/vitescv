/**
 * Element-ui for vitescv & vue2  
 * 使用全部引入的模式，按需引入目前在插件里还有点问题，保内的elementui依赖预构建不成功(https://cn.vitejs.dev/guide/dep-pre-bundling#monorepos-and-linked-dependencies)
 * 
 * 配置信息可选，主要是设置多语言，依赖于vue-i18n 如下
 * @param option
 *  {
 *    // 默认语言,同@vitescv/i18n的locale
 *    "locale":'en',
 *    // 与@vitescv/i18n 中的语言包一一对应映射，参考elementui国际化语言包名 https://element.eleme.cn/#/zh-CN/component/i18n
 *    "langs":{
 *      'en':'en',
 *      'zh':'zh-CN'
 *    },
 *    // unplugin-vue-components/resolvers  ，ElementUiResolver 的参数
 *    resolver:{}  
 *  }
 */

<%for(let lang in option.langs){%>
import <%=lang%>_lang from 'element-ui/lib/locale/lang/<%=option.langs[lang]%>'
<%}%>
<%if(option){%>
import localElement from 'element-ui/lib/locale'

const langs = {}
<%for(let lang in option.langs){%>
langs.<%=lang%> =  <%=lang%>_lang
<%}%>
<%}%>

export default function(option,Context){
  option = option||{}
  Context.hook("APP:INIT",function(options) {
    Object.assign(options,{
      mixin:{
        beforeCreate(){
          if(this.$i18n){
            // 💡 第一种方法是借助vuei8n来实现
            localElement.i18n((key, value) => this.$i18n.t(key, value))
            this.$i18n.mergeLocaleMessage(this.$i18n.locale,langs[this.$i18n.locale])
            // 💡 第二种方法自己设置语言包,但是前端切换语言的时候elementui重绘前会有延迟
            // localElement.use(langs[this.$i18n.locale])
          }
        },
        watch:{
          '$i18n.locale'(newLocal) {
            this.$i18n.mergeLocaleMessage(newLocal,langs[newLocal])
            // localElement.use(langs[newLocal])
          }
        }
      }
    })
  })
}