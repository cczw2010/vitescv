/**
 * 本文件专用于 @vitescv/xxx 扩展包来有限扩展vite.config.js, 文件模块不适用
 * type:  代表类型,后期可能会考虑根据类型差异化处理
 * options: 代表针对type的配置
 * 关于Monorepo 和链接依赖,参考：https://cn.vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies
 */
export default {
  manualChunks:{'vpinia': ['pinia','pinia-plugin-persistedstate','@vitescv/pinia']},
}

