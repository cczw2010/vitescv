<template>
  <router-view :name="pageNameKey" :ref="pageNameKey"></router-view>
</template>
<script>
  import { pageNameKey } from '../constants';
  export default {
    name:'AppView',
    data(){
      return {
        pageNameKey
      }
    },
  }
</script>