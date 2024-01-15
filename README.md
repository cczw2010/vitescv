基于vite,vu2.7的 vue单文件组件开发模式渲染小脚手架(CSR)， 支持自定义模块,支持自动组件加载.

V1.x 基于vite3; V2.x 基于vite5

### 使用

**请使用`pnpm`管理包**
```js
// ##########安装
pnpm install vitescv

// ##########初始化项目
npx vitescv init

// ##########开发模式
npx vitescv [dev]

// ##########编译
npx vitescv build

// ##########预览
npx vitescv preview

更好的使用方式是在`package.json`中设置为npm命令:

"scripts": {
  "dev": "npx vitescv dev ",
  "build": "npx vitescv build",
  "preview": "npx vitescv preview"
},

```
### 配置

初始化之后，会在目录下有两个文件快捷方式`config.js`,`index.html`。前者是项目配置文件，后者是vite的index.html模板文件。可自行配置

```js
## config.js
/****************** vite部分 *******************/
host:'127.0.0.1',                        //host
port:xx,                                 //port
source:"view",                           // vue项目的源码目录
outDir:'dist',                           // 打包输出根路径
// 编译时的兼容设置，设置为false可关闭。具体参考@vitejs/plugin-legacy的参数设置
legacy:{},
// 强制外部化的库
external:['vue'],                         //打包时强制外部化的库，默认空
/****************** 自定义部分 *******************/
//自定义模块
modules:[
  "@vitescv/i18n":{
    ...options
  },
],
// 路由相关  @代表项目根目录
componentLoading:'@/view/components/loading.vue',  //路由动态加载时的loading组件，AppLoading 预设
componentError:'@/view/components/xx.vue',             //路由动态加载错误时显示组件，AppError 预设
compomentRouteView:'@/view/components/xx.vue',         //路由页面显示组件，AppView 预设
page404:'/404',                 //404页面
```

### 环境变量

可以通过不同模式的`.env*`文件实现不同环境和模式的环境变量设置,并在代码中可通过`import.meta.env`来访问。具体参考VITE的[环境变量和模式](https://cn.vitejs.dev/guide/env-and-mode.html)


### 目录：

```js
// 应用部分
.vitescv          #vitescv运行时文件夹
config.js         #vitescv配置文件
.env*             #用户自定义的环境变量,参考vite

view/pages        #页面目录
view/layouts      #layout目录
view/components   #自动加载的单文件组件路径
```

### page

vue的sfc文件，文件路径则是路由访问路径

```js
<template>
...
</template>
<script>
export default {
  ...
  // 给路由命名
  name:'home',
  // 设置路由别名访问路径
  alias:'/home',
  // head相关注入设置，参考vue-meta
  head:{...},
  // 设定该页面的布局文件名，默认`default`, 对应layout目录中的 `default.vue`
  layout:'default',
}
</script>
```
>另外，用户其他自定义字面量属性[string|boolean|null|reg]，系统会自动读取并预设进页面路由所在meta中，方便扩展模块或者中间件
eg:
```js
//page.vue
<script>
...
data(){...}
// 自定义字面量属性,可在路由的meta中访问
auth:false,
topinfo:'welcome new user',
...
created(){
  ...
}
</script>
```

### layout

不支持多级目录，自动根据`page`的设定加载。  内部使用 `app-view` 组件指定页面渲染的位置。并且在跳转的地方需要
可以增加`transition`或者`keep-alive` 来定制显示效果。

```js
<template>
  ...
  <transition name="fade" mode="out-in" appear>
    <keep-alive>
    <app-view></app-view>
    </keep-alive>
  </transition>
  ...
</template>
<script>
export default {
  // head相关注入设置，参考vue-meta
  head,
 ...
}
</script>
```


### component
自定义的组件目录中的单文件组件在页面或者layout中无需引入，直接使用即可，将自动被加载引用。基于[unplugin-vue-components]实现。 第三方的UI组件可参考`自定义module`实现


### router

集成`vue-router`管理路由，通过目录结构生成路由地址，值得注意的是，为了简化使用及个人习惯，并没有实现自定义嵌套路由。

`layout`中通过`app-view`指定页面渲染的位置,再通过`router-link`组件来实现页面跳转。

目录下`index.vue`为当前默认路由，另外可以通过文件夹或者文件增加`_`前缀来实现动态路由匹配。 

页面上可以使用router的属性来访问 `$route.query`和`$route.params`

```
## files in [sourceRoot]/pages ##
user/index.vue          # /user   or  /user/index
user/_id.vue            # /user/:id
user/_id/posts.vue      # /user/:id/posts
```


### 自定义编译模块

全局可编译vue module模块加载，在app创建期间调用，可用于加载一些定制的模块初始化。（开发第三方包过程中vite的预构建依赖优化选项引发了开发模式太多问题，持续优化）

模块默认返回初始化方法，该方法接受用户设置参数对象，和一个应用上下文`context` ,可在应用运行生命周期注册钩子函数。可参考源码中`@vitescv/i18n` 和 `@vitescv/element-ui`模块。
* **`钩子函数`**
  用户可以在模块初始化方法中，使用钩子来注册应用不同阶段的处理代码

  * **[APP:INIT]** 
  该钩子运行于`app`（Vue实例)初始化之前，可以做一些预处理，钩子的回调函数得到一个`options`对象的引用作为参数，可以直接扩展该对象，该对象的所有属性将扩充合并到`app`初始化参数（new Vue({...options})）。其中`mixin`或者`mixins`会自动扩充合并到初始化参数的`mixins`数组中，其他的会直接覆盖合并，请注意不要随意增加参数，以防影响其他模块。
  此时上下文中的`app`（Vue实例）虽然还没有初始化，但是`router`已经初始化完毕
  * **[APP:CREATED]**
  该钩子运行于`app`(Vue实例)初始化完成之后，所以此时上下文中的`app`已经存在.

