const Config = {
  mockDir:'api',
  baseUrl:'/api',
}
const jsonImporters = import.meta.glob('@/<%=(option.mockDir||"api")%>/*.json')
console.log(jsonImporters)
for(var k in jsonImporters){
  const regs = k.match(/\W([a-zA-Z]+\w+)\.json$/i)
  if(regs&&regs.length>1){
    const route = regs[1]
    console.log(route)
  }
}

// 封装@vitescv/axios 自动处理token
function interceptorAxios(axios){
  // 添加请求拦截器
  axios.interceptors.request.use(function (config) {
    config.headers['x-mock'] =  true
    return config;
  })
}

export default function(config,Context){
  Object.assign(Config,config)
  if(!this.axios){
    console.error('[@vitescv/mock] @vitescv/axios must install and init!')
    return
  }
  interceptorAxios(Context.axios)
}