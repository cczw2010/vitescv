### 简介

vitescv的elementui自动导入模块，多语言切换依赖于`@vitescv/i18n`.

`@2.1.0`开始调整为全局导入，更加好用


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
    // 与@vitecv/i18n的语言包映射关系
    "langs":{
      'en':'en',
      'zh':'zh-CN',
      ...
    },
    // ElementUi 全局配置
    size: 'small',
    zIndex: 2000
  },
}
```