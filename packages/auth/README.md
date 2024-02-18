### 简介

vitescv的auth模块,依赖`@vitescv/pinia`和`@vitescv/axios`。

**关于token**
@vitescv/axios请求会自动将登录的token会自动以`Authorization`的Bearer模式传输到服务器，并会自动获取服务器端在header中返回的token更新



### 安装

```js
pnpm add @vitescv/auth
```

### 使用

```js
#在config.js中配置
modules:{
  ...
  "@vitescv/auth":{
    auth:true,                            // 默认是否校验鉴权
    responseTokenHeader:'x-access-token', // 服务器返回的token的header键
    redirect: false,                      // 鉴权失败跳转地址，可以为空
    message:'Authentication Error',       // 不跳转会显示鉴权错误信息，可以为空
  },
}
```

#### API

该模块扩展了vue实例，提供`$auth`属性可以访问,该对象的api如下：

- **login(userInfo)**

​	设置当前用户信息

- **logout()**

​	退出登录

- **getUserInfo()**

 获取当前登录的用户信息
