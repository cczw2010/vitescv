### 简介

vitescv的vuetify自动导入模块,，多语言切换依赖于`@vitescv/i18n`

并未处理字体，请参考[这里](https://v2.vuetifyjs.com/zh-Hans/getting-started/installation/#section-5b8988c55b574f53)  

### 安装

```js
pnpm add @vitescv/vuetify 
```

### 使用

```js
#在config.js中配置
modules:{
  ...
  "@vitescv/vuetify":{
     // 与i18n的语言包映射关系,模块会自动根据这些配置导入对应的语言包
    "langs":{
      'en':'en',
      'zh':'zh-Hans',
      ...
    },
    // vuetify的初始化配置，lang部分已经自动根据上面的配置自动处理了,如果自行设置会覆盖原有的自动处理
    "option":{
      ...
    }
  },
}
```