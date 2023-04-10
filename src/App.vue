<script setup lang="ts">
// import { onMounted } from 'vue';
// import { useMainStore } from './stores/main';

// const mainStore = useMainStore()

// onMounted(() => {
// })
</script>

<template>
  <n-loading-bar-provider>
    <div class="w-100vw">
      <n-message-provider>
        <n-dialog-provider>
          <Layout />
        </n-dialog-provider>
      </n-message-provider>
    </div>    
  </n-loading-bar-provider>

</template>

<style scoped>
:root {
  --theme-color: #ffffff;
}

</style>
