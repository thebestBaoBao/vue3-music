<template>
  <n-grid cols="2 s:3 m:5 l:5 xl:5 2xl:7" responsive="screen" :x-gap="12" :y-gap="8">
    <n-grid-item v-for="(item, index) in 15" :key="index" class="group cursor-pointer">
      <n-skeleton height="12vw" width="100%" :sharp="false" />
      <n-skeleton text :sharp="false" />
    </n-grid-item>
  </n-grid>
</template>

<style scoped>
</style>
