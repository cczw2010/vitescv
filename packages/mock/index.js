/**
 * 基于mockjs的前端api拦截器，模板使用参考https://github.com/lavyun/better-mock
 */
import Mockjs from "better-mock"
const initMocks = import.meta.glob('@/<%=(option.mockDir||"mock")%>/*.js',{ import: 'default',eager: true})
Mockjs.setup({
  timeout:'<%=(option.timeout||"500-1500")%>'
})
export default function(){
  Object.values(initMocks).forEach(initMock=>{
    const mockDatas = initMock(Mockjs)
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
  })
}