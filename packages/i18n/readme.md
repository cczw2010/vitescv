### 简介

vitescv的i18n多语言模块 ,基于vue-i18n@8，提供多语言解决方案, 设置中的语言包会被当做全局加载.


### 安装

```js
pnpm add @vitescv/i18n
```

### 使用

```js
#在config.js中配置,配置部分同vue-i18n
import zhLang from "./i18n/zh.json"
modules:{
  ...
  "@vitescv/i18n":{
    locale:'zh',             // 默认的语言
    fallbackLocale:'zh',     // 找不到语言包的回滚语言
    silentFallbackWarn:true, // 静默回滚错误
    messages:{
      "zh":zhLang,
      ...
    }
  },
}
```

页面中的自定义语言包可以在页面中自行设定，vue-i18n会自动加载合并

```js
# pages/index.vue
....
import zhLang from "./zh.json"
export default {
  ...
  i18n:{
    messages:{
      'zh':zhLang,
      ...
    }
  },
  ...
}
```