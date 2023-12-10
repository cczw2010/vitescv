import createApp from 'vitescv/app'
const { app ,router} =  createApp()
// router ready
router.onReady(function(){
  console.debug("[app] client router.onReady")
  //CSR：div#app用来挂载，会被成成的APP ROOT替换掉，
  app.$mount('#app')
  // 客户端解析和跳转路由时
  router.beforeResolve((to, from, next) => {
    console.debug("[app] client router.beforeResolve. from:",from.fullPath,'to:',to.fullPath)
    return next()
  })
})

