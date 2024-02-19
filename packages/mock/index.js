/**
 * 基于mockjs的前端api拦截器，模板使用参考https://github.com/nuysoft/Mock/wiki
 */
import Mockjs from "mockjs"
const initMocks = import.meta.glob('@/<%=(option.mockDir||"mock")%>/*.js',{ import: 'default',eager: true})
console.log(initMocks)

export default function(config){
  config = Object.assign({
    mockDir:'mock',        //mockjs的template目录
    timeout:"500-1500"
  },config)
  Mockjs.setup({
    timeout:config.timeout
  })
  Object.values(initMocks).forEach(initMock=>{
    const mockDatas = initMock(Mockjs)
    if(Array.isArray(mockDatas)){
      mockDatas.forEach(data=>{
        if(data.rurl&&data.template){
          if(data.rtype){
            Mockjs.mock(data.rurl,data.rtype,data.template)
          }else{
            Mockjs.mock(data.rurl,data.template)
          }
        }
      })
    }
  })
}