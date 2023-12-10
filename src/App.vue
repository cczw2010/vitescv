<template>
  <transition name="fade" mode="out-in" appear>
    <router-view :name="layoutNameKey" :ref="layoutNameKey"></router-view>
  </transition>
</template>
<script>
import {layoutNameKey } from "./constants"
export default {
  data(){
    return {
      layoutNameKey
    }
  },
  // 在捕获一个来自后代组件的错误时被调用
  // errorCaptured(err, vm, info){
  // }
}
</script>