* **`Context`**

  自定义的模块初始化函数有两个参数，第一个是配置文件中的配置，第二个是应用的上下文`context`, 这个对象中包含以下属性和方法：

  - **app**

    该对象是项目的Vue实例，在`APP:CREATED`钩子中才开始生效

  - **Vue**

    Vue原始对象（非实例），建议用户的模块可以直接使用该对象来取代自行导入vue包

  - **router**

    该对象是项目的router实例

  - **hook(lifecycle,function)**

    该方法是注册钩子函数的方法，模块可以注册自己的运行代码到不同的项目运行阶段

  

  如果你想在应用生命周期提供些全局的方法给其它模块使用，扩充context的属性是个不错的方法，但注意千万别和预设的属性冲突，不然会是灾难性的

  

* **`高级定制模块`**
  模块文件可以是用模板语法，内部可以使用模板语法自定义动态输出. 系统会在编译阶段处理模板，返回真正的模块。 模板中包含两个初始化对象:

  * **cwd** 		          代表项目根目录(process.cwd())
  * **option**            对象是模块的自定义传入的参数对象,方便定制动态代码
  * **utils**             对模板内提供了一些常用函数工具对象
  * **utils.normalPath**  vite的api，用于快平台处理url地址
  * **utils.resolve**     path的api

以下示例参考`@vitescv/i18n`的部分代码

```js
//💡 主文件 modules/xxx/index.js
import VueI18n from 'vue-i18n'
import jsondata from <%=utils.normalPath(utils.resolve(option.jsonUrl))%>

const lang = '<%=option.lang%>'
const i18n = new VueI18n({...})
// 导出默认初始化方法，返回mixin
export default function(option,context){
  context.Vue.use(VueI18n)
  ...
  # 注册应用创建前的初始化钩子，options参数最终将合并到Vue实例的创建属性里，
  context.hook("APP:INIT",function(options) {
    options.i18n = i18n
    options.mixin = {
      ...
    }
  })
  # 注册app初始化之后的钩子
  context.hook("APP:CREATED",function() {
  	context.app ...
  })

}
```
模块支持有限的修改用户项目配置文件，字需要在同目录下需要提供一个`config.js`.
```js
//💡 modules/xxx/config.js
export default {
  // 💡unplugin-vue-components/vite  dirs项,可以自定义额外的组件自动加载目录
  UIDirs:[],
  // 💡unplugin-vue-components/vite  resolvers项,！！！与项目config.js中不同的是，
  //   这里可以是一个初始化方法(！注意该方法不是unplugin-vue-components的resolvers的构造函数)，
  //   [modules]模块配置中的resolver属性会当做配置信息注入到该方法里，方便定制化
  UIResolvers:[
    function(option){
      return xxxUiResolver(Object.assign({
        importStyle:true,
      },option))
    },
    {
      type: "component",
      resolve: (name) => {
        ...
        return ...
      }
    }
  ],
  // 💡 外部化的包
  external:[],
  // 💡 扩展vite.config.js的rollupOptions.output.manualChunks设置项,!!!该项，2.0.0更换为vite5之后，该项已经失效
  manualChunks:{},
}

```

解释一下，以上示例，实际的应用中的效果等同于在app创建时：
```js
new Vue({
  i18n,
  mixins:[mixin]
})
```

用户使用的时候只需在项目的配置文件`config.js`中设置

```js
modules:{
  './modules/xxx/index.js':{...},
  "@vitescv/i18n":{...}
}

```

目前的一些模块列表：

[@vitescv/i18n](./packages/i18n)

[@vitescv/vuemeta](./packages/vuemeta)

[@vitescv/pinia](./packages/pinia)

[@vitescv/elementui](./packages/elementui)

[@vitescv/vuetify](./packages/vuetify)

### 资源文件

vite中的[静态资源服务的文件夹](https://cn.vitejs.dev/config/shared-options.html#publicdir)（默认 plulic）下的资会在编译时直接拷贝到输出根目录下直接访问，所以开发和编译是都可以使用同样的方式调用. 建议使用的时候增加一个命名空间子文件夹更加方便管理。比如：

```js
// 目录
public            // publicDir   静态资源服务的文件夹根目录
  -static         // folder
    -img          // folder
      -logo.png   // file
// 访问
/static/img/logo.png
```