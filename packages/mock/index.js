/**
 * 基于mockjs的前端api拦截器，模板使用参考https://github.com/lavyun/better-mock
 */
import Mockjs from "better-mock"
const importers = import.meta.glob('@/<%=(option.mockDir||"mock")%>/*.js',{ import: 'default',eager: false})
Mockjs.setup({
  timeout:'<%=(option.timeout||"500-1500")%>'
})

export default async function(){
  for(const importer of Object.values(importers)){
    const initModule = await importer()
    const mockDatas = initModule(Mockjs)
    if(Array.isArray(mockDatas)){
      mockDatas.forEach(data=>{
        if(data.rurl&&data.body){
          if(data.rtype){
            Mockjs.mock(data.rurl,data.rtype,data.body)
          }else{
            Mockjs.mock(data.rurl,data.body)
          }
        }
      })
    }
  }
}