### 简介

vitescv的elementui自动导入模块，多语言切换依赖于`@vitescv/i18n`


### 安装

```js
pnpm add @vitescv/elementui
```

### 使用

```js
#在config.js中配置
modules:{
  ...
  "@vitescv/elementui":{
    // 与i18n的语言包映射关系
    "langs":{
      'en':'en',
      'zh':'zh-CN',
      ...
    },
    // elementUI初始化install是的设置参数
    "option":{size:'small'}
  },
}
```