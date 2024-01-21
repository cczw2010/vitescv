/**
 * Element-ui for vitescv & vue2
 * 配置信息可选，主要是设置多语言，依赖于vue-i18n 如下
 * @param option
 *  {
 *    // 与@vitescv/i18n 中的语言包一一对应映射，参考elementui国际化语言包名 https://element.eleme.cn/#/zh-CN/component/i18n
 *    "langs":{
 *      'en':'en',
 *      'zh':'zh-CN'
 *    },
 *    // unplugin-vue-components/resolvers  ，ElementUiResolver 的参数
 *    resolver:{}  
 *  }
 */
import localElement from 'element-ui/lib/locale'
const importers = {
<%if(option.langs){%>
<%for(let lang in option.langs){%>
  <%=lang%>:()=>import("element-ui/lib/locale/lang/<%=option.langs[lang]%>.js"),
<%}%>
<%}%>
}
export default function(option,Context){
  Context.I18n.setLocaleMessages(importers)
  
  Context.hook("APP:INIT",function(options) {
    Object.assign(options,{
      mixin:{
        beforeCreate(){
          if(this.$i18n){
            // 💡 第一种方法是借助vuei8n来实现
            localElement.i18n((key, value) => this.$i18n.t(key, value))
            // 💡 第二种方法自己设置语言包,但是前端切换语言的时候elementui重绘前会有延迟
            // localElement.use(langs[this.$i18n.locale])
          }
        },
      }
    })
  })
}