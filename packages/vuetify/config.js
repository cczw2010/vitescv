/**
 * 本文件专用于 @vitescv/xxx 扩展包来有限扩展vite.config.js, 文件模块不适用
 * type:  代表类型,后期可能会考虑根据类型差异化处理
 * options: 代表针对type的配置
 * 关于Monorepo 和链接依赖,参考：https://cn.vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
 */
// import {VuetifyResolver} from "unplugin-vue-components/resolvers"

export default {
  // 💡unplugin-vue-components/vite  resolvers项,！！！与项目config.js中不同的是，这里可以是一个初始化方法，模块配置中的resolver属性会当做配置信息注入到该方法里，方便定制化
  UIResolvers:[
    // VuetifyResolver
    // {
    //   type: "component",
    //   resolve: (name) => {
    //     if (name.match(/^V[A-Z]/))
    //       return { name, from: "@vitescv/vuetify/components" };
    //   }
    // }
  ],
  // 💡 扩展vite.config.js的rollupOptions.output.manualChunks设置项
  manualChunks:{'vvuetify': ['vuetify','@vitescv/vuetify']},
}