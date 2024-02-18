### 简介

vitescv的pinia模块,集成`pinia-plugin-persistedstate`，支持`store`的[持久化](https://prazdevs.github.io/pinia-plugin-persistedstate/zh/guide/)


### 安装

```js
pnpm add @vitescv/pinia
```

### 使用

配置
```js
#在config.js中配置
modules:{
  ...
  "@vitescv/pinia":{
    // 预设的store
    'user':'./store/user.js',
    ...
  }
}
```


配置后在应用的上下文`Context`中提供了`Pinia`对象，和vue示例中的`this.Pinia`方便其他模块使用，API如下:

```js
// 
pinia,             //当前pinia实例 ,一般在模块中app未初始化时，配合useStore用
getUseStore(),    //获取某个配置中预设的store的useStore方法
/**---- 以下是Pinia的自有API------**/
defineStore,mapState,mapActions,mapWritableState,mapStores,
```


store文件, vue2,所以还是使用 [Option Store](https://pinia.vuejs.org/zh/core-concepts/#option-stores), 这里只提供store体就行，模块会自动调用`defineStore`初始化，文件名即store名.
```js
//  ./store/user.js
export default {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
  persist: true,     //开启持久化
}
// 模块中使用
const useUserStore = context.Pinia.stores.user
// 页面中使用
const useUserStore = this.Pinia.getUseStore('user')

const userStore = useUserStore()


```
