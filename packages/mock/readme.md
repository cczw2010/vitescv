### 简介

vitescv的mockjs模块，基于[better-mock](https://github.com/lavyun/better-mock), 用于纯前端直接拦截请求（`XMLHttpRequest`,`axios`,`fetch`）生成json数据，请注意打包的时候如果不需要要去掉这个模块，否则会一起打包

ps:特别适合前端直接调试开发，和打演示demo

### 安装

```js
pnpm add @vitescv/mock
```

### 使用

```js
# 在config.js中配置默认属性
modules:{
  ...
  "@vitescv/mock":{
    timeout:'500-1500',        //参考mockjs的setup的timeout参数
    mockDir:'mock'             //路由模板文件目录
  },
}
```

#### 路由文件

模块会自动加载`mockDir`中的js文件，该文件为路由文件，返回一个默认初始化函数，改函数返回一个`route`对象数组（用于Mock.mock方法）,包含以下几个属性：

**rurl**  拦截路由的url，必须。    *参考`Mock.mock()`的第一个参数*
**rtype** 拦截的请求方法，可选。    *参考`Mock.mock()`的第二个参数*
**body**  数据,必填。             *参考`Mock.mock()`的第三个参数*

```
# mock/users.js
export default function(Mock){
  return [
    {
      rurl:'/api/users',
      rtype:'get',
      body:{
        code:1,
        msg:'success',
        'data|10':{
          'id|+1':1,
          name:'@name',
          'age|18-55':1,
          'sex|0-1':1,
          email:'@email',
          phone:'@phone',
          address:'@area',
          cover:Mock.Random.dataImage( '250x250','@word'),
          remark:Mock.Random.paragraph(10,50),
          createDate:'@datetime',
        }
      }
    },{
      rurl:'/api/funtest',
      body:function(req){
        return {
          title:'Function Test',
          info:'this is a function template'
        }
      }
    }
  ]
}

# 在页面中使用 xxx.vue
export default {
  created(){
    this.$axios.get("/api/users").then(response=>{
      console.log(response.data)
    })
  }
}

```