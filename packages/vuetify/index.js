import Vue from 'vue'
import Vuetify from 'vuetify/es5'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

export default function(option,{hook}){
  option = option||{}
  hook("APP:INIT",function(options) {
    options.vuetify = new Vuetify(option)
  })
}