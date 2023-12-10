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


配置后在应用的上下文`context`中提供了`Pinia`对象，方便其他模块使用：

```js
// context.Pinia
{
  pinia,        //当前pinia实例
  defineStore,  //pinia的defineStore可自定义store
  stores,       //所有预设的store的初始化方法
}
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
// 激活了使用
const store = context.Pinia.stores.user()
```
