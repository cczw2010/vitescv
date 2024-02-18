### 简介

vitescv的axios模块

### 安装

```js
pnpm add @vitescv/axios
```

### 使用

```js
#在config.js中配置默认属性
modules:{
  ...
  "@vitescv/axios":{
    baseUrl:'/',
    timeout:0,
    headers:{
      common:{
        ...
      },
      post:{
        ...
      }
    }
  },
}
```

#### API

该模块扩展了vue实例，提供`$axios`属性可以访问, 也扩展了`Context.axios`,api参考官网

```
# in .vue
axios.get('/user?ID=12345')
  .then(function (response) {
    // 处理返回结果
  }.catch(function (error) {
    // 处理错误情况
    console.log(error);
  })
  .finally(function () {
    // 总是会执行
  });

# in module
Context.axios.get(xxx)

```