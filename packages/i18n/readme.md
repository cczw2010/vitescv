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
    dir:"i18n",              // 自动加载语言包的默认目录，内部文件名则为语言包名[lang].json
    locale:'zh',             // * 默认的语言，必填,
    fallbackLocale:'zh',     // 找不到语言包的回滚语言
    silentFallbackWarn:true, // 静默回滚错误
    messages:{               // 也可以自己设定，但是改动会触发配置文件改动，dev服务会重启
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

#### 扩展

该模块扩展了上下文，提供`Context.I18n`对象可以在其他摸块中提供对语言解决方案,该对象的api如下：

- **langs**

​	当前支持的语言列表数组

- **i18n**

​	vue-i18n的实例

- **setLocaleMessage(lang,importer)**

​	针对某个语言增加全局语言包或者语言包加载器，其中importer方法可以返回一个json数据，也可以返回一个promise实现异步加载

- **setLocaleMessages(importers)**

 setLocaleMessage的批量方法，importers为lang和importer的映射对象

