import Vuetify from 'vuetify/es5'
import 'vuetify/dist/vuetify.min.css'
export default function(option,{Vue,hook}){
  option = option||{}
  Vue.use(Vuetify)
  hook("APP:INIT",function(options) {
    options.vuetify = new Vuetify(option)
  })
}