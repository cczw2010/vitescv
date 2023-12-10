### 简介

vitescv的vue-meta模块


### 安装

```js
pnpm add @vitescv/vuemeta
```

### 使用

```js
#在config.js中配置
modules:{
  ...
  "@vitescv/vuemeta":{
    // 参考vue-meta设置
    keyName:'head',
    tagIDKeyName:'vmid',
    attribute:'data-vm',
    ssrAppId:'app',
    ssrAttribute:'data-vmssr',
    refreshOnceOnNavigation: true
  },
}
